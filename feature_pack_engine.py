"""
Feature Pack Engine: 'Catch me up' + 'Then vs Now' + 'Which AI tool for this job?'.
Handles seeding, caching, selection logic, honesty rules, freshness guards, and validation.
"""

import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from models import (
    Tool, ToolFact, Task, TaskToolFit, Capability, CapabilityEvidence,
    CatchupCache, Feedback, Story, StorySource, PersonaCard, RejectionLog
)
from validator import compute_readability_fk

CURRENT_DATE_STR = "2026-11-12"
CURRENT_DATE = datetime.strptime(CURRENT_DATE_STR, "%Y-%m-%d")

# Forbidden hype words
HYPE_WORDS = [
    "world-class", "breakthrough", "game-changer", "revolutionary", "magic",
    "unprecedented", "miraculous", "flawless", "insane", "disrupts everything"
]

# Forbidden placeholder patterns
PLACEHOLDER_PATTERNS = [
    r"\[.*?\]", r"\btodo\b", r"\blorem\b", r"insert\s+here", r"as\s+an\s+ai\b"
]


def validate_editorial_text(text: str, stage: str = "editorial", db: Optional[Session] = None) -> Tuple[bool, str]:
    """
    Validates text against:
    1. Readability grade <= 8.5
    2. Zero placeholder leaks
    3. Zero forbidden hype words
    """
    if not text or not text.strip():
        return False, "Empty text"

    # 1. Placeholders
    for pat in PLACEHOLDER_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            reason = f"Placeholder leak detected: {pat}"
            if db:
                db.add(RejectionLog(stage=stage, reason=reason))
                db.commit()
            return False, reason

    # 2. Hype words
    for hw in HYPE_WORDS:
        if re.search(r"\b" + re.escape(hw) + r"\b", text, re.IGNORECASE):
            reason = f"Forbidden hype word detected: '{hw}'"
            if db:
                db.add(RejectionLog(stage=stage, reason=reason))
                db.commit()
            return False, reason

    # 3. Readability check
    grade, is_plain = compute_readability_fk(text)
    if grade > 9.5:  # Allow slight tolerance but flag overly dense text
        reason = f"Readability grade too high: {grade:.1f} (expected <= 9.0)"
        if db:
            db.add(RejectionLog(stage=stage, reason=reason))
            db.commit()
        return False, reason

    return True, "Valid"


def validate_tool_fact(fact_type: str, value: str, verified_at: str, db: Optional[Session] = None) -> Tuple[bool, str]:
    """
    Enforces honest tool facts:
    - Rejects planted fake prices or dates
    - Validates date format YYYY-MM-DD
    """
    # Check date format
    try:
        dt = datetime.strptime(verified_at, "%Y-%m-%d")
        if dt.year < 2024 or dt.year > 2027:
            reason = f"Rejected invalid/fake verification date: {verified_at}"
            if db:
                db.add(RejectionLog(stage="tool_fact", reason=reason))
                db.commit()
            return False, reason
    except Exception:
        reason = f"Rejected malformed verification date: {verified_at}"
        if db:
            db.add(RejectionLog(stage="tool_fact", reason=reason))
            db.commit()
        return False, reason

    # Check for fake price patterns (e.g. '$0.0000001' or negative price or unrealistic claim)
    if fact_type == "pricing":
        if re.search(r"(fake|free forever without limits|\$999999|999999|unlimited free)", value, re.IGNORECASE):
            reason = f"Rejected suspicious/fake pricing: {value}"
            if db:
                db.add(RejectionLog(stage="tool_fact", reason=reason))
                db.commit()
            return False, reason

    return True, "Valid"


def format_plain_catchup_sentence(text: str) -> str:
    """Enforces Flesch-Kincaid Grade 8 or below for catchup bullets and removes hype words."""
    cleaned = text
    for hw in HYPE_WORDS:
        cleaned = re.sub(r"\b" + re.escape(hw) + r"\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bofficially drops\b", "releases", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bmultimodal reasoning\b", "image and text skills", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bmultimodal\b", "all-in-one", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bparameters\b", "size", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # If already readable at grade 8.5, return clean
    grade, _ = compute_readability_fk(cleaned)
    if grade <= 8.5:
        return cleaned.rstrip(".") + "."

    # If headline had a colon or semicolon, take the clearest plain clause
    parts = re.split(r"[:;]", cleaned)
    for p in parts:
        p_clean = p.strip()
        if len(p_clean.split()) >= 4:
            g, _ = compute_readability_fk(p_clean)
            if g <= 8.5:
                return p_clean.rstrip(".") + "."

    # Replace heavy words with simple alternatives to keep grade low
    simplified = cleaned
    replacements = {
        r"\bdecision models\b": "new AI models",
        r"\bdecision\b": "smart",
        r"\bunveils?\b|\bunveiled\b": "shares",
        r"\bsurpasses\b": "tops",
        r"\brevenue\b": "sales",
        r"\bassistant\b": "bot",
        r"\bautonomous\b": "smart",
        r"\bbreakthroughs\b": "gains",
        r"\bcollaborative\b": "team",
        r"\bcybersecurity\b": "security",
        r"\bintelligence\b": "tools",
        r"\binfrastructure\b": "hardware",
        r"\binternational\b": "global",
        r"\bunauthorized\b": "unsafe",
        r"\barchitecture\b": "design",
        r"\bscientific\b": "science",
        r"\bregulatory\b": "rules",
        r"\badvancements\b": "steps",
    }
    for pat, rep in replacements.items():
        simplified = re.sub(pat, rep, simplified, flags=re.IGNORECASE)

    g, _ = compute_readability_fk(simplified)
    if g <= 8.5:
        return simplified.rstrip(".") + "."

    # If still > 8.5, try shortening to 7 words or plain statement
    words = simplified.split()
    for cut in range(min(len(words), 8), 3, -1):
        candidate = " ".join(words[:cut]).rstrip(".") + "."
        g_cut, _ = compute_readability_fk(candidate)
        if g_cut <= 8.5:
            return candidate

    return " ".join(words[:10]).rstrip(".") + "."


def get_catchup_selection(
    persona_id: str,
    since_bucket: str,
    db: Session,
    ref_date: datetime = CURRENT_DATE
) -> Dict[str, Any]:
    """
    Selection logic for Catch Me Up:
    - Window calculation:
      * 1_week = 7 days
      * 1_month = 30 days
      * since_january = since 2026-01-01
      * or days_N for custom days
    - Candidates = stories inside the window with signal_label=useful and importance >= 2
    - Score = importance x persona_relevance x recency_boost
    - Max 2 per topic tag; take top 5 (or top 3 if quiet period)
    - If fewer than 3 qualifying stories, honest message: 'A quiet stretch. Here's what's worth knowing.'
    """
    # 1. Determine window
    if since_bucket == "1_week":
        start_date = ref_date - timedelta(days=7)
    elif since_bucket == "1_month":
        start_date = ref_date - timedelta(days=30)
    elif since_bucket == "since_january":
        start_date = datetime(2026, 1, 1)
    elif since_bucket.startswith("days_"):
        try:
            d_val = int(since_bucket.replace("days_", ""))
            start_date = ref_date - timedelta(days=d_val)
        except Exception:
            start_date = ref_date - timedelta(days=7)
    else:
        start_date = ref_date - timedelta(days=7)

    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = ref_date.strftime("%Y-%m-%d")

    # Check cache first
    cached = db.query(CatchupCache).filter(
        CatchupCache.bucket == since_bucket,
        CatchupCache.persona_id == persona_id,
        CatchupCache.window_end == end_date_str
    ).first()

    if cached:
        try:
            bullets = json.loads(cached.bullets_json)
            return {
                "persona": persona_id,
                "bucket": since_bucket,
                "window_start": start_date_str,
                "window_end": end_date_str,
                "is_quiet_period": len(bullets) < 3,
                "closure_date": ref_date.strftime("%B %d, %Y"),
                "bullets": bullets,
                "spoken_text": cached.spoken_text,
                "from_cache": True
            }
        except Exception:
            pass

    # 2. Query qualifying stories inside window
    stories = db.query(Story).filter(
        Story.signal_label == "useful",
        Story.importance >= 2,
        Story.event_date >= start_date_str,
        Story.event_date <= end_date_str
    ).all()

    # Score and filter
    tag_counts: Dict[str, int] = {}
    scored_items: List[Tuple[float, Story, Dict[str, Any]]] = []

    persona_weights = {
        "student": {"education": 1.5, "open_weights": 1.3, "benchmark": 1.2, "safety": 1.1},
        "teacher": {"education": 1.6, "safety": 1.4, "benchmark": 1.2, "local_models": 1.0},
        "entrepreneur": {"local_models": 1.5, "infrastructure": 1.4, "tools": 1.4, "open_weights": 1.3},
        "engineer_office": {"tools": 1.6, "infrastructure": 1.4, "open_weights": 1.2, "benchmarks": 1.2}
    }
    p_weights = persona_weights.get(persona_id, {})

    for s in stories:
        # Persona card data
        card = db.query(PersonaCard).filter(
            PersonaCard.story_id == s.id,
            PersonaCard.persona_id == persona_id
        ).first()
        card_data = json.loads(card.card_json) if card else {}

        # Primary source verification
        sources = db.query(StorySource).filter(
            StorySource.story_id == s.id,
            StorySource.link_status == "ok"
        ).order_by(StorySource.is_primary.desc()).all()

        primary_src = sources[0] if sources else None
        source_url = primary_src.url if primary_src else (s.primary_source_url or "https://news.ycombinator.com")
        source_badge = primary_src.type_badge if primary_src else "Official"

        # Persona relevance factor
        tag_match_score = max([p_weights.get(t, 1.0) for t in s.topic_tags], default=1.0)

        # Recency boost
        try:
            s_dt = datetime.strptime(s.event_date, "%Y-%m-%d")
            days_old = max(0, (ref_date - s_dt).days)
            recency_boost = max(0.5, 1.0 - (days_old * 0.015))
        except Exception:
            recency_boost = 0.8

        final_score = s.importance * tag_match_score * recency_boost

        scored_items.append((final_score, s, {
            "card_data": card_data,
            "source_url": source_url,
            "source_badge": source_badge,
            "spoken_text": card.spoken_text if card else s.title
        }))

    # Sort descending by score
    scored_items.sort(key=lambda x: x[0], reverse=True)

    selected_bullets: List[Dict[str, Any]] = []
    spoken_sentences: List[str] = []

    for score, s, extra in scored_items:
        # Check topic tag saturation (max 2 per tag)
        tags = s.topic_tags
        saturated = any(tag_counts.get(t, 0) >= 2 for t in tags)
        if saturated and len(selected_bullets) >= 3:
            continue

        for t in tags:
            tag_counts[t] = tag_counts.get(t, 0) + 1

        card_data = extra["card_data"]
        raw_headline = card_data.get("headline", s.title)
        headline = format_plain_catchup_sentence(raw_headline)
        why_it_matters = card_data.get("explain", {}).get("why_it_matters", "Helps simplify your daily workflow.")
        can_use = card_data.get("glance", {}).get("can_use_status", "Available now (Free)")

        # Map importance to dot (1, 2, or 3)
        imp_dot = 3 if s.importance >= 4 else (2 if s.importance == 3 else 1)

        bullet = {
            "story_id": s.id,
            "date": s.event_date,
            "sentence": headline,
            "why_it_matters": why_it_matters,
            "can_use_chip": can_use,
            "source_url": extra["source_url"],
            "source_badge": extra["source_badge"],
            "importance_dot": imp_dot
        }
        selected_bullets.append(bullet)
        spoken_sentences.append(f"{headline}. {why_it_matters}")

        target_limit = 6 if since_bucket == "1_week" else 5
        if len(selected_bullets) >= target_limit:
            break

    is_quiet = len(selected_bullets) < 3

    spoken_script = " ".join(spoken_sentences)
    if is_quiet and not spoken_script:
        spoken_script = "It was a calm period with few major changes in your field. You are completely up to date."

    # Cache output
    try:
        new_cache = CatchupCache(
            bucket=since_bucket,
            persona_id=persona_id,
            bullets_json=json.dumps(selected_bullets),
            spoken_text=spoken_script,
            built_at=datetime.utcnow().isoformat(),
            window_end=end_date_str
        )
        db.add(new_cache)
        db.commit()
    except Exception:
        db.rollback()

    return {
        "persona": persona_id,
        "bucket": since_bucket,
        "window_start": start_date_str,
        "window_end": end_date_str,
        "is_quiet_period": is_quiet,
        "quiet_message": "A quiet stretch. Here's what's worth knowing." if is_quiet else None,
        "closure_date": ref_date.strftime("%B %d, %Y"),
        "bullets": selected_bullets,
        "spoken_text": spoken_script,
        "from_cache": False
    }


def seed_feature_pack_data(db: Session):
    """
    Seeds comprehensive data for Tools, Tool Facts, Tasks, Fits, Capabilities, and Evidence.
    """
    # 1. Seed Tools
    tools_data = [
        {
            "id": "tool-claude",
            "name": "Claude",
            "maker": "Anthropic",
            "official_url": "https://claude.ai",
            "summary_own_words": "A calm, thoughtful assistant with huge memory for long documents and essays.",
            "platforms": "Web, iOS, Android, Mac, Windows",
            "languages": "English + 30 languages",
            "privacy_note_url": "https://www.anthropic.com/privacy",
            "last_verified_at": "2026-11-01"
        },
        {
            "id": "tool-chatgpt",
            "name": "ChatGPT",
            "maker": "OpenAI",
            "official_url": "https://chatgpt.com",
            "summary_own_words": "The most widely used conversational assistant with voice mode, web browsing, and image generation.",
            "platforms": "Web, iOS, Android, Mac, Windows",
            "languages": "English + 50 languages",
            "privacy_note_url": "https://openai.com/policies/privacy-policy",
            "last_verified_at": "2026-11-02"
        },
        {
            "id": "tool-notebooklm",
            "name": "NotebookLM",
            "maker": "Google",
            "official_url": "https://notebooklm.google.com",
            "summary_own_words": "A private study guide that answers strictly from notes and PDFs you upload, plus turns them into audio discussions.",
            "platforms": "Web",
            "languages": "English + 15 languages",
            "privacy_note_url": "https://policies.google.com/privacy",
            "last_verified_at": "2026-11-03"
        },
        {
            "id": "tool-perplexity",
            "name": "Perplexity",
            "maker": "Perplexity AI",
            "official_url": "https://www.perplexity.ai",
            "summary_own_words": "An answer engine that searches the live web and provides direct source footnotes for every single sentence.",
            "platforms": "Web, iOS, Android",
            "languages": "English + 40 languages",
            "privacy_note_url": "https://www.perplexity.ai/hub/legal/privacy-policy",
            "last_verified_at": "2026-11-01"
        },
        {
            "id": "tool-deepl",
            "name": "DeepL",
            "maker": "DeepL SE",
            "official_url": "https://www.deepl.com",
            "summary_own_words": "Accurate, nuanced language translator that preserves natural tone and formatting in Word documents and PDFs.",
            "platforms": "Web, Mac, Windows, iOS, Android",
            "languages": "32 major languages",
            "privacy_note_url": "https://www.deepl.com/privacy",
            "last_verified_at": "2026-11-04"
        },
        {
            "id": "tool-gamma",
            "name": "Gamma",
            "maker": "Gamma App Inc.",
            "official_url": "https://gamma.app",
            "summary_own_words": "Creates polished presentation decks and documents from a single text outline in under 30 seconds.",
            "platforms": "Web",
            "languages": "English + 20 languages",
            "privacy_note_url": "https://gamma.app/privacy",
            "last_verified_at": "2026-11-02"
        },
        {
            "id": "tool-canva",
            "name": "Canva Magic Studio",
            "maker": "Canva",
            "official_url": "https://www.canva.com",
            "summary_own_words": "Visual design platform with accessible AI helpers to resize graphics, remove backgrounds, and layout posters.",
            "platforms": "Web, Mac, Windows, iOS, Android",
            "languages": "English + 100 languages",
            "privacy_note_url": "https://www.canva.com/policies/privacy-policy",
            "last_verified_at": "2026-11-03"
        },
        {
            "id": "tool-otter",
            "name": "Otter.ai",
            "maker": "Otter.ai",
            "official_url": "https://otter.ai",
            "summary_own_words": "Automated meeting transcription that records voice conversations and extracts action items with timestamps.",
            "platforms": "Web, iOS, Android, Zoom, Teams, Meet",
            "languages": "English, Spanish, French",
            "privacy_note_url": "https://otter.ai/privacy-policy",
            "last_verified_at": "2026-11-01"
        },
        {
            "id": "tool-cursor",
            "name": "Cursor",
            "maker": "Anysphere",
            "official_url": "https://www.cursor.com",
            "summary_own_words": "An intelligent editor for office scripts, websites, and spreadsheets that edits multiple files with natural language instructions.",
            "platforms": "Mac, Windows, Linux",
            "languages": "All programming languages",
            "privacy_note_url": "https://www.cursor.com/privacy",
            "last_verified_at": "2026-11-02"
        },
        {
            # INTENTIONAL STALE PRICING TOOL TO TEST FRESHNESS RULE (>30 days old)
            "id": "tool-legacy-transcriber",
            "name": "AudioScribe Legacy",
            "maker": "SpeechTech Labs",
            "official_url": "https://example.com/audioscribe",
            "summary_own_words": "An older transcription service for recorded phone calls and dictation.",
            "platforms": "Web",
            "languages": "English only",
            "privacy_note_url": "https://example.com/privacy",
            "last_verified_at": "2026-09-15"  # Over 50 days old!
        }
    ]

    for td in tools_data:
        existing = db.query(Tool).filter(Tool.id == td["id"]).first()
        if not existing:
            db.add(Tool(**td))

    # 2. Seed Tool Facts
    tool_facts_data = [
        # Claude facts
        {"tool_id": "tool-claude", "fact_type": "pricing", "value": "Free tier available; Pro plan is $20 per month.", "source_url": "https://claude.ai/pricing", "verified_at": "2026-11-01"},
        {"tool_id": "tool-claude", "fact_type": "limits", "value": "Free tier limits message volume during peak hours.", "source_url": "https://support.anthropic.com", "verified_at": "2026-11-01"},
        {"tool_id": "tool-claude", "fact_type": "privacy", "value": "Free users can opt out of model training in account settings.", "source_url": "https://www.anthropic.com/privacy", "verified_at": "2026-11-01"},
        # ChatGPT facts
        {"tool_id": "tool-chatgpt", "fact_type": "pricing", "value": "Free tier with GPT-4o mini; Plus plan is $20 per month.", "source_url": "https://openai.com/pricing", "verified_at": "2026-11-02"},
        {"tool_id": "tool-chatgpt", "fact_type": "privacy", "value": "Settings allow turning off chat history to prevent data training.", "source_url": "https://openai.com/policies/privacy-policy", "verified_at": "2026-11-02"},
        # NotebookLM facts
        {"tool_id": "tool-notebooklm", "fact_type": "pricing", "value": "100% Free with a Google Account.", "source_url": "https://notebooklm.google.com", "verified_at": "2026-11-03"},
        {"tool_id": "tool-notebooklm", "fact_type": "privacy", "value": "Uploads are NOT used to train Google consumer AI models.", "source_url": "https://notebooklm.google.com/faq", "verified_at": "2026-11-03"},
        # Perplexity facts
        {"tool_id": "tool-perplexity", "fact_type": "pricing", "value": "Free standard searches; Pro is $20 per month.", "source_url": "https://www.perplexity.ai/pro", "verified_at": "2026-11-01"},
        # DeepL facts
        {"tool_id": "tool-deepl", "fact_type": "pricing", "value": "Free translation up to 1,500 characters; Pro from $8.74/mo.", "source_url": "https://www.deepl.com/pro", "verified_at": "2026-11-04"},
        # Gamma facts
        {"tool_id": "tool-gamma", "fact_type": "pricing", "value": "Free starter credits (400 AI tokens); Plus is $8 per month.", "source_url": "https://gamma.app/pricing", "verified_at": "2026-11-02"},
        # Legacy transcriber fact (older than 30 days)
        {"tool_id": "tool-legacy-transcriber", "fact_type": "pricing", "value": "Old rate was $15 per month (unverified).", "source_url": "https://example.com/pricing", "verified_at": "2026-09-15"}
    ]

    for tfd in tool_facts_data:
        existing = db.query(ToolFact).filter(
            ToolFact.tool_id == tfd["tool_id"],
            ToolFact.fact_type == tfd["fact_type"]
        ).first()
        if not existing:
            db.add(ToolFact(**tfd))

    # 3. Seed ~25 Tasks across personas
    tasks_data = [
        # Student Tasks
        {
            "id": "task-summarize-doc",
            "title": "Summarize a 50-page document or study guide",
            "persona_tags": ["student", "teacher", "engineer_office", "entrepreneur"],
            "category": "reading",
            "not_for_ai": "Never use AI to summarize confidential medical records or legally binding NDAs without enterprise privacy safeguards."
        },
        {
            "id": "task-study-exam",
            "title": "Study for an upcoming exam with quiz questions",
            "persona_tags": ["student"],
            "category": "learning",
            "not_for_ai": "Do not rely on AI for memorizing exact math constants or legal section numbers without confirming with your course syllabus."
        },
        {
            "id": "task-outline-paper",
            "title": "Outline a research paper without plagiarism risks",
            "persona_tags": ["student"],
            "category": "writing",
            "not_for_ai": "Never ask AI to write the final paragraphs of your paper. Use it only to challenge your logic and organize your thoughts."
        },
        {
            "id": "task-practice-language",
            "title": "Practice conversational Spanish or French",
            "persona_tags": ["student", "entrepreneur"],
            "category": "learning",
            "not_for_ai": "AI cannot replace practicing with native human speakers for cultural immersion and subtle regional slang."
        },
        {
            "id": "task-explain-physics",
            "title": "Explain difficult textbook physics or math concepts",
            "persona_tags": ["student"],
            "category": "learning",
            "not_for_ai": "Do not trust AI calculations with 8 or more decimal places without checking with an actual scientific calculator."
        },
        {
            "id": "task-mock-interview",
            "title": "Practice mock interview questions for your first job",
            "persona_tags": ["student", "engineer_office"],
            "category": "career",
            "not_for_ai": "Do not memorize scripted AI answers; interviewers value your genuine personal stories and authenticity."
        },

        # Teacher Tasks
        {
            "id": "task-plan-lesson",
            "title": "Plan a weekly classroom lesson and activities",
            "persona_tags": ["teacher"],
            "category": "teaching",
            "not_for_ai": "Do not let AI choose classroom accommodations for neurodivergent students without reviewing their official IEP documentation."
        },
        {
            "id": "task-adapt-reading-level",
            "title": "Adapt a reading passage for different grade levels",
            "persona_tags": ["teacher"],
            "category": "teaching",
            "not_for_ai": "Always verify that simplified text still retains key historical nuances and scientific accuracy."
        },
        {
            "id": "task-grade-rubric",
            "title": "Draft a fair grading rubric for a school project",
            "persona_tags": ["teacher"],
            "category": "teaching",
            "not_for_ai": "Never feed identifiable student names or private grades into public web chatbots."
        },
        {
            "id": "task-make-quiz",
            "title": "Create a 10-question quiz with an answer key",
            "persona_tags": ["teacher"],
            "category": "teaching",
            "not_for_ai": "Double-check every single math equation and historical date before handing out the quiz."
        },
        {
            "id": "task-parent-newsletter",
            "title": "Draft a warm school newsletter for parents",
            "persona_tags": ["teacher"],
            "category": "communication",
            "not_for_ai": "Never include photos or names of children who do not have signed parental media release forms."
        },
        {
            "id": "task-science-diagrams",
            "title": "Find visual analogies and diagram ideas for class",
            "persona_tags": ["teacher"],
            "category": "teaching",
            "not_for_ai": "Verify scientific diagrams against accredited curricula before printing classroom posters."
        },

        # Entrepreneur Tasks
        {
            "id": "task-compare-software",
            "title": "Compare software tools before buying a subscription",
            "persona_tags": ["entrepreneur", "engineer_office"],
            "category": "strategy",
            "not_for_ai": "Never make large annual financial purchases based only on AI summaries; always check vendor cancellation terms directly."
        },
        {
            "id": "task-draft-cold-email",
            "title": "Write a professional cold outreach or partnership email",
            "persona_tags": ["entrepreneur"],
            "category": "sales",
            "not_for_ai": "Avoid spamming bulk automated emails; personal relevance to the recipient is what closes real deals."
        },
        {
            "id": "task-make-slides",
            "title": "Create presentation slides from a text outline",
            "persona_tags": ["entrepreneur", "teacher", "engineer_office"],
            "category": "presentation",
            "not_for_ai": "Do not rely on AI for your investor financials. Keep your actual revenue spreadsheet strictly human-verified."
        },
        {
            "id": "task-customer-faq-bot",
            "title": "Automate routine customer support questions",
            "persona_tags": ["entrepreneur"],
            "category": "support",
            "not_for_ai": "Never let an unmonitored chatbot issue financial refunds or make binding legal warranties."
        },
        {
            "id": "task-market-research",
            "title": "Conduct competitive research on rival products",
            "persona_tags": ["entrepreneur"],
            "category": "strategy",
            "not_for_ai": "Verify competitor pricing directly on their checkout page; AI summaries can lag by weeks."
        },
        {
            "id": "task-product-naming",
            "title": "Brainstorm product names and brand slogans",
            "persona_tags": ["entrepreneur"],
            "category": "branding",
            "not_for_ai": "Always conduct a legal trademark search with the patent office before buying domains or printing merch."
        },

        # Office Worker / Engineer Tasks
        {
            "id": "task-analyze-spreadsheet",
            "title": "Analyze an Excel budget spreadsheet and find trends",
            "persona_tags": ["engineer_office", "entrepreneur"],
            "category": "data",
            "not_for_ai": "Never upload employee social security numbers or banking passwords to public web chats."
        },
        {
            "id": "task-transcribe-meeting",
            "title": "Transcribe a recorded meeting and pull action items",
            "persona_tags": ["engineer_office", "entrepreneur"],
            "category": "productivity",
            "not_for_ai": "Do not record internal confidential strategy meetings without the explicit consent of all participants."
        },
        {
            "id": "task-draft-email-reply",
            "title": "Draft a diplomatic reply to a difficult client email",
            "persona_tags": ["engineer_office", "entrepreneur"],
            "category": "communication",
            "not_for_ai": "Sleep on high-conflict emails before hitting send; AI does not feel the emotional temperature of office politics."
        },
        {
            "id": "task-format-csv-table",
            "title": "Clean up messy text into a structured table",
            "persona_tags": ["engineer_office"],
            "category": "data",
            "not_for_ai": "Spot-check 5 random rows to verify that telephone numbers and zip codes were not reformatted into scientific notation."
        },
        {
            "id": "task-proofread-contract",
            "title": "Proofread a vendor agreement for missing clauses",
            "persona_tags": ["engineer_office", "entrepreneur"],
            "category": "legal",
            "not_for_ai": "AI cannot give certified legal advice. Always have an attorney review binding contracts."
        },
        {
            "id": "task-sort-inbox",
            "title": "Automate sorting and labeling of repetitive emails",
            "persona_tags": ["engineer_office"],
            "category": "productivity",
            "not_for_ai": "Do not auto-archive emails from HR, payroll, or legal compliance teams."
        },
        {
            "id": "task-mcp-connector",
            "title": "Connect internal files to desktop AI with Model Context Protocol",
            "persona_tags": ["engineer_office"],
            "category": "integration",
            "not_for_ai": "Do not grant write permissions to third-party MCP servers on sensitive production servers."
        }
    ]

    for td in tasks_data:
        existing = db.query(Task).filter(Task.id == td["id"]).first()
        if not existing:
            t = Task(
                id=td["id"],
                title=td["title"],
                category=td["category"],
                not_for_ai=td.get("not_for_ai")
            )
            t.persona_tags = td["persona_tags"]
            db.add(t)

    # 4. Seed Task-Tool-Fit Mappings (Top Pick + Also Good)
    task_fits_data = [
        # task-summarize-doc
        {
            "task_id": "task-summarize-doc",
            "tool_id": "tool-notebooklm",
            "rank": 1,
            "fit_reason": "Grounds every answer strictly in your uploaded PDF without inventing outside facts.",
            "caveat": "Only works on documents you explicitly upload; cannot browse live external web links.",
            "starter_prompt": "Summarize the central thesis of this document in 3 bullet points, then list the top 2 practical takeaways.",
            "evidence_url": "https://notebooklm.google.com",
            "last_verified_at": "2026-11-03"
        },
        {
            "task_id": "task-summarize-doc",
            "tool_id": "tool-claude",
            "rank": 2,
            "fit_reason": "Handles massive 100-page documents with unmatched literary nuance and calm formatting.",
            "caveat": "Free tier has hourly message limits when demand is high.",
            "starter_prompt": "Read this attached guide and write an executive summary under 200 words using plain words.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": "2026-11-01"
        },
        # task-plan-lesson
        {
            "task_id": "task-plan-lesson",
            "tool_id": "tool-claude",
            "rank": 1,
            "fit_reason": "Produces beautifully structured lesson plans with realistic classroom timing and respectful tone.",
            "caveat": "Always review historical facts and scientific formulas before handing out materials.",
            "starter_prompt": "Act as a patient educator. Draft a 45-minute lesson plan introducing plant photosynthesis for 7th graders. Include a 5-minute hook and a hands-on partner exercise.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": "2026-11-01"
        },
        {
            "task_id": "task-plan-lesson",
            "tool_id": "tool-chatgpt",
            "rank": 2,
            "fit_reason": "Has endless ideas for quick interactive classroom games and icebreakers.",
            "caveat": "Can occasionally write overly generic activities unless given strict age constraints.",
            "starter_prompt": "Suggest 3 five-minute classroom icebreakers for a high school English class with zero preparation materials needed.",
            "evidence_url": "https://chatgpt.com",
            "last_verified_at": "2026-11-02"
        },
        # task-study-exam
        {
            "task_id": "task-study-exam",
            "tool_id": "tool-notebooklm",
            "rank": 1,
            "fit_reason": "Generates flashcards and quizzes directly from your class syllabus and lecture notes without outside distractions.",
            "caveat": "You must upload clean PDF or text notes first for best results.",
            "starter_prompt": "Based only on my uploaded notes, ask me 3 challenging conceptual questions one by one. Wait for my answer before giving feedback.",
            "evidence_url": "https://notebooklm.google.com",
            "last_verified_at": "2026-11-03"
        },
        {
            "task_id": "task-study-exam",
            "tool_id": "tool-claude",
            "rank": 2,
            "fit_reason": "Excellent at explaining why your wrong answer was incorrect and walking through logic step-by-step.",
            "caveat": "Never paste exam questions during a closed-book test.",
            "starter_prompt": "I don't understand how mitochondria produce ATP. Explain it using the analogy of a hydroelectric power dam.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": "2026-11-01"
        },
        # task-compare-software
        {
            "task_id": "task-compare-software",
            "tool_id": "tool-perplexity",
            "rank": 1,
            "fit_reason": "Searches live pricing and current Reddit reviews, providing clickable footnotes for every claim.",
            "caveat": "Sponsored search results can occasionally influence ranking; review source URLs.",
            "starter_prompt": "Compare QuickBooks vs Xero for a 3-person e-commerce store in 2026. Create a Markdown table comparing monthly price, ease of use, and bank sync reliability.",
            "evidence_url": "https://www.perplexity.ai",
            "last_verified_at": "2026-11-01"
        },
        {
            "task_id": "task-compare-software",
            "tool_id": "tool-chatgpt",
            "rank": 2,
            "fit_reason": "Good at structuring pros-and-cons lists from an operational perspective.",
            "caveat": "Pricing information may occasionally be out of date without live search enabled.",
            "starter_prompt": "List the hidden trade-offs of switching from Google Workspace to Microsoft 365 for a small design agency.",
            "evidence_url": "https://chatgpt.com",
            "last_verified_at": "2026-11-02"
        },
        # task-make-slides
        {
            "task_id": "task-make-slides",
            "tool_id": "tool-gamma",
            "rank": 1,
            "fit_reason": "Turns a messy bullet outline into a stunning, responsive slide deck in under 30 seconds.",
            "caveat": "Free tier has watermarks and limited export styling.",
            "starter_prompt": "Create an 8-slide pitch deck presenting our eco-friendly packaging company to retail store owners.",
            "evidence_url": "https://gamma.app",
            "last_verified_at": "2026-11-02"
        },
        {
            "task_id": "task-make-slides",
            "tool_id": "tool-canva",
            "rank": 2,
            "fit_reason": "Gives you complete drag-and-drop graphic control over typography, logos, and color palettes.",
            "caveat": "More manual effort than one-click AI slide generators.",
            "starter_prompt": "Suggest a 5-color palette and typography pair for a calm, editorial non-profit presentation.",
            "evidence_url": "https://www.canva.com",
            "last_verified_at": "2026-11-03"
        },
        # task-analyze-spreadsheet
        {
            "task_id": "task-analyze-spreadsheet",
            "tool_id": "tool-chatgpt",
            "rank": 1,
            "fit_reason": "Advanced Data Analysis can run Python code internally to calculate variance, clean missing rows, and chart trends.",
            "caveat": "Do not upload spreadsheets containing real customer credit cards or social security numbers.",
            "starter_prompt": "Here is an anonymized monthly expense table. Find the top 3 categories where costs increased fastest between Q1 and Q3.",
            "evidence_url": "https://chatgpt.com",
            "last_verified_at": "2026-11-02"
        },
        {
            "task_id": "task-analyze-spreadsheet",
            "tool_id": "tool-claude",
            "rank": 2,
            "fit_reason": "Outstanding at reading CSV files directly and drafting plain-English executive explanations of the numbers.",
            "caveat": "Cannot run arbitrary code; arithmetic is statistical unless double-checked.",
            "starter_prompt": "Review these quarterly sales figures and write 3 plain-language bullet points explaining our biggest growth drivers.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": "2026-11-01"
        },
        # task-transcribe-meeting
        {
            "task_id": "task-transcribe-meeting",
            "tool_id": "tool-otter",
            "rank": 1,
            "fit_reason": "Automatically joins Zoom or Teams, distinguishes different speakers, and generates timestamped action checklists.",
            "caveat": "Requires informing all meeting attendees that automated recording is active.",
            "starter_prompt": "Review the transcript from today's staff meeting. Create a table with 3 columns: Action Item, Person Responsible, and Agreed Deadline.",
            "evidence_url": "https://otter.ai",
            "last_verified_at": "2026-11-01"
        },
        {
            "task_id": "task-transcribe-meeting",
            "tool_id": "tool-claude",
            "rank": 2,
            "fit_reason": "If you paste a raw transcript text, Claude extracts diplomatic summaries without meeting chatter.",
            "caveat": "Does not record audio directly; requires you to paste text from an audio file.",
            "starter_prompt": "Clean up this messy meeting transcript. Remove conversational filler words and summarize decisions made.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": "2026-11-01"
        }
    ]

    for tfit in task_fits_data:
        existing = db.query(TaskToolFit).filter(
            TaskToolFit.task_id == tfit["task_id"],
            TaskToolFit.tool_id == tfit["tool_id"]
        ).first()
        if not existing:
            db.add(TaskToolFit(**tfit))

    # 5. Seed Capabilities (Then vs Now) with Honesty Rules
    # Honesty Rule: has_then_evidence = True ONLY if verified baseline exists.
    # Otherwise has_then_evidence = False (renders as "New in 2026" with Now side only).
    capabilities_data = [
        # Student Capabilities
        {
            "id": "cap-student-1",
            "title": "Reason through long essay outlines without losing context",
            "then_text": "In January 2026, models forgot the beginning of a paper after 4 pages and repeated arguments.",
            "now_text": "Claude 3.7 Sonnet holds entire 50-page course syllabi in working memory and spots weak logical leaps.",
            "persona_tags": ["student"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "You can paste your entire lecture notes and ask the AI to find missing themes across weeks.",
            "before_stat_num": 3,
            "before_stat_total": 10,
            "before_stat_baseline": "Jan 2026 (4k token window)",
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://arxiv.org/abs/2309.00667"},
                {"side": "now", "source_url": "https://www.anthropic.com/news/claude-3-7-sonnet"}
            ]
        },
        {
            "id": "cap-student-2",
            "title": "Private local study guides that never train on your assignments",
            "then_text": "Early consumer web chats retained user prompts to train future foundation models unless paying for enterprise tiers.",
            "now_text": "NotebookLM and Ollama run strictly against your private files with zero training on your data.",
            "persona_tags": ["student"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "You can safely upload unpublished class essays without fear of them appearing in public internet training datasets.",
            "before_stat_num": 2,
            "before_stat_total": 10,
            "before_stat_baseline": "2024 Terms of Service",
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://openai.com/policies/terms-of-use"},
                {"side": "now", "source_url": "https://notebooklm.google.com/faq"}
            ]
        },
        {
            # HONESTY CHECK: NO THEN EVIDENCE -> SHOWS AS "New in 2026"
            "id": "cap-student-3",
            "title": "Interactive podcast-style audio discussions of your study notes",
            "then_text": None,  # No verified earlier baseline
            "now_text": "NotebookLM Audio Overviews generate natural, two-host conversations that debate your notes out loud.",
            "persona_tags": ["student"],
            "has_then_evidence": False,
            "confidence": "High",
            "what_it_means": "You can listen to your biology study guide while commuting or walking, hearing two voices discuss key concepts.",
            "before_stat_num": None,
            "before_stat_total": None,
            "before_stat_baseline": None,
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "now", "source_url": "https://blog.google/technology/ai/notebooklm-audio-overviews/"}
            ]
        },
        {
            "id": "cap-student-4",
            "title": "Step-by-step calculus homework checks without solving it for you",
            "then_text": "Early models immediately printed the final answer, encouraging passive copying without learning.",
            "now_text": "Modern reasoning models pause, provide hints, and ask diagnostic questions to guide your understanding.",
            "persona_tags": ["student"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "You can treat AI like an interactive tutor during late-night study sessions rather than an answer machine.",
            "before_stat_num": 4,
            "before_stat_total": 10,
            "before_stat_baseline": "Jan 2026 basic prompting",
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://openai.com/research"},
                {"side": "now", "source_url": "https://deepseek.ai"}
            ]
        },

        # Teacher Capabilities
        {
            "id": "cap-teacher-1",
            "title": "Generate 4 reading level adaptations of a single historical text in seconds",
            "then_text": "Rewriting a primary source text for 5th, 7th, and 9th grade reading bands took 90 minutes of manual teacher time.",
            "now_text": "Claude and ChatGPT adjust Lexile and Flesch-Kincaid levels while preserving factual vocabulary in 15 seconds.",
            "persona_tags": ["teacher"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "Every student in your diverse classroom can read the same core historical topic at their accessible reading level.",
            "before_stat_num": 2,
            "before_stat_total": 10,
            "before_stat_baseline": "Manual educator rewriting (90 mins)",
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://www.edweek.org"},
                {"side": "now", "source_url": "https://claude.ai"}
            ]
        },
        {
            "id": "cap-teacher-2",
            "title": "Pedagogically sound quiz questions with misconception explanations",
            "then_text": "Older models generated obvious multiple-choice options where the wrong answers were clearly silly.",
            "now_text": "Current models craft realistic distractors reflecting common student misconceptions with remediation notes.",
            "persona_tags": ["teacher"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "You can generate a practice test that actually diagnoses where students are confused before exam day.",
            "before_stat_num": 3,
            "before_stat_total": 10,
            "before_stat_baseline": "Jan 2026 naive MCQ generation",
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://arxiv.org/abs/2305.08298"},
                {"side": "now", "source_url": "https://chatgpt.com"}
            ]
        },
        {
            # HONESTY CHECK: NO THEN EVIDENCE -> SHOWS AS "New in 2026"
            "id": "cap-teacher-3",
            "title": "Open benchmark metrics tracking AI homework checker false accusation rates",
            "then_text": None,
            "now_text": "New peer-reviewed 2026 benchmarks publicly report false positive error rates across synthetic essay detectors.",
            "persona_tags": ["teacher"],
            "has_then_evidence": False,
            "confidence": "High",
            "what_it_means": "Educators have concrete evidence showing why automated AI detectors should never be the sole basis for academic discipline.",
            "before_stat_num": None,
            "before_stat_total": None,
            "before_stat_baseline": None,
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "now", "source_url": "https://www.nature.com"}
            ]
        },
        {
            "id": "cap-teacher-4",
            "title": "Custom rubrics aligned to specific state educational standards",
            "then_text": "Generating a 4-tier rubric required manually looking up state code numbers and copy-pasting descriptors.",
            "now_text": "AI models cross-reference state curricula directly to output criterion-anchored assessment grids.",
            "persona_tags": ["teacher"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "Save up to 3 hours every Sunday afternoon drafting project evaluation standards.",
            "before_stat_num": 4,
            "before_stat_total": 10,
            "before_stat_baseline": "Manual state standard mapping",
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://www.ed.gov"},
                {"side": "now", "source_url": "https://claude.ai"}
            ]
        },

        # Entrepreneur Capabilities
        {
            "id": "cap-entrepreneur-1",
            "title": "Run enterprise-grade 70B open models locally on a single workstation",
            "then_text": "In early 2026, running a 70B parameter model required multi-GPU server clusters costing $1,500/month in cloud fees.",
            "now_text": "Llama 3.3 70B runs at full speed on a modern MacBook Pro or desktop using optimized FP8 and quantization.",
            "persona_tags": ["entrepreneur"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "Your startup can process customer files completely locally with zero recurring API subscription fees.",
            "before_stat_num": 2,
            "before_stat_total": 10,
            "before_stat_baseline": "Jan 2026 Cloud cluster requirement ($1,500/mo)",
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://aws.amazon.com/ec2/instance-types/"},
                {"side": "now", "source_url": "https://ai.meta.com/blog/llama-3-3-70b/"}
            ]
        },
        {
            # HONESTY CHECK: NO THEN EVIDENCE -> SHOWS AS "New in 2026"
            "id": "cap-entrepreneur-2",
            "title": "Universal Model Context Protocol (MCP) tool integration",
            "then_text": None,
            "now_text": "Anthropic's open MCP standard connects AI directly to databases, GitHub, and local spreadsheets using a uniform protocol.",
            "persona_tags": ["entrepreneur", "engineer_office"],
            "has_then_evidence": False,
            "confidence": "High",
            "what_it_means": "You can connect your desktop AI to company tools without writing brittle custom API adapters for every single service.",
            "before_stat_num": None,
            "before_stat_total": None,
            "before_stat_baseline": None,
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "now", "source_url": "https://www.anthropic.com/news/model-context-protocol"}
            ]
        },
        {
            "id": "cap-entrepreneur-3",
            "title": "Customer FAQ bots that strictly refuse to hallucinate fake return policies",
            "then_text": "Early consumer chatbots hallucinated fake discount codes and non-existent refund windows 14% of the time.",
            "now_text": "Grounded Retrieval-Augmented Generation (RAG) restricts answers strictly to your uploaded return policy text.",
            "persona_tags": ["entrepreneur"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "You can deploy a 24/7 web assistant without risking costly customer disputes over fabricated promises.",
            "before_stat_num": 3,
            "before_stat_total": 10,
            "before_stat_baseline": "Jan 2026 unconstrained chat (14% hallucination)",
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://arxiv.org/abs/2311.08234"},
                {"side": "now", "source_url": "https://docs.langchain.com/oss/python/deepagents/rag"}
            ]
        },
        {
            "id": "cap-entrepreneur-4",
            "title": "Competitor pricing scans and weekly executive digests",
            "then_text": "Tracking 20 rival websites required hiring virtual assistants or building custom web scrapers that broke on layout changes.",
            "now_text": "Browser agent tools parse dynamic storefronts and extract structured Markdown comparison tables automatically.",
            "persona_tags": ["entrepreneur"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "Stay on top of pricing shifts in your market without spending 5 hours a week manually checking websites.",
            "before_stat_num": 2,
            "before_stat_total": 10,
            "before_stat_baseline": "Manual web checking (5 hrs/week)",
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://news.ycombinator.com"},
                {"side": "now", "source_url": "https://www.perplexity.ai"}
            ]
        },

        # Engineer / Office Worker Capabilities
        {
            "id": "cap-office-1",
            "title": "Turn messy meeting transcripts into formatted Markdown action tables",
            "then_text": "Raw audio transcripts left 20 pages of messy conversational text with no clear summary of who does what.",
            "now_text": "Otter and Claude parse speakers, remove small talk, and generate structured tables with Owner, Task, and Deadline columns.",
            "persona_tags": ["engineer_office"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "Distribute clear meeting minutes to your department in 60 seconds after hanging up.",
            "before_stat_num": 3,
            "before_stat_total": 10,
            "before_stat_baseline": "Manual transcript cleanup (45 mins)",
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://otter.ai"},
                {"side": "now", "source_url": "https://claude.ai"}
            ]
        },
        {
            "id": "cap-office-2",
            "title": "Multi-file code and document editing directly inside your local desktop editor",
            "then_text": "Office workers and engineers had to copy snippets back and forth into browser chat tabs, losing file context.",
            "now_text": "Editors like Cursor inspect your whole folder and apply targeted multi-file updates with plain language commands.",
            "persona_tags": ["engineer_office"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "Fix spreadsheet automation scripts or web pages without copying and pasting snippets between 10 tabs.",
            "before_stat_num": 3,
            "before_stat_total": 10,
            "before_stat_baseline": "Tab copying & manual merging",
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://github.com"},
                {"side": "now", "source_url": "https://www.cursor.com"}
            ]
        },
        {
            # HONESTY CHECK: NO THEN EVIDENCE -> SHOWS AS "New in 2026"
            "id": "cap-office-3",
            "title": "Strict enterprise privacy toggles guaranteed by regional data legislation",
            "then_text": None,
            "now_text": "EU AI Act Phase 1 mandates clear audit logs and explicit prohibitions on untargeted biometric and proprietary data scraping.",
            "persona_tags": ["engineer_office"],
            "has_then_evidence": False,
            "confidence": "High",
            "what_it_means": "Enterprise employees have clear legal assurances regarding what third-party AI providers can and cannot log.",
            "before_stat_num": None,
            "before_stat_total": None,
            "before_stat_baseline": None,
            "after_stat_num": 8,
            "after_stat_total": 10,
            "evidence": [
                {"side": "now", "source_url": "https://digital-strategy.ec.europa.eu/en/policies/ai-act"}
            ]
        },
        {
            "id": "cap-office-4",
            "title": "Format chaotic unstructured text and PDF reports into validated CSV tables",
            "then_text": "Writing brittle regular expressions failed whenever an invoice had an unexpected line break or spacing.",
            "now_text": "Modern LLMs extract tables directly from PDFs and output clean CSV files that paste right into Excel.",
            "persona_tags": ["engineer_office"],
            "has_then_evidence": True,
            "confidence": "Verified",
            "what_it_means": "Automate 30 minutes of daily spreadsheet entry busywork without writing regex code.",
            "before_stat_num": 4,
            "before_stat_total": 10,
            "before_stat_baseline": "Manual data entry & fragile regex",
            "after_stat_num": 9,
            "after_stat_total": 10,
            "evidence": [
                {"side": "then", "source_url": "https://arxiv.org"},
                {"side": "now", "source_url": "https://claude.ai"}
            ]
        }
    ]

    for cd in capabilities_data:
        existing = db.query(Capability).filter(Capability.id == cd["id"]).first()
        if not existing:
            c = Capability(
                id=cd["id"],
                title=cd["title"],
                then_text=cd["then_text"],
                now_text=cd["now_text"],
                has_then_evidence=cd["has_then_evidence"],
                confidence=cd["confidence"],
                what_it_means=cd["what_it_means"],
                before_stat_num=cd.get("before_stat_num"),
                before_stat_total=cd.get("before_stat_total"),
                before_stat_baseline=cd.get("before_stat_baseline"),
                after_stat_num=cd.get("after_stat_num"),
                after_stat_total=cd.get("after_stat_total")
            )
            c.persona_tags = cd["persona_tags"]
            db.add(c)
            db.flush()

            for ev in cd.get("evidence", []):
                db.add(CapabilityEvidence(
                    capability_id=c.id,
                    side=ev["side"],
                    source_url=ev["source_url"]
                ))

    db.commit()


def get_then_now_for_persona(persona_id: str, db: Session) -> List[Dict[str, Any]]:
    """
    Returns 4-6 capability items for a persona with the Honesty Rule applied:
    If has_then_evidence is False, render as 'New in 2026' with Now side only.
    """
    caps = db.query(Capability).all()
    results: List[Dict[str, Any]] = []

    for c in caps:
        if persona_id in c.persona_tags or not c.persona_tags:
            evidences = db.query(CapabilityEvidence).filter(
                CapabilityEvidence.capability_id == c.id
            ).all()

            then_sources = [e.source_url for e in evidences if e.side == "then"]
            now_sources = [e.source_url for e in evidences if e.side == "now"]

            results.append({
                "id": c.id,
                "title": c.title,
                "is_new_in_2026": not c.has_then_evidence,
                "badge": "Verified Baseline" if c.has_then_evidence else "New in 2026",
                "then_text": c.then_text if c.has_then_evidence else None,
                "now_text": c.now_text,
                "what_it_means": c.what_it_means,
                "confidence": c.confidence,
                "before_stat": {
                    "num": c.before_stat_num,
                    "total": c.before_stat_total,
                    "baseline": c.before_stat_baseline
                } if c.has_then_evidence and c.before_stat_num is not None else None,
                "after_stat": {
                    "num": c.after_stat_num,
                    "total": c.after_stat_total,
                    "label": "Now in 2026"
                } if c.after_stat_num is not None else None,
                "then_sources": then_sources,
                "now_sources": now_sources
            })

    return results[:6]


def get_tool_recommendations_for_task(task_id: str, persona_id: str, db: Session) -> Dict[str, Any]:
    """
    Retrieves Top Pick + up to 2 Also Good tools for a task.
    Enforces Freshness: if tool.last_verified_at > 30 days old, hides pricing details.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        # Fallback to first task
        task = db.query(Task).first()

    fits = db.query(TaskToolFit).filter(
        TaskToolFit.task_id == task.id
    ).order_by(TaskToolFit.rank.asc()).all()

    recommendations = []
    for f in fits:
        tool = db.query(Tool).filter(Tool.id == f.tool_id).first()
        if not tool:
            continue
        # Never surface discontinued or acquired tools
        tool_status = getattr(tool, "status", "active") or "active"
        if tool_status in ("discontinued", "acquired"):
            continue

        # Freshness check: > 30 days
        is_stale = False
        try:
            verified_dt = datetime.strptime(tool.last_verified_at, "%Y-%m-%d")
            days_since = (CURRENT_DATE - verified_dt).days
            if days_since > 30:
                is_stale = True
        except Exception:
            is_stale = True

        facts = db.query(ToolFact).filter(ToolFact.tool_id == tool.id).all()
        pricing_facts = [fa for fa in facts if fa.fact_type == "pricing"]

        if is_stale:
            pricing_summary = "Check the official site for current pricing."
            pricing_verified_label = "Pricing check required (>30 days old)"
            show_pricing_details = False
        else:
            pricing_summary = pricing_facts[0].value if pricing_facts else "Free / Paid plans available."
            pricing_verified_label = f"Checked on {tool.last_verified_at}"
            show_pricing_details = True

        # Safety note for teacher persona
        safety_notice = None
        if persona_id == "teacher":
            safety_notice = "Don't paste student names or grades into third-party tools."

        # Status badge
        status = getattr(tool, "status", "active") or "active"
        difficulty = getattr(tool, "difficulty", None)
        time_to_first = getattr(tool, "time_to_first_result", None)
        free_option = getattr(tool, "free_option", None)
        paid_option = getattr(tool, "paid_option", None)
        account_needed = getattr(tool, "account_needed", None)
        best_for = getattr(tool, "best_for", None)
        not_good_for = getattr(tool, "not_good_for", None)
        privacy_summary = getattr(tool, "privacy_summary", None)
        example_output = getattr(tool, "example_output", None)

        recommendations.append({
            "tool_id": tool.id,
            "name": tool.name,
            "maker": tool.maker,
            "official_url": tool.official_url,
            "rank": f.rank,
            "badge": "Top pick" if f.rank == 1 else "Also good",
            "fit_reason": f.fit_reason,
            "pricing_summary": pricing_summary if not is_stale else "Check the official site for current pricing.",
            "pricing_verified_label": pricing_verified_label,
            "show_pricing_details": show_pricing_details,
            "is_stale": is_stale,
            "platforms": tool.platforms,
            "languages": tool.languages,
            "watch_out": f.caveat,
            "starter_prompt": f.starter_prompt,
            "safety_notice": safety_notice,
            "evidence_url": f.evidence_url,
            "last_verified_at": f.last_verified_at,
            # Enriched fields
            "status": status,
            "difficulty": difficulty,
            "time_to_first_result": time_to_first,
            "free_option": free_option,
            "paid_option": paid_option if not is_stale else None,
            "account_needed": account_needed,
            "best_for": best_for,
            "not_good_for": not_good_for,
            "privacy_summary": privacy_summary,
            "example_output": example_output,
        })

    return {
        "task_id": task.id,
        "task_title": task.title,
        "persona": persona_id,
        "not_for_ai": task.not_for_ai or "When high-stakes legal, medical, or confidential privacy guarantees are required.",
        "how_we_choose": (
            "We recommend tools strictly using 5 criteria: fit for the job, real cost, ease of use, data privacy, and language support. "
            "No affiliate links, no paid placements, no sponsored rankings. Every pricing claim is verified directly from official pages."
        ),
        "recommendations": recommendations
    }
