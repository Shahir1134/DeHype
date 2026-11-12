

"""
LLM Client with Groq primary, Gemini fallback,
rate-limit handling, per-run call cap and SQLite retry queue.
"""

import os
import time
import json
import sqlite3
import logging
import urllib.request
import urllib.error

from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

MAX_LLM_CALLS_PER_RUN = 20
RETRY_DELAYS = [1, 3]

GROQ_MODEL = os.environ.get(
    "GROQ_MODEL", "openai/gpt-oss-120b"
)


def _get_env_value(name: str) -> str:
    """Read a key from environment or project .env file."""
    value = os.environ.get(name, "").strip()
    if value:
        return value.strip('"').strip("'")

    env_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", ".env")
    )

    try:
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()

                if line.startswith(f"{name}="):
                    value = line.split("=", 1)[1].strip()
                    return value.strip('"').strip("'")
    except OSError:
        pass

    return ""


def _get_api_key() -> str:
    """Backward-compatible Gemini key getter."""
    return _get_env_value("GEMINI_API_KEY")


class RateLimitError(Exception):
    pass


class LLMClient:
    """
    Groq primary, Gemini fallback.

    - Tracks successful calls per run.
    - Retries rate limits.
    - Falls back between providers.
    - Defers failed jobs into SQLite.
    """

    def __init__(
        self,
        run_id: str,
        db_path: str = "platform_v2.db"
    ):
        self.run_id = run_id
        self.db_path = db_path
        self.calls_used = 0

        self.groq_api_key = _get_env_value("GROQ_API_KEY")
        self.gemini_api_key = _get_api_key()

        self.groq_model = _get_env_value("GROQ_MODEL") or GROQ_MODEL

        if self.groq_api_key:
            logger.info("[LLM] Groq configured as primary provider")

        if self.gemini_api_key:
            logger.info("[LLM] Gemini configured as fallback provider")

    @staticmethod
    def _is_rate_limit(exc: Exception) -> bool:
        return (
            isinstance(exc, RateLimitError)
            or getattr(exc, "status_code", None) == 429
        )

    def call(
        self,
        prompt: str,
        priority: int = 5,
        task_id: Optional[str] = None
    ) -> Optional[str]:

        if self.calls_used >= MAX_LLM_CALLS_PER_RUN:
            logger.warning(
                f"[LLM] Cap reached — deferring {task_id}"
            )
            self._enqueue_job(prompt, priority, task_id)
            return None

        providers = []

        if self.groq_api_key:
            providers.append(("Groq", self._call_groq))

        if self.gemini_api_key:
            providers.append(("Gemini", self._call_gemini))

        if not providers:
            logger.error("[LLM] No API provider configured")
            self._enqueue_job(prompt, priority, task_id)
            return None

        for provider_name, provider_call in providers:

            for attempt, delay in enumerate(RETRY_DELAYS):
                try:
                    result = provider_call(prompt)

                    if not result:
                        raise ValueError("Empty LLM response")

                    self.calls_used += 1

                    logger.info(
                        f"[LLM] {provider_name} successful "
                        f"({self.calls_used}/{MAX_LLM_CALLS_PER_RUN}) "
                        f"task={task_id}"
                    )

                    return result

                except Exception as exc:

                    if self._is_rate_limit(exc):
                        if attempt < len(RETRY_DELAYS) - 1:
                            logger.warning(
                                f"[LLM] {provider_name} 429 — "
                                f"waiting {delay}s"
                            )
                            time.sleep(delay)
                            continue

                        logger.warning(
                            f"[LLM] {provider_name} rate limit "
                            "exhausted; trying next provider"
                        )
                        break

                    logger.error(
                        f"[LLM] {provider_name} failed: {exc}"
                    )
                    break

        logger.error(
            f"[LLM] All providers failed — deferring {task_id}"
        )

        self._enqueue_job(prompt, priority, task_id)
        return None

    def _call_groq(self, prompt: str) -> str:
        """Generate response using Groq."""

        from groq import Groq

        client = Groq(api_key=self.groq_api_key)

        response = client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Always respond with valid JSON only, no markdown fences."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2048
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Groq returned empty content")

        return content.strip()

    def _call_gemini(self, prompt: str) -> str:
        """Fallback to Gemini."""

        if not self.gemini_api_key:
            raise ValueError("Gemini API key unavailable")

        url = (
            "https://generativelanguage.googleapis.com/v1beta/"
            "models/gemini-2.5-flash:generateContent"
            f"?key={self.gemini_api_key}"
        )

        body = json.dumps({
            "contents": [
                {"parts": [{"text": prompt}]}
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }).encode()

        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read())

                return (
                    data["candidates"][0]
                    ["content"]["parts"][0]["text"].strip()
                )

        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                raise RateLimitError("Gemini 429 rate limit")
            raise

    def _enqueue_job(
        self,
        prompt: str,
        priority: int,
        task_id: Optional[str]
    ):
        """Persist deferred task for future processing."""

        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS jobs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        type TEXT NOT NULL,
                        payload TEXT NOT NULL,
                        status TEXT DEFAULT 'pending',
                        priority INTEGER DEFAULT 5,
                        attempts INTEGER DEFAULT 0,
                        next_run_at TEXT,
                        created_at TEXT DEFAULT (datetime('now'))
                    )
                """)

                conn.execute(
                    """
                    INSERT INTO jobs
                    (type, payload, status, priority, next_run_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        "llm_call",
                        json.dumps({
                            "prompt": prompt,
                            "task_id": task_id
                        }),
                        "pending",
                        priority,
                        datetime.utcnow().isoformat()
                    )
                )

            logger.info(f"[LLM] Deferred task persisted: {task_id}")

        except Exception as exc:
            logger.error(f"[LLM] Failed to enqueue job: {exc}")
