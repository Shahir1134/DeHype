"""
Persona card generator with Gap fix 2:
Only regenerate when story is new, state changed, importance shifted >20%, or card is >7 days old.
"""
import json
import logging
import sqlite3
import os
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

PERSONAS = ["student", "teacher", "entrepreneur", "engineer_office"]
PERSONA_LABELS = {
    "student": "Student",
    "teacher": "Teacher",
    "entrepreneur": "Entrepreneur",
    "engineer_office": "Office / Engineer"
}

DB_PATH = os.environ.get("DATABASE_URL", "platform_v2.db")



PLACEHOLDER_VALUES = {
    "", "unknown", "unavailable", "n/a", "na", "none",
    "not available", "not known", "null"
}


def _has_meaningful_text(value) -> bool:
    if not isinstance(value, str):
        return False

    cleaned = value.strip().lower()

    if cleaned in PLACEHOLDER_VALUES:
        return False

    return len(cleaned) >= 12


def _card_has_quality(card_data: Dict) -> bool:
    """
    Check the essential explanatory fields.
    Supports both current nested cards and older flat cards.
    """

    if not isinstance(card_data, dict):
        return False

    glance = card_data.get("glance", {})
    explain = card_data.get("explain", {})

    if not isinstance(glance, dict):
        glance = {}

    if not isinstance(explain, dict):
        explain = {}

    headline = card_data.get("headline", "")
    summary = glance.get(
        "summary",
        card_data.get("summary", "")
    )
    what_happened = explain.get(
        "what_happened",
        card_data.get("what_happened", "")
    )
    why_it_matters = explain.get(
        "why_it_matters",
        card_data.get("why_it_matters", "")
    )
    try_it_today = explain.get(
        "try_it_today",
        card_data.get("try_it_today", "")
    )

    essential_fields = [
        headline,
        summary,
        what_happened,
        why_it_matters,
        try_it_today,
    ]

    # Reject any card where an essential field is literally "unknown"
    for field in essential_fields:
        if isinstance(field, str) and field.strip().lower() == "unknown":
            return False

    return all(_has_meaningful_text(field) for field in essential_fields)



def _needs_regen(
    story_id: str,
    persona_id: str,
    old_importance: Optional[int],
    new_importance: int
) -> bool:

    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row

    try:
        card = conn.execute("""
            SELECT id, verified_at, card_json
            FROM persona_cards
            WHERE story_id = ?
              AND persona_id = ?
              AND depth = 'simple'
            ORDER BY id DESC
            LIMIT 1
        """, (story_id, persona_id)).fetchone()
    finally:
        conn.close()

    if card is None:
        return True

    try:
        card_data = json.loads(card["card_json"] or "{}")

        if not isinstance(card_data, dict):
            return True

    except (json.JSONDecodeError, TypeError, ValueError):
        return True

    verified_at = card["verified_at"]

    # Retry invalid cards with a six-hour cooldown.
    if not _card_has_quality(card_data):

        last_attempt = card_data.get("_regen_attempt_at")

        if not last_attempt:
            return True

        try:
            attempt_at = datetime.fromisoformat(last_attempt)

            now = (
                datetime.now(attempt_at.tzinfo)
                if attempt_at.tzinfo
                else datetime.utcnow()
            )

            return (now - attempt_at).total_seconds() >= 6 * 3600

        except (ValueError, TypeError):
            return True

    explain = card_data.get("explain", {})
    glance = card_data.get("glance", {})

    if not isinstance(explain, dict):
        explain = {}

    if not isinstance(glance, dict):
        glance = {}

    is_fallback = (
        card_data.get("_generation_status") == "deterministic_fallback"
        or explain.get("better_than_before") == "Comparison not available."
        or explain.get("limitations") == "Further details are not available."
        or explain.get("try_it_today") == "Check the original source for details."
        or glance.get("can_you_use_it") == "Availability not verified."
    )

    if is_fallback:
        if not verified_at:
            return True

        try:
            gen_at = datetime.fromisoformat(verified_at)

            now = (
                datetime.now(gen_at.tzinfo)
                if gen_at.tzinfo
                else datetime.utcnow()
            )

            return (now - gen_at).total_seconds() >= 6 * 3600

        except (ValueError, TypeError):
            return True

    # Seven-day expiry.
    if verified_at:
        try:
            gen_at = datetime.fromisoformat(verified_at)

            now = (
                datetime.now(gen_at.tzinfo)
                if gen_at.tzinfo
                else datetime.utcnow()
            )

            age_days = (now - gen_at).total_seconds() / 86400

            if age_days >= 7:
                return True

        except (ValueError, TypeError):
            return True

    # Importance shift greater than 20%.
    if old_importance is not None and old_importance > 0:
        shift = abs(new_importance - old_importance) / old_importance

        if shift > 0.20:
            return True

    return False





def build_prompt(story: Dict, persona_id: str) -> str:
    persona_label = PERSONA_LABELS.get(persona_id, persona_id)

    facts = story.get("facts_json", "[]")
    if isinstance(facts, str):
        try:
            facts = json.loads(facts)
        except Exception:
            facts = []

    facts_text = "\n".join(
        f"- {fact}" for fact in facts[:8]
    ) if facts else "No verified facts available."

    return f"""
You are an AI news educator writing for a {persona_label}.

STORY:
{story.get('title', '')}

DATE:
{story.get('event_date', '')}

VERIFIED FACTS:
{facts_text}

Create a personalized news card using ONLY the supplied information.

Return exactly this JSON structure:

{{
  "headline": "Short engaging headline (max 12 words)",
  "glance": {{
    "summary": "2-3 sentence plain-language summary of exactly what happened",
    "should_you_care": "2-3 sentences on why this directly matters to a {persona_label}",
    "can_you_use_it": "Availability — only state facts. If unknown, write: Not yet confirmed.",
    "read_time": "1 min read"
  }},
  "explain": {{
    "what_happened": "3-4 clear sentences explaining what occurred, who did it, and what changed",
    "better_than_before": "How this compares to what existed before, or: No direct comparison available.",
    "limitations": "Known limitations, or: Limitations not yet publicly disclosed.",
    "why_it_matters": "3-4 sentences grounded in the facts explaining the real-world impact for a {persona_label}",
    "try_it_today": "A specific, actionable sentence the {persona_label} can act on NOW. If the product is not released, write: Search the official site or follow the developer's announcements for release updates.",
    "watch_out": "One important caution or thing to verify before acting",
    "product_name": "Name of the product or development",
    "official_link": "Official URL only if one is explicitly mentioned in verified facts, otherwise leave as empty string"
  }}
}}

Rules:
- NEVER write the word "unknown" anywhere in the JSON.
- Do not invent availability, pricing, capabilities, or release dates.
- Do not claim something is free unless a verified fact states it.
- Do not invent official URLs — use empty string if not in verified facts.
- Essential fields (headline, summary, what_happened, why_it_matters, try_it_today)
  MUST contain substantive, specific sentences — not placeholders.
- why_it_matters must be specific to a {persona_label}, not generic.
- try_it_today must be a concrete action sentence. If the tool is unavailable,
  direct the reader to search or follow updates — never say "unknown".
- what_happened must have at least 3 sentences covering who, what, and why now.
- Use simple language a non-technical {persona_label} would understand.
- Return ONLY valid JSON with no markdown fences.
"""





def generate_card(story: Dict, persona_id: str, llm_client) -> Optional[Dict]:
    """Generate and validate one persona card."""

    prompt = build_prompt(story, persona_id)

    raw = llm_client.call(
        prompt,
        priority=5,
        task_id=f"card_{story['id']}_{persona_id}"
    )

    if not raw:
        logger.warning(
            f"[CardGen] Empty LLM response for {story['id']}:{persona_id}"
        )
        return None

    raw = raw.strip()

    # Remove optional Markdown fences
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    try:
        card = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning(
            f"[CardGen] Invalid JSON for {story['id']}:{persona_id}: {e}"
        )
        logger.debug("[CardGen] Raw response: %s", raw[:1000])
        return None

    
    required = {"headline", "glance", "explain"}

    if not isinstance(card, dict) or not required.issubset(card):
        logger.warning("[CardGen] Missing required card fields")
        return None

    glance_fields = {
        "summary",
        "should_you_care",
        "can_you_use_it",
        "read_time"
    }

    explain_fields = {
        "what_happened",
        "better_than_before",
        "limitations",
        "why_it_matters",
        "try_it_today",
        "watch_out",
        "product_name",
        "official_link"
    }

    if not isinstance(card["glance"], dict):
        return None

    if not isinstance(card["explain"], dict):
        return None

    if not glance_fields.issubset(card["glance"]):
        return None

    if not explain_fields.issubset(card["explain"]):
        return None
    if not _card_has_quality(card):
        logger.warning(
            f"[CardGen] Quality validation failed for "
            f"{story['id']}:{persona_id}"
        )
        return None
    return card





def save_card(story_id: str, persona_id: str, card_data: Dict):
    spoken = card_data.get("spoken_text")

    if not spoken:
        headline = card_data.get("headline", "")
        what = card_data.get("explain", {}).get("what_happened", "")

        if not what:
            what = card_data.get("glance", {}).get("summary", "")

        spoken = f"{headline}. {what}".strip() or "AI news update."

    conn = sqlite3.connect(DB_PATH, timeout=20.0)

    try:
        c = conn.cursor()

        c.execute("""
            INSERT INTO persona_cards (
                story_id,
                persona_id,
                depth,
                card_json,
                spoken_text,
                verified_at
            )
            VALUES (?, ?, 'simple', ?, ?, ?)

            ON CONFLICT(story_id, persona_id)
            DO UPDATE SET
                depth = excluded.depth,
                card_json = excluded.card_json,
                spoken_text = excluded.spoken_text,
                verified_at = excluded.verified_at
        """, (
            story_id,
            persona_id,
            json.dumps(card_data),
            spoken,
            datetime.utcnow().isoformat()
        ))

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()




def make_deterministic_card(story: Dict, persona_id: str) -> Dict:
    persona_label = PERSONA_LABELS.get(persona_id, persona_id)

    headline = story.get("title", "AI Update")

    facts = story.get("facts_json", "[]")
    if isinstance(facts, str):
        try:
            facts = json.loads(facts)
        except Exception:
            facts = []

    first_fact = (
        facts[0] if facts and isinstance(facts[0], str)
        else headline
    )

    return {
        "headline": headline[:80],

        "glance": {
            "summary": first_fact,
            "should_you_care": (
                f"This development may be relevant to your work "
                f"as a {persona_label}."
            ),
            "can_you_use_it": "Availability not verified.",
            "read_time": "1 min read"
        },

        "explain": {
            "what_happened": first_fact,
            "better_than_before": "Comparison not available.",
            "limitations": "Further details are not available.",
            "why_it_matters": (
                f"This development may affect AI tools and "
                f"workflows relevant to a {persona_label}."
            ),
            "try_it_today": (
                f"Search for '{headline[:50]}' to find the official "
                f"announcement and explore whether it applies to your work."
            ),
            "watch_out": "Verify availability and requirements before use.",
            "product_name": headline,
            "official_link": ""
        }
    }


def record_regen_attempt(story_id: str, persona_id: str):
    conn = sqlite3.connect(DB_PATH, timeout=20.0)

    try:
        c = conn.cursor()

        row = c.execute("""
            SELECT card_json
            FROM persona_cards
            WHERE story_id = ?
              AND persona_id = ?
              AND depth = 'simple'
            ORDER BY id DESC
            LIMIT 1
        """, (story_id, persona_id)).fetchone()

        if not row:
            return

        card_data = json.loads(row[0] or "{}")

        if not isinstance(card_data, dict):
            return

        card_data["_regen_attempt_at"] = datetime.utcnow().isoformat()

        c.execute("""
            UPDATE persona_cards
            SET card_json = ?
            WHERE story_id = ?
              AND persona_id = ?
              AND depth = 'simple'
        """, (
            json.dumps(card_data),
            story_id,
            persona_id
        ))

        conn.commit()

    except Exception:
        conn.rollback()
        logger.exception(
            f"[CardGen] Could not record retry for {story_id}:{persona_id}"
        )

    finally:
        conn.close()



def regenerate_cards_for_stories(
    stories: List[Dict],
    llm_client,
    force: bool = False
) -> int:

    """
    Regenerate only missing, outdated, or low-quality cards.
    Failed regeneration never overwrites an existing card.
    """

    generated = 0

    for story in stories:
        sid = story["id"]
        new_importance = story.get("importance", 3)

        try:
            conn = sqlite3.connect(DB_PATH, timeout=20.0)
            c = conn.cursor()

            c.execute(
                "SELECT importance FROM stories WHERE id=?",
                (sid,)
            )

            row = c.fetchone()
            old_importance = row[0] if row else None

            conn.close()

        except Exception:
            old_importance = None

        for persona_id in PERSONAS:

            if not force and not _needs_regen(
                sid,
                persona_id,
                old_importance,
                new_importance
            ):
                logger.info(
                    f"[CardGen] Skipping {sid}:{persona_id} - card is healthy"
                )
                continue

            if llm_client.calls_used >= 18:
                logger.info(
                    f"[CardGen] Budget exhausted. Skipping {sid}:{persona_id}"
                )
                continue

            # Check whether a card already exists.
            conn = sqlite3.connect(DB_PATH, timeout=20.0)

            try:
                existing = conn.execute("""
                    SELECT 1
                    FROM persona_cards
                    WHERE story_id = ?
                      AND persona_id = ?
                      AND depth = 'simple'
                    LIMIT 1
                """, (sid, persona_id)).fetchone()

            finally:
                conn.close()

            card = generate_card(story, persona_id, llm_client)

            if card:
                card["_generation_status"] = "llm_generated"

                save_card(sid, persona_id, card)
                generated += 1

                logger.info(
                    f"[CardGen] Saved quality-checked card for {sid}:{persona_id}"
                )

                continue

            # Failed generation: preserve existing card.
            if existing:
                record_regen_attempt(sid, persona_id)

                logger.warning(
                    f"[CardGen] Keeping existing card after failed regeneration: "
                    f"{sid}:{persona_id}"
                )

                continue

            # No existing card: create a clearly labelled fallback.
            fallback = make_deterministic_card(story, persona_id)
            fallback["_generation_status"] = "deterministic_fallback"

            save_card(sid, persona_id, fallback)
            generated += 1

            logger.warning(
                f"[CardGen] Saved deterministic fallback for {sid}:{persona_id}"
            )

    return generated
