"""
Persistent Cache Layer for 'AI for Everyone' pipeline.
Cache key: (story_id, role, track).
Regenerates only if the underlying story's verified facts change.
"""

import sqlite3
import json
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any


class PipelineCache:
    """SQLite-backed cache per (story_id, role, track)."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or str(Path(__file__).parent / "pipeline_cache.db")
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS card_cache (
                    cache_key TEXT PRIMARY KEY,
                    story_id TEXT,
                    role TEXT,
                    track TEXT,
                    facts_hash TEXT,
                    payload TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def _compute_facts_hash(self, facts: list) -> str:
        serialized = json.dumps([f.get("statement", "") for f in facts], sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def get(self, story_id: str, role: str, track: str, current_facts: list) -> Optional[Dict[str, Any]]:
        facts_hash = self._compute_facts_hash(current_facts)
        cache_key = f"{story_id}::{role}::{track}"

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT facts_hash, payload FROM card_cache WHERE cache_key = ?
            """, (cache_key,))
            row = cursor.fetchone()
            if row:
                stored_hash, payload_str = row
                if stored_hash == facts_hash:
                    return json.loads(payload_str)
        return None

    def set(self, story_id: str, role: str, track: str, current_facts: list, payload: Dict[str, Any]):
        facts_hash = self._compute_facts_hash(current_facts)
        cache_key = f"{story_id}::{role}::{track}"

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO card_cache (cache_key, story_id, role, track, facts_hash, payload)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (cache_key, story_id, role, track, facts_hash, json.dumps(payload)))
            conn.commit()
