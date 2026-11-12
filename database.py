"""
Database & Feedback Persistence for 'AI for Everyone'.
- SQLite storage for feedback ratings (#27)
- Persistent glossary terms (#26)
- Cache storage for generated story cards
- Verifier rejection JSONL logger
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any


class PipelineDatabase:
    """Manages SQLite storage for feedback, glossary, and logging."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or str(Path(__file__).parent / "platform.db")
        self.log_file = Path(__file__).parent / "logs" / "verifier_rejections.jsonl"
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self._init_tables()
        self._seed_glossary_if_empty()

    def _init_tables(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Feedback table (#27)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS card_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    story_id TEXT,
                    is_clear INTEGER,
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Glossary table (#26)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS glossary_terms (
                    term TEXT PRIMARY KEY,
                    category TEXT,
                    everyday_analogy TEXT,
                    technical_definition TEXT,
                    concept_of_the_week INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def _seed_glossary_if_empty(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM glossary_terms")
            if cursor.fetchone()[0] == 0:
                initial_terms = [
                    (
                        "Context Window",
                        "Memory",
                        "Like an AI's desk space or short-term memory: how many pages of notes it can keep in front of itself at once.",
                        "The maximum number of tokens an LLM can accept and attend to in a single prompt session.",
                        1  # Concept of the week
                    ),
                    (
                        "Parameters",
                        "Model Size",
                        "Like dials inside a machine's brain; more dials usually allow finer understanding of nuance.",
                        "The internal numerical weights and biases learned during neural network pre-training.",
                        0
                    ),
                    (
                        "Quantization",
                        "Optimization",
                        "Like compressing a 4K movie into a format that plays smoothly on your phone without losing visible picture quality.",
                        "Reducing model precision from 16-bit floating point to 8-bit or 4-bit integers to reduce memory footprint.",
                        0
                    ),
                    (
                        "Test-Time Compute",
                        "Reasoning",
                        "Like a student taking 30 seconds to double-check their scratch paper on an exam instead of blurting out the first thought.",
                        "Allocating additional search rollouts or verification steps during inference to self-correct reasoning.",
                        0
                    )
                ]
                cursor.executemany("""
                    INSERT OR REPLACE INTO glossary_terms (term, category, everyday_analogy, technical_definition, concept_of_the_week)
                    VALUES (?, ?, ?, ?, ?)
                """, initial_terms)
                conn.commit()

    def record_feedback(self, story_id: str, is_clear: bool, comment: str = "") -> int:
        """Fix #27: Save 'Was this clear?' tap per card."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO card_feedback (story_id, is_clear, comment)
                VALUES (?, ?, ?)
            """, (story_id, 1 if is_clear else 0, comment))
            conn.commit()
            return cursor.lastrowid

    def get_feedback_summary(self) -> Dict[str, Any]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*), SUM(is_clear) FROM card_feedback")
            total, clear = cursor.fetchone()
            total = total or 0
            clear = clear or 0
            return {
                "total_responses": total,
                "positive_clear": clear,
                "clarity_rate": round(clear / total * 100, 1) if total > 0 else 100.0
            }

    def get_all_glossary_terms(self) -> List[Dict[str, Any]]:
        """Fix #26: Return all persistent glossary terms."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT term, category, everyday_analogy, technical_definition, concept_of_the_week
                FROM glossary_terms ORDER BY concept_of_the_week DESC, term ASC
            """)
            rows = cursor.fetchall()
            return [
                {
                    "term": r[0],
                    "category": r[1],
                    "everyday_analogy": r[2],
                    "technical_definition": r[3],
                    "concept_of_the_week": bool(r[4])
                }
                for r in rows
            ]

    def log_rejection(self, agent_name: str, story_id: str, reasons: List[str], text_snippet: str = ""):
        """Log verifier rejections to JSONL file."""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent_name,
            "story_id": story_id,
            "reasons": reasons,
            "snippet": text_snippet[:200]
        }
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
