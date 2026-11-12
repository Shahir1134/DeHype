"""
Importance / Editor scoring engine.
Score = recency + source_weight + signal_weight - penalties
King-of-Hill: new story displaces lower-scored story if feed is full.
"""
import logging
import re
from datetime import datetime, date
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

FEED_MAX = 6          # max stories in active feed
SCORE_THRESHOLD = 2.0 # minimum score to stay published


# High-impact technological events & model launches (Major Boost: +1.5 to +2.0)
MAJOR_TECH_PATTERNS = [
    r"\b(?:launch|launches|launched|releasing|released|drops|announces|debuts|introduces)\b.*\b(?:model|weights|checkpoint|framework|llm|multimodal|reasoning|agent|assistant)\b",
    r"\b(?:model|weights|checkpoint|framework|llm|multimodal|reasoning|agent|assistant)\b.*\b(?:launch|launches|launched|releasing|released|drops|announces|debuts|introduces)\b",
    r"\b(?:open[ -]source|open[ -]weights|weights available|publicly available|open release)\b",
    r"\b(?:llama|claude|gpt|gemini|deepseek|mistral|fable|qwen|phi|command r|grok|flan)\b.*(?:\b[0-9]+(?:\.[0-9]+)?(?:b|t)?\b|\bv?[0-9]+(?:\.[0-9]+)?\b)",
    r"\b(?:v[0-9]+(?:\.[0-9]+)+|[0-9]+b)\b",
    r"\b(?:benchmark|mmlu|humaneval|gsm8k|swe-bench)\b",
    r"\b(?:api available|sdk release|developer platform|breakthrough|new architecture)\b"
]

# Personal drama, executive affairs, lawsuits & stock speculation (Heavy Penalty: -2.5)
GOSSIP_PATTERNS = [
    r"\b(?:affair|mistress|alleged spy|cheating|extramarital|sex scandal)\b",
    r"\b(?:dinner table|private remarks|casual remarks|controversial comment)\b",
    r"\b(?:lawsuit|sues|suing|court battle|defamation|antitrust lawsuit)\b",
    r"\b(?:shares fall|shares rise|stock tumbles|market valuation hits|investors flee)\b",
    r"\b(?:fired|drama|resigns amid controversy|personal investigation)\b",
    r"\b(?:celebrity|billionaire feud|twitter fight|x feud|insult)\b"
]


def _tech_impact_boost(title: str, facts: list) -> float:
    text = (title + " " + " ".join(str(f) for f in facts)).lower()
    boost = 0.0
    for pat in MAJOR_TECH_PATTERNS:
        if re.search(pat, text):
            boost += 1.2
            break
    major_labs = ["openai", "anthropic", "meta", "google", "deepmind", "mistral", "hugging face", "fable", "deepseek", "qwen"]
    if any(lab in text for lab in major_labs):
        boost += 0.8
    return min(boost, 2.0)


def _gossip_penalty(title: str, facts: list) -> float:
    text = (title + " " + " ".join(str(f) for f in facts)).lower()
    for pat in GOSSIP_PATTERNS:
        if re.search(pat, text):
            return 2.5
    return 0.0


def _recency_score(event_date_str: str) -> float:
    """Higher for more recent stories. Decays over days."""
    try:
        d = datetime.strptime(event_date_str, "%Y-%m-%d").date()
        days_old = (date.today() - d).days
        if days_old <= 1:
            return 3.0
        elif days_old <= 3:
            return 2.0
        elif days_old <= 7:
            return 1.0
        elif days_old <= 14:
            return 0.5
        return 0.0
    except Exception:
        return 0.0


def _source_weight(signal_label: str, source_count: int) -> float:
    """More sources + useful signal = higher weight."""
    base = 2.0 if signal_label == "useful" else (1.0 if signal_label == "buzz" else 0.0)
    return base + min(source_count - 1, 2) * 0.5


def _importance_to_weight(importance: int) -> float:
    return {5: 2.0, 4: 1.5, 3: 1.0, 2: 0.5, 1: 0.0}.get(importance, 1.0)


def compute_score(story: Dict) -> Tuple[float, str]:
    """Returns (score, reason_string). Strongly prioritizes tech launches and suppresses drama."""
    title = story.get("title", "")
    facts = story.get("facts", [])

    recency = _recency_score(story.get("event_date", "2000-01-01"))
    source_w = _source_weight(story.get("signal_label", "buzz"), story.get("source_count", 1))
    imp_w = _importance_to_weight(story.get("importance", 3))

    tech_boost = _tech_impact_boost(title, facts)
    gossip_pen = _gossip_penalty(title, facts)

    # Penalty: hype with single source
    hype_penalty = 0.5 if (story.get("signal_label") == "hype" and story.get("source_count", 1) == 1) else 0.0

    score = recency + source_w + imp_w + tech_boost - hype_penalty - gossip_pen
    reason = (
        f"recency={recency:.1f} source={source_w:.1f} imp={imp_w:.1f} "
        f"tech_boost=+{tech_boost:.1f} gossip_pen=-{gossip_pen:.1f} → {score:.2f}"
    )
    return round(score, 2), reason


def king_of_hill(current_feed: List[Dict], new_story: Dict) -> Tuple[List[Dict], bool]:
    """
    If feed is full: new story displaces the weakest if it scores higher.
    Returns (updated_feed, was_added).
    """
    if len(current_feed) < FEED_MAX:
        current_feed.append(new_story)
        return current_feed, True

    new_score, _ = compute_score(new_story)
    # Find weakest
    weakest = min(current_feed, key=lambda s: s.get("_score", 0))
    if new_score > weakest.get("_score", 0):
        current_feed.remove(weakest)
        current_feed.append(new_story)
        logger.info(
            f"[Editor] '{new_story.get('title','?')[:40]}' (score={new_score}) "
            f"displaced '{weakest.get('title','?')[:40]}' (score={weakest.get('_score',0)})"
        )
        return current_feed, True

    logger.info(
        f"[Editor] '{new_story.get('title','?')[:40]}' (score={new_score}) "
        f"did not displace any story."
    )
    return current_feed, False
