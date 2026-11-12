"""
RSS News Fetcher + Gemini Flash Scorer
======================================
Pulls from high-signal AI RSS feeds, scores each item for:
  - overall_importance (1-5)
  - persona relevance for each of the 4 personas (0-10)
  - does_it_matter: short plain-English "why it matters to you" per persona
  - hype_flag: True if it is marketing / product announcement without substance

Writes results to live_news.db (SQLite) so the FastAPI /live-news endpoint
can serve them without the script being in the request path.

Run:
  python scripts/rss_fetcher.py           # one-shot
  python scripts/rss_fetcher.py --dry-run # print JSON, no DB write

GitHub Actions: .github/workflows/fetch_news.yml runs this every 6 hours.
"""

import argparse
import hashlib
import json
import os
import socket
import sqlite3
import sys
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Prevent any RSS feed from hanging indefinitely
socket.setdefaulttimeout(8)

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import feedparser
except ImportError:
    sys.exit("feedparser not installed. Run: pip install feedparser")

try:
    from google import genai
    from google.genai import types as genai_types
    _USE_NEW_SDK = True
except ImportError:
    try:
        import google.generativeai as genai_legacy
        _USE_NEW_SDK = False
    except ImportError:
        sys.exit("google-genai not installed. Run: pip install google-genai")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "live_news.db"

# High-signal AI RSS feeds — no fluff aggregators
RSS_FEEDS = [
    # Official labs
    {"name": "OpenAI Blog",         "url": "https://openai.com/blog/rss.xml",          "trust": "official"},
    {"name": "Anthropic Blog",      "url": "https://www.anthropic.com/rss.xml",         "trust": "official"},
    {"name": "Google DeepMind",     "url": "https://deepmind.google/blog/rss/",         "trust": "official"},
    {"name": "Meta AI Blog",        "url": "https://ai.meta.com/blog/rss/",             "trust": "official"},
    {"name": "Mistral Blog",        "url": "https://mistral.ai/news/rss.xml",           "trust": "official"},
    # Quality journalism
    {"name": "The Verge AI",        "url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", "trust": "news"},
    {"name": "MIT Tech Review AI",  "url": "https://www.technologyreview.com/feed/",    "trust": "news"},
    {"name": "Ars Technica AI",     "url": "https://feeds.arstechnica.com/arstechnica/index", "trust": "news"},
    {"name": "VentureBeat AI",      "url": "https://venturebeat.com/ai/feed/",          "trust": "news"},
    {"name": "TechCrunch AI",       "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "trust": "news"},
]

PERSONAS = ["student", "teacher", "entrepreneur", "engineer_office"]

PERSONA_CONTEXT = {
    "student": "A university or high-school student who wants to study faster, understand difficult topics, and use free tools.",
    "teacher": "A K-12 or university educator who designs lessons, grades work, and needs tools that protect student privacy.",
    "entrepreneur": "A small-business owner or founder who wants to cut costs, automate repetitive tasks, and find new market opportunities.",
    "engineer_office": "An office worker, analyst, or software developer who wants to automate repetitive tasks and write better code.",
}

# ---------------------------------------------------------------------------
# Database setup
# ---------------------------------------------------------------------------

CREATE_SQL = """
CREATE TABLE IF NOT EXISTS live_news (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    source_name     TEXT NOT NULL,
    source_trust    TEXT NOT NULL,  -- official | news
    url             TEXT NOT NULL UNIQUE,
    published_iso   TEXT NOT NULL,
    fetched_at      TEXT NOT NULL,
    overall_importance INTEGER NOT NULL DEFAULT 3,
    hype_flag       INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
    tags_json       TEXT NOT NULL DEFAULT '[]',
    -- per-persona relevance scores (0-10) and plain-English "why it matters"
    rel_student        INTEGER DEFAULT 0,
    rel_teacher        INTEGER DEFAULT 0,
    rel_entrepreneur   INTEGER DEFAULT 0,
    rel_engineer_office INTEGER DEFAULT 0,
    matter_student     TEXT DEFAULT '',
    matter_teacher     TEXT DEFAULT '',
    matter_entrepreneur TEXT DEFAULT '',
    matter_engineer_office TEXT DEFAULT '',
    -- raw Gemini response for auditing
    gemini_raw      TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_live_news_published ON live_news(published_iso DESC);
CREATE INDEX IF NOT EXISTS idx_live_news_fetched   ON live_news(fetched_at DESC);
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.executescript(CREATE_SQL)
    conn.commit()
    return conn


# ---------------------------------------------------------------------------
# Gemini Flash scorer
# ---------------------------------------------------------------------------

SCORE_PROMPT = """
You are an editorial filter for a plain-English AI news app used by non-technical people.

Headline: {title}
Source: {source} ({trust} source)
Published: {published}

Your job: score this headline and return ONLY valid JSON (no markdown, no explanation).

Return this exact shape:
{{
  "overall_importance": <integer 1-5>,
  "hype_flag": <true or false>,
  "tags": [<up to 4 short topic tags, e.g. "open_weights", "coding", "education", "pricing">],
  "personas": {{
    "student": {{
      "relevance": <integer 0-10>,
      "does_it_matter": "<one plain sentence: what this means for the persona, or empty string if not relevant>"
    }},
    "teacher": {{
      "relevance": <integer 0-10>,
      "does_it_matter": "<one plain sentence>"
    }},
    "entrepreneur": {{
      "relevance": <integer 0-10>,
      "does_it_matter": "<one plain sentence>"
    }},
    "engineer_office": {{
      "relevance": <integer 0-10>,
      "does_it_matter": "<one plain sentence>"
    }}
  }}
}}

Scoring rules:
- overall_importance: 5 = major release everyone should know (GPT-5, Gemini 2, Llama 4 release), 4 = genuinely useful update, 3 = interesting, 2 = minor, 1 = trivia or niche.
- hype_flag = true if the headline is a funding round without a released product, a beta waitlist, vague claims without evidence ("AI will change everything"), or an opinion piece with no factual announcement.
- relevance 0 = completely irrelevant to that persona, 10 = directly affects their daily work or study.
- does_it_matter: write in second person ("You can now..."). Max 15 words. Empty string if relevance < 3.
- Tags: use lowercase_underscore. Common tags: open_weights, coding, education, pricing, policy, multimodal, reasoning, productivity, security, automation, voice, image_gen, video_gen.

Persona contexts:
- student: {student_ctx}
- teacher: {teacher_ctx}
- entrepreneur: {entrepreneur_ctx}
- engineer_office: {engineer_ctx}
"""


def score_with_gemini(title: str, source_name: str, trust: str, published: str, api_key: str) -> Optional[dict]:
    prompt = SCORE_PROMPT.format(
        title=title,
        source=source_name,
        trust=trust,
        published=published,
        student_ctx=PERSONA_CONTEXT["student"],
        teacher_ctx=PERSONA_CONTEXT["teacher"],
        entrepreneur_ctx=PERSONA_CONTEXT["entrepreneur"],
        engineer_ctx=PERSONA_CONTEXT["engineer_office"],
    )

    CANDIDATE_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"]

    for model_name in CANDIDATE_MODELS:
        try:
            if _USE_NEW_SDK:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                raw = response.text.strip()
            else:
                genai_legacy.configure(api_key=api_key)
                model = genai_legacy.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                raw = response.text.strip()

            # Strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw.strip()), raw
        except Exception as e:
            err_str = str(e)
            if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                continue  # Try next fallback model
            print(f"  [Gemini error with {model_name}] {e}")
            return None, ""
    return None, ""


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def make_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Feed pulling
# ---------------------------------------------------------------------------

def fetch_feed(feed_config: dict) -> list[dict]:
    """Return list of raw items from an RSS feed."""
    try:
        parsed = feedparser.parse(
            feed_config["url"],
            agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIForAllRSS/1.0"
        )
        items = []
        for entry in parsed.entries[:20]:  # max 20 per feed per run
            title = getattr(entry, "title", "").strip()
            link = getattr(entry, "link", "").strip()
            published = getattr(entry, "published", "") or getattr(entry, "updated", "")
            if not title or not link:
                continue
            items.append({
                "title": title,
                "url": link,
                "published": published,
                "source_name": feed_config["name"],
                "source_trust": feed_config["trust"],
            })
        return items
    except Exception as e:
        print(f"  [Feed error] {feed_config['name']}: {e}")
        return []


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(dry_run: bool = False, max_new: int = 30, verbose: bool = False):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        # Try loading from project .env
        env_path = ROOT / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("GEMINI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip()
                    break

    if not api_key:
        sys.exit("GEMINI_API_KEY not found. Set it as an env var or in .env")

    conn = get_conn() if not dry_run else None
    existing_ids = set()
    if conn:
        rows = conn.execute("SELECT id FROM live_news").fetchall()
        existing_ids = {r["id"] for r in rows}

    all_items = []
    for feed in RSS_FEEDS:
        print(f"Fetching {feed['name']}...")
        items = fetch_feed(feed)
        print(f"  -> {len(items)} items")
        all_items.extend(items)

    print(f"\nTotal raw items: {len(all_items)}")

    new_count = 0
    results = []

    for item in all_items:
        item_id = make_id(item["url"])
        if item_id in existing_ids:
            if verbose:
                print(f"  [skip] already stored: {item['title'][:60]}")
            continue

        title_safe = item['title'][:70].encode('ascii', errors='replace').decode('ascii')
        print(f"  Scoring: {title_safe}...")
        scored, raw_text = score_with_gemini(
            title=item["title"],
            source_name=item["source_name"],
            trust=item["source_trust"],
            published=item["published"],
            api_key=api_key,
        )

        if scored is None:
            print("    -> scoring failed, skipping")
            continue

        # Skip hype and unimportant items
        if scored.get("hype_flag") and scored.get("overall_importance", 0) < 1:
            print(f"    -> hype + low importance, discarding")
            continue

        personas_data = scored.get("personas", {})
        row = {
            "id": item_id,
            "title": item["title"],
            "source_name": item["source_name"],
            "source_trust": item["source_trust"],
            "url": item["url"],
            "published_iso": item["published"],
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "overall_importance": scored.get("overall_importance", 3),
            "hype_flag": 1 if scored.get("hype_flag") else 0,
            "tags_json": json.dumps(scored.get("tags", [])),
            "rel_student": personas_data.get("student", {}).get("relevance", 0),
            "rel_teacher": personas_data.get("teacher", {}).get("relevance", 0),
            "rel_entrepreneur": personas_data.get("entrepreneur", {}).get("relevance", 0),
            "rel_engineer_office": personas_data.get("engineer_office", {}).get("relevance", 0),
            "matter_student": personas_data.get("student", {}).get("does_it_matter", ""),
            "matter_teacher": personas_data.get("teacher", {}).get("does_it_matter", ""),
            "matter_entrepreneur": personas_data.get("entrepreneur", {}).get("does_it_matter", ""),
            "matter_engineer_office": personas_data.get("engineer_office", {}).get("does_it_matter", ""),
            "gemini_raw": raw_text[:2000],
        }

        if dry_run:
            print(json.dumps(row, indent=2))
            new_count += 1
            results.append(row)
        else:
            try:
                conn.execute("""
                    INSERT OR IGNORE INTO live_news
                    (id, title, source_name, source_trust, url, published_iso, fetched_at,
                     overall_importance, hype_flag, tags_json,
                     rel_student, rel_teacher, rel_entrepreneur, rel_engineer_office,
                     matter_student, matter_teacher, matter_entrepreneur, matter_engineer_office,
                     gemini_raw)
                    VALUES
                    (:id, :title, :source_name, :source_trust, :url, :published_iso, :fetched_at,
                     :overall_importance, :hype_flag, :tags_json,
                     :rel_student, :rel_teacher, :rel_entrepreneur, :rel_engineer_office,
                     :matter_student, :matter_teacher, :matter_entrepreneur, :matter_engineer_office,
                     :gemini_raw)
                """, row)
                conn.commit()
                existing_ids.add(item_id)
                new_count += 1
                results.append(row)
                print(f"    -> saved (importance={row['overall_importance']}, hype={row['hype_flag']})")
            except Exception as e:
                print(f"    -> DB error: {e}")

        if new_count >= max_new:
            print(f"Reached max_new={max_new}, stopping.")
            break

    if conn:
        conn.close()

    print(f"\nDone. {new_count} new items stored.")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch and score AI news")
    parser.add_argument("--dry-run", action="store_true", help="Print results without writing to DB")
    parser.add_argument("--max-new", type=int, default=30, help="Max new items to score per run")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    run(dry_run=args.dry_run, max_new=args.max_new, verbose=args.verbose)
