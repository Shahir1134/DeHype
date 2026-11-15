"""
Repository layer — all DB access goes through here.
Supports SQLite (local dev) and PostgreSQL (production via DATABASE_URL env var).
"""
import os
import re
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

_raw_url = os.environ.get("DATABASE_URL", "platform_v2.db")
# Normalize postgresql+psycopg2:// or postgres:// for raw connection
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql://", 1)
elif _raw_url.startswith("postgresql+psycopg2://"):
    _raw_url = _raw_url.replace("postgresql+psycopg2://", "postgresql://", 1)

DB_PATH = _raw_url
_IS_PG = "postgresql" in DB_PATH


def _json_safe(value):
    if hasattr(value, "model_dump"):
        return _json_safe(value.model_dump(mode="json"))
    if hasattr(value, "dict"):
        return _json_safe(value.dict())
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_safe(val) for key, val in value.items()}
    return value


class _PGCursorWrapper:
    """Adapts a psycopg2 cursor to mimic sqlite3 cursor API with dict access."""
    def __init__(self, raw_cursor):
        self._cur = raw_cursor

    def execute(self, sql, params=None):
        cleaned_sql = sql
        # Convert SQLite ? placeholders to Postgres %s
        cleaned_sql = re.sub(r'\?', '%s', cleaned_sql)
        # Convert SQLite INSERT OR IGNORE INTO to Postgres ON CONFLICT DO NOTHING
        if "INSERT OR IGNORE INTO" in cleaned_sql:
            cleaned_sql = cleaned_sql.replace("INSERT OR IGNORE INTO", "INSERT INTO")
            if "ON CONFLICT" not in cleaned_sql:
                cleaned_sql = cleaned_sql.rstrip(";\n ") + " ON CONFLICT DO NOTHING"

        if params is not None:
            return self._cur.execute(cleaned_sql, params)
        else:
            return self._cur.execute(cleaned_sql)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def __getattr__(self, name):
        return getattr(self._cur, name)


class _PGConnWrapper:
    """Adapts a psycopg2 connection to mimic sqlite3 connection API."""
    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        import psycopg2.extras
        return _PGCursorWrapper(self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor))

    def execute(self, sql, params=None):
        cur = self.cursor()
        return cur.execute(sql, params)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)


def _conn():
    """Returns a connection supporting standard cursor execute/dict access."""
    if _IS_PG:
        import psycopg2
        raw_conn = psycopg2.connect(DB_PATH)
        raw_conn.autocommit = False
        return _PGConnWrapper(raw_conn)
    else:
        import sqlite3
        conn = sqlite3.connect(DB_PATH, timeout=20.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=20000")
        return conn


def ensure_newsroom_tables():
    """Create newsroom tables if they don't exist (idempotent)."""
    conn = _conn()
    c = conn.cursor()

    if _IS_PG:
        statements = [
            """CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                payload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                priority INTEGER DEFAULT 5,
                attempts INTEGER DEFAULT 0,
                next_run_at TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                started_at TEXT,
                finished_at TEXT,
                status TEXT DEFAULT 'running',
                fetched INTEGER DEFAULT 0,
                kept INTEGER DEFAULT 0,
                published INTEGER DEFAULT 0,
                needs_review INTEGER DEFAULT 0,
                rejected INTEGER DEFAULT 0,
                llm_calls INTEGER DEFAULT 0,
                errors TEXT DEFAULT '[]'
            )""",
            """CREATE TABLE IF NOT EXISTS importance_log (
                id SERIAL PRIMARY KEY,
                story_id TEXT NOT NULL,
                run_id TEXT NOT NULL,
                recency REAL DEFAULT 0,
                source_weight REAL DEFAULT 0,
                signal_weight REAL DEFAULT 0,
                score REAL DEFAULT 0,
                reason TEXT,
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS corrections (
                id SERIAL PRIMARY KEY,
                story_id TEXT NOT NULL,
                what_changed TEXT,
                corrected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""
        ]
        for sql in statements:
            c.execute(sql)
        for col, coltype in [("numbers_json", "TEXT DEFAULT '[]'"), ("content_hash", "TEXT DEFAULT ''")]:
            try:
                c.execute(f"ALTER TABLE stories ADD COLUMN {col} {coltype}")
            except Exception:
                pass
    else:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                payload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                priority INTEGER DEFAULT 5,
                attempts INTEGER DEFAULT 0,
                next_run_at TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                started_at TEXT,
                finished_at TEXT,
                status TEXT DEFAULT 'running',
                fetched INTEGER DEFAULT 0,
                kept INTEGER DEFAULT 0,
                published INTEGER DEFAULT 0,
                needs_review INTEGER DEFAULT 0,
                rejected INTEGER DEFAULT 0,
                llm_calls INTEGER DEFAULT 0,
                errors TEXT DEFAULT '[]'
            );

            CREATE TABLE IF NOT EXISTS importance_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                story_id TEXT NOT NULL,
                run_id TEXT NOT NULL,
                recency REAL DEFAULT 0,
                source_weight REAL DEFAULT 0,
                signal_weight REAL DEFAULT 0,
                score REAL DEFAULT 0,
                reason TEXT,
                logged_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS corrections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                story_id TEXT NOT NULL,
                what_changed TEXT,
                corrected_at TEXT DEFAULT (datetime('now'))
            );
        """)
        columns = [row[1] for row in c.execute("PRAGMA table_info(stories)").fetchall()]
        if "numbers_json" not in columns:
            c.execute("ALTER TABLE stories ADD COLUMN numbers_json TEXT DEFAULT '[]'")
        if "content_hash" not in columns:
            c.execute("ALTER TABLE stories ADD COLUMN content_hash TEXT DEFAULT ''")

    conn.commit()
    conn.close()
    logger.info("[Repo] Newsroom tables ensured.")


def start_run(run_id: str) -> bool:
    """Lock: returns False if another run is actively running (<10m old)."""
    conn = _conn()
    c = conn.cursor()
    c.execute("SELECT id, started_at FROM runs WHERE status='running'")
    active = c.fetchone()
    if active:
        started_str = active["started_at"]
        is_stale = False
        try:
            started_dt = datetime.fromisoformat(started_str)
            if (datetime.utcnow() - started_dt).total_seconds() > 600:
                is_stale = True
        except Exception:
            is_stale = True

        if is_stale:
            logger.warning(f"[Repo] Previous run {active['id']} was abandoned/crashed — clearing lock.")
            c.execute("UPDATE runs SET status='crashed', finished_at=? WHERE id=?", (datetime.utcnow().isoformat(), active['id']))
            conn.commit()
        else:
            logger.warning(f"[Repo] Run {active['id']} actively running — skipping.")
            conn.close()
            return False

    c.execute(
        "INSERT OR IGNORE INTO runs (id, started_at, status) VALUES (?,?,?)",
        (run_id, datetime.utcnow().isoformat(), "running")
    )
    conn.commit()
    conn.close()
    return True


def finish_run(run_id: str, stats: Dict):
    conn = _conn()
    c = conn.cursor()
    c.execute("""
        UPDATE runs SET finished_at=?, status=?, fetched=?, kept=?, published=?,
        needs_review=?, rejected=?, llm_calls=?, errors=?
        WHERE id=?
    """, (
        datetime.utcnow().isoformat(),
        stats.get("status", "done"),
        stats.get("fetched", 0),
        stats.get("kept", 0),
        stats.get("published", 0),
        stats.get("needs_review", 0),
        stats.get("rejected", 0),
        stats.get("llm_calls", 0),
        json.dumps(stats.get("errors", [])),
        run_id
    ))
    conn.commit()
    conn.close()


def upsert_story(story: Dict) -> bool:
    """
    Idempotent upsert keyed on story ID and content hash.
    Returns True if new/updated, False if unchanged.
    """
    conn = _conn()
    c = conn.cursor()

    try:
        sid = story["id"]
        content_hash = story.get("content_hash", "") or ""

        c.execute(
            "SELECT id, status, content_hash FROM stories WHERE id=?",
            (sid,)
        )
        existing = c.fetchone()

        if existing:
            stored_hash = existing["content_hash"] or ""
            if content_hash and stored_hash == content_hash:
                return False

            c.execute("""
                UPDATE stories SET
                    title=?,
                    event_date=?,
                    signal_label=?,
                    signal_tier=?,
                    importance=?,
                    status=?,
                    source_count=?,
                    topic_tags_raw=?,
                    facts_json=?,
                    numbers_json=?,
                    content_hash=?
                WHERE id=?
            """, (
                story.get("title"),
                story.get("event_date"),
                story.get("signal_label", "useful"),
                story.get("signal_tier"),
                story.get("importance", 3),
                story.get("status", "verified"),
                story.get("source_count", 1),
                json.dumps(_json_safe(story.get("topic_tags", []))),
                json.dumps(_json_safe(story.get("facts", []))),
                json.dumps(_json_safe(story.get("numbers", []))),
                content_hash,
                sid
            ))
            conn.commit()
            return True

        # Insert new story
        c.execute("""
            INSERT INTO stories (
                id, title, event_date, signal_label, signal_tier,
                importance, status, source_count, topic_tags_raw,
                facts_json, primary_source_url, confidence,
                is_milestone, numbers_json, content_hash
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sid,
            story.get("title"),
            story.get("event_date"),
            story.get("signal_label", "useful"),
            story.get("signal_tier"),
            story.get("importance", 3),
            story.get("status", "verified"),
            story.get("source_count", 1),
            json.dumps(_json_safe(story.get("topic_tags", []))),
            json.dumps(_json_safe(story.get("facts", []))),
            story.get("primary_source_url"),
            story.get("confidence", 0.9),
            story.get("is_milestone", False),
            json.dumps(_json_safe(story.get("numbers", []))),
            content_hash
        ))
        conn.commit()
        return True

    except Exception:
        conn.rollback()
        logger.exception("[Repository] Failed to upsert story %s", story.get("id"))
        raise
    finally:
        conn.close()


def persist_story_sources(story_id: str, extracted_articles: List[Any]) -> int:
    """Stores sources/articles for a story idempotently."""
    conn = _conn()
    c = conn.cursor()
    saved = 0

    try:
        for index, art in enumerate(extracted_articles):
            raw_url = getattr(art, "url", None) or ""
            url = raw_url.strip()
            if not url or not url.startswith("http"):
                continue

            parsed = urlparse(url)
            source_name = parsed.netloc.replace("www.", "")
            source_id = f"source-{hashlib.md5(source_name.encode('utf-8')).hexdigest()[:8]}"
            article_id = f"art-{hashlib.md5(url.encode('utf-8')).hexdigest()[:12]}"

            badge = "News"
            lower_name = source_name.lower()
            if any(term in lower_name for term in ["blog.", "openai", "google", "meta", "anthropic", "github"]):
                badge = "Official"
            elif any(term in lower_name for term in ["arxiv", "biorxiv", "openreview"]):
                badge = "Research (not peer reviewed)"
            elif any(term in lower_name for term in ["reddit", "hacker news", "ycombinator", "discord"]):
                badge = "Community discussion"
            elif any(term in lower_name for term in ["nist", "europa.eu", "gov", "cisa"]):
                badge = "Government"

            c.execute("""
                INSERT OR IGNORE INTO sources
                (id, name, type, feed_url)
                VALUES (?, ?, ?, ?)
            """, (source_id, source_name, "news", f"https://{parsed.netloc}"))

            c.execute("""
                INSERT OR IGNORE INTO articles
                (id, source_id, url, title, published_at, own_words_summary)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                article_id,
                source_id,
                url,
                (getattr(art, "title", None) or "Untitled")[:256],
                (getattr(art, "date", None) or datetime.utcnow().strftime("%Y-%m-%d"))[:32],
                (getattr(art, "summary", None) or getattr(art, "title", None) or "No summary available")[:5000]
            ))

            c.execute("SELECT id FROM articles WHERE url = ?", (url,))
            article_row = c.fetchone()
            if not article_row:
                continue

            actual_article_id = article_row["id"]

            c.execute("""
                SELECT id FROM story_sources
                WHERE story_id = ? AND url = ?
            """, (story_id, url))

            if c.fetchone():
                continue

            c.execute("""
                INSERT INTO story_sources
                (story_id, article_id, origin_id, url, display_label,
                 type_badge, is_primary, link_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                story_id,
                actual_article_id,
                source_id,
                url,
                source_name[:128],
                badge,
                index == 0,
                "ok"
            ))
            saved += 1

        conn.commit()
        return saved

    except Exception:
        conn.rollback()
        logger.exception("[Repository] Failed to persist sources for story %s", story_id)
        raise
    finally:
        conn.close()


def get_stories_needing_persona_cards(persona_ids: List[str], candidate_stories: Optional[List[Dict]] = None) -> List[Dict]:
    """Returns stories where persona cards are missing or stale (>7 days old)."""
    conn = _conn()
    c = conn.cursor()
    cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()

    story_pool: Dict[str, Dict] = {}
    if candidate_stories:
        for cs in candidate_stories:
            story_pool[cs["id"]] = cs

    c.execute("""
        SELECT id, title, event_date, signal_label, importance, facts_json, topic_tags_raw
        FROM stories
        WHERE LOWER(signal_label)='useful' AND status='verified'
        ORDER BY event_date DESC LIMIT 20
    """)
    for r in c.fetchall():
        d = dict(r)
        if d["id"] not in story_pool:
            story_pool[d["id"]] = d

    needs_regen = []
    for sid, story in story_pool.items():
        needs = False
        for persona_id in persona_ids:
            c.execute("""
                SELECT id, verified_at FROM persona_cards
                WHERE story_id=? AND persona_id=? AND depth='simple'
            """, (sid, persona_id))
            card = c.fetchone()
            if not card:
                needs = True
                break
            gen_at = card.get("verified_at") if isinstance(card, dict) else (card["verified_at"] if "verified_at" in card.keys() else None)
            if gen_at and str(gen_at) < cutoff:
                needs = True
                break
        if needs:
            needs_regen.append(story)

    conn.close()
    return needs_regen


def get_pending_jobs(limit: int = 10) -> List[Dict]:
    conn = _conn()
    c = conn.cursor()
    c.execute("""
        SELECT * FROM jobs WHERE status='pending'
        ORDER BY priority ASC, created_at ASC LIMIT ?
    """, (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def mark_job_done(job_id: int):
    conn = _conn()
    c = conn.cursor()
    c.execute("UPDATE jobs SET status='done' WHERE id=?", (job_id,))
    conn.commit()
    conn.close()


def log_importance(story_id: str, run_id: str, score: float, reason: str, **kwargs):
    conn = _conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO importance_log (story_id, run_id, recency, source_weight, signal_weight, score, reason)
        VALUES (?,?,?,?,?,?,?)
    """, (
        story_id, run_id,
        kwargs.get("recency", 0), kwargs.get("source_weight", 0),
        kwargs.get("signal_weight", 0), score, reason
    ))
    conn.commit()
    conn.close()


def get_last_run_summary() -> Optional[Dict]:
    conn = _conn()
    c = conn.cursor()
    c.execute("SELECT * FROM runs WHERE status='done' ORDER BY finished_at DESC LIMIT 1")
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None
