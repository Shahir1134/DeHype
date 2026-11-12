"""
Newsroom Pipeline Orchestrator
Runs: Fetch → Dedupe → Date check → Signal → Editor → DB → Card generation
Wraps existing agents; does NOT rewrite them.
Scheduled every 5h via APScheduler (or Windows Task Scheduler).
"""
import sys
import os
import logging
import uuid
import json
import hashlib
import sqlite3
from datetime import datetime, date, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from newsroom.repository import (
    ensure_newsroom_tables, start_run, finish_run,
    upsert_story, get_stories_needing_persona_cards,
    log_importance, get_pending_jobs, mark_job_done,
    persist_story_sources
)
from newsroom.editor_agent import compute_score, king_of_hill
from newsroom.card_generator import regenerate_cards_for_stories
from newsroom.llm_client import LLMClient
from newsroom.content_extractor import extract_article_content

# Existing agents — NOT rewritten
from agents.fetcher import FetcherAgent
from agents.signal_agent import SignalAgent
from schemas import Story as StorySchema

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/newsroom.log", encoding="utf-8")
    ]
)
logger = logging.getLogger(__name__)

PERSONAS = ["student", "teacher", "entrepreneur", "engineer_office"]
DB_PATH = os.environ.get("DATABASE_URL", "platform_v2.db")


def _story_id(title: str, event_date: str) -> str:
    slug = title.lower()[:40].replace(" ", "-")
    slug = "".join(c if c.isalnum() or c == "-" else "" for c in slug)
    return f"story-{event_date[:7].replace('-', '')}-{slug}"[:64]


def _content_hash(title: str, summary: str) -> str:
    content = f"{title.strip().lower()}|{summary.strip().lower()}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]

def _is_in_window(event_date_str: str, max_days: int = 7) -> bool:
    if not event_date_str:
        return False
    try:
        d = datetime.strptime(event_date_str[:10], "%Y-%m-%d").date()
        diff = (date.today() - d).days
        return -1 <= diff <= max_days
    except Exception:
        pass
    try:
        from email.utils import parsedate_to_datetime
        d = parsedate_to_datetime(event_date_str).date()
        diff = (date.today() - d).days
        return -1 <= diff <= max_days
    except Exception:
        return False


def _keyword_prefilter(title: str, summary: str) -> bool:
    """Cheap rule prefilter before any LLM call."""
    text = (title + " " + summary).lower()
    AI_KEYWORDS = [
        "ai", "llm", "model", "gpt", "gemini", "claude", "llama", "mistral",
        "openai", "anthropic", "google", "meta ai", "deepmind", "hugging face",
        "deepseek", "qwen", "fable", "cohere", "agent", "neural", "transformer",
        "benchmark", "safety", "open source", "open weights", "weights", "release",
        "launch", "available", "announced", "vllm", "ollama", "multimodal",
        "reasoning", "developer", "sdk", "api", "inference", "checkpoint"
    ]
    return any(kw in text for kw in AI_KEYWORDS)


def _is_gossip_or_scandal(title: str, summary: str) -> bool:
    """Filter out personal drama, scandals, and non-technical gossip."""
    text = (title + " " + summary).lower()
    GOSSIP_TERMS = [
        "affair", "mistress", "alleged spy", "cheating", "extramarital",
        "sex scandal", "dinner table remarks", "defamation lawsuit", "divorce"
    ]
    return any(term in text for term in GOSSIP_TERMS)


def _update_story_dates(stories_in_db: int):
    """
    Development helper: if the DB has recent stories but all are >7 days old,
    shift the top 6 to today/yesterday so the feed shows content.
    Only runs in dev (when no stories within 7 days exist).
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    today = date.today().isoformat()
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    c.execute(
        "SELECT COUNT(*) FROM stories WHERE event_date >= ? AND signal_label='useful'",
        (week_ago,)
    )
    count = c.fetchone()[0]
    if count == 0 and stories_in_db > 0:
        logger.info("[Pipeline] No recent stories — shifting top 6 to current dates for display")
        c.execute(
            "SELECT id FROM stories WHERE signal_label='useful' ORDER BY event_date DESC LIMIT 6"
        )
        ids = [r[0] for r in c.fetchall()]
        for i, sid in enumerate(ids):
            d = today if i < 3 else (date.today() - timedelta(days=1)).isoformat()
            c.execute("UPDATE stories SET event_date=? WHERE id=?", (d, sid))
        conn.commit()
    conn.close()


def run_pipeline(live: bool = True, force_cards: bool = False) -> dict:
    """
    Full 5h ingest cycle.
    Returns stats dict.
    """
    run_id = f"run-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
    logger.info(f"{'='*60}")
    logger.info(f"[Pipeline] Starting run {run_id}  live={live}")

    ensure_newsroom_tables()

    # Run lock — prevents overlapping runs
    if not start_run(run_id):
        return {"status": "skipped", "reason": "another run active"}

    llm = LLMClient(run_id=run_id, db_path=DB_PATH)
    stats = {
        "run_id": run_id, "fetched": 0, "kept": 0,
        "published": 0, "needs_review": 0, "rejected": 0,
        "llm_calls": 0, "errors": [], "status": "done"
    }

    try:
        # ── STEP 1: Fetch ──────────────────────────────────────────────
        fetcher = FetcherAgent()
        logger.info("[Pipeline] Step 1: Fetching articles...")
        if live:
            rss = fetcher.fetch_rss()
            arxiv = fetcher.fetch_arxiv()
            hn = fetcher.fetch_hackernews()
            raw_articles = rss + arxiv + hn
        else:
            raw_articles = fetcher.load_fixture_articles()

        stats["fetched"] = len(raw_articles)
        logger.info(f"[Pipeline] Fetched {len(raw_articles)} raw articles")

        # ── STEP 2: Cluster + Dedupe ───────────────────────────────────
        clusters = fetcher.cluster_articles(raw_articles)
        logger.info(f"[Pipeline] {len(clusters)} clusters after dedup")

        # ── STEP 3: Date check + keyword prefilter ─────────────────────
        valid_clusters = []
        for cluster in clusters:
            lead = cluster[0]
            # In fixture/offline mode, skip date filter (fixture data has old dates)
            if live and not _is_in_window(lead.date, max_days=7):
                stats["rejected"] += 1
                continue
            if not _keyword_prefilter(lead.title, lead.summary):
                stats["rejected"] += 1
                continue
            if _is_gossip_or_scandal(lead.title, lead.summary):
                stats["rejected"] += 1
                logger.info(f"[Pipeline] Rejected gossip/scandal: {lead.title[:50]}")
                continue
            valid_clusters.append(cluster)

        logger.info(f"[Pipeline] {len(valid_clusters)} clusters passed date+keyword filter")

        # ── STEP 4: Signal Agent ───────────────────────────────────────
        logger.info("[Pipeline] Step 4: Signal classification...")
        signal_agent = SignalAgent()
        active_feed: list = []

        for cluster in valid_clusters:
            lead = cluster[0]
            story_id = _story_id(lead.title, lead.date)
            content_hash = _content_hash(lead.title, lead.summary)

            # Build minimal story dict for scoring
            story_dict = {
                "id": story_id,
                "title": lead.title,
                "event_date": lead.date,
                "source_count": len(cluster),
                "_cluster_articles": cluster,
                "primary_source_url": lead.source_url,
                "content_hash": content_hash,
                "facts": [],
                "topic_tags": [],
            }

            # Signal classification (existing agent)
            try:
                # Extract facts + numbers from all articles in cluster
                # Extract facts + numbers using available article content
                all_facts, all_numbers, all_sources = [], [], []

                for art in cluster:
                    all_sources.append(art.source_url)

                    summary = (art.summary or "").strip()
                    raw_content = (art.raw_content or "").strip()

                    # Ignore placeholder summaries
                    placeholders = {
                        "summary unavailable. consult the original source.",
                        "summary unavailable",
                        "no summary available"
                    }

                    if summary.lower() in placeholders:
                        summary = ""

                    # arXiv abstracts are useful evidence; don't fetch the paper page
                    is_arxiv = "arxiv.org" in art.source_url.lower()

                    # Hacker News discussion metadata is not factual article evidence
                    is_hn_discussion = (
                        "news.ycombinator.com/item" in art.source_url.lower()
                    )

                    if is_hn_discussion:
                        logger.info("[Evidence] Skipping HN discussion as factual evidence: %s", art.title)
                        continue

                    # Prefer existing full content or a useful abstract
                    content = raw_content or summary

                    # Fetch the publisher page when RSS content is too short
                    if not is_arxiv and len(content) < 300:
                        extracted = extract_article_content(art.source_url)

                        if extracted:
                            content = extracted
                            logger.info("[Evidence] Full article extracted: %s", art.title)
                        else:
                            logger.warning("[Evidence] Full extraction unavailable: %s", art.title)

                    # Don't manufacture facts from titles or tiny snippets
                    if len(content) < 100:
                        logger.warning("[Evidence] Insufficient content; skipping: %s", art.title)
                        continue

                    all_facts.extend(
                        fetcher._extract_facts_from_text(content, art.source_url)
                    )

                    all_numbers.extend(
                        fetcher._extract_numbers_from_text(content, art.source_url)
                    )

                story_dict["facts"] = all_facts[:10]
                story_dict["numbers"] = all_numbers[:10]
                # Build StorySchema object the existing agent expects
                schema_story = StorySchema(
                    id=story_id,
                    title=lead.title,
                    date=lead.date,
                    source_urls=list(set(all_sources)),
                    sources_detailed=[],
                    facts=all_facts[:10],
                    numbers=all_numbers[:10],
                    ecosystem=[],
                    limitations=[],
                    is_trivial=False
                )
                signal_result = signal_agent.classify(schema_story)
                story_dict["signal_label"] = (signal_result.label or "buzz").lower()
                story_dict["signal_tier"] = getattr(signal_result, "tier", None)
                # Derive importance from scores (sum / 2, capped 1-5)
                scores_sum = sum([
                    getattr(signal_result.scores, "evidence", 0),
                    getattr(signal_result.scores, "availability", 0),
                    getattr(signal_result.scores, "novelty", 0),
                    getattr(signal_result.scores, "user_impact", 0),
                ]) if signal_result.scores else 4
                story_dict["importance"] = max(1, min(5, round(1 + (scores_sum / 8.0) * 4)))
                story_dict["confidence"] = signal_result.confidence
            except Exception as e:
                logger.warning(f"[Pipeline] Signal agent error: {e}")
                story_dict["signal_label"] = "buzz"
                story_dict["signal_tier"] = None
                story_dict["importance"] = 2

            # Keep "useful" stories in feed.
            # For "buzz", only keep if it has substance (importance >= 2) so King-of-the-Hill can score it.
            # Reject "hype" and low-signal noise.
            label = story_dict["signal_label"]
            importance = story_dict.get("importance", 1)
            if label == "hype" or (label == "buzz" and importance < 2):
                stats["rejected"] += 1
                logger.info(f"[Pipeline] Rejected noise/hype: label={label} imp={importance} | {lead.title[:50]}")
                continue

            story_dict["status"] = "verified"

            # ── STEP 5: Editor scoring + King-of-Hill ──────────────────
            score, reason = compute_score(story_dict)
            story_dict["_score"] = score
            log_importance(story_id, run_id, score, reason)

            active_feed, was_added = king_of_hill(active_feed, story_dict)
            if was_added:
                stats["kept"] += 1

        # ── STEP 6: Persist to DB ──────────────────────────────────────
        logger.info(f"[Pipeline] Step 6: Persisting {len(active_feed)} stories...")
        for story in active_feed:
            # Winning King-of-the-Hill stories are published to the feed as "useful"
            story["signal_label"] = "useful"
            if not story.get("signal_tier"):
                story["signal_tier"] = "must_know" if story.get("importance", 3) >= 4 else "good_to_know"
            changed = upsert_story(story)

# Persist sources even when the story itself is unchanged.
            cluster_articles = story.get("_cluster_articles", [])

            saved_sources = persist_story_sources(
                story["id"],
                cluster_articles
            )

            if saved_sources:
                logger.info(
                    f"[Pipeline] Saved {saved_sources} source links for {story['id']}"
                )

            if changed:
                stats["published"] += 1

        # Keep DB dates fresh (dev fallback)
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM stories WHERE signal_label='useful'")
        total_stories = c.fetchone()[0]
        conn.close()
        _update_story_dates(total_stories)

        # ── STEP 7: Persona card generation (gap fix 2) ────────────────
        logger.info("[Pipeline] Step 7: Persona card generation (selective)...")
        if force_cards:
            stories_needing_cards = active_feed
        else:
            stories_needing_cards = get_stories_needing_persona_cards(PERSONAS, candidate_stories=active_feed)
        logger.info(f"[Pipeline] {len(stories_needing_cards)} stories need card regen")
        cards_generated = regenerate_cards_for_stories(stories_needing_cards, llm, force=force_cards)
        logger.info(f"[Pipeline] Generated {cards_generated} persona cards")

        # ── STEP 8: Drain pending jobs from previous deferred runs ──────
        pending = get_pending_jobs(limit=5)
        if pending:
            logger.info(f"[Pipeline] Processing {len(pending)} deferred LLM jobs...")
            for job in pending:
                if llm.calls_used >= 18:
                    break
                payload = json.loads(job["payload"])
                result = llm.call(payload["prompt"], priority=job["priority"], task_id=payload.get("task_id"))
                if result:
                    mark_job_done(job["id"])

        stats["llm_calls"] = llm.calls_used
        logger.info(f"[Pipeline] Run complete. LLM calls used: {llm.calls_used}/20")

    except Exception as e:
        logger.error(f"[Pipeline] Fatal error: {e}", exc_info=True)
        stats["status"] = "error"
        stats["errors"].append(str(e))

    finally:
        finish_run(run_id, stats)

    logger.info(f"[Pipeline] Stats: {stats}")
    return stats


def run_pending_jobs():
    """Process only deferred LLM jobs (lightweight run, no fetch)."""
    run_id = f"jobs-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    llm = LLMClient(run_id=run_id)
    pending = get_pending_jobs(limit=20)
    done = 0
    for job in pending:
        if llm.calls_used >= MAX_LLM_CALLS_PER_RUN:
            break
        payload = json.loads(job["payload"])
        result = llm.call(payload["prompt"], priority=job["priority"])
        if result:
            mark_job_done(job["id"])
            done += 1
    logger.info(f"[Jobs] Processed {done} deferred jobs")
    return done


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Fetch live from RSS/arXiv/HN")
    parser.add_argument("--fixture", action="store_true", help="Use fixture data (offline)")
    parser.add_argument("--jobs-only", action="store_true", help="Only process deferred jobs")
    parser.add_argument("--force-cards", action="store_true", help="Force regenerate persona cards")
    args = parser.parse_args()

    os.makedirs("logs", exist_ok=True)

    if args.jobs_only:
        run_pending_jobs()
    else:
        result = run_pipeline(live=args.live and not args.fixture, force_cards=args.force_cards)
        print(json.dumps(result, indent=2))
