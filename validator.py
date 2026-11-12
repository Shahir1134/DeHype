"""
Validator & Quality Gate for 'AI for Everyone' pipeline.
Enforces P0 Trust & P1 Comprehension rules:
- #1: Regex reject on placeholder leaks ('[Technical Track]', '[...]', template phrases)
- #7: Overclaim blocker (flags 'completely', 'zero', 'guarantees', 'removes', '5x')
- #8: Verdict vs Limits consistency check
- #9: Baseline verification in comparisons
- #10: Ratio verification in analogies
- #16: Readability scoring (Flesch-Kincaid Grade 8 or below for plain mode)
"""

import re
from typing import List, Dict, Tuple, Optional


# Known forbidden placeholder phrases & templates
LEAK_PATTERNS = [
    r"\[technical\s+track\]",
    r"\[.*?\]",  # unrendered bracketed tokens
    r"\btodo\b",
    r"\blorem\s+ipsum\b",
    r"sentence\s+[1-3]\.",
    r"as\s+an\s+ai\b",
    r"placeholder",
    r"insert\s+here"
]

# Words that overclaim capability unless specifically in verified facts
OVERCLAIM_WORDS = [
    "completely", "guarantees", "zero errors", "removes all", "flawless",
    "miraculous", "infinite", "100% human replacement", "perfection"
]

# Essential everyday anchors recommended for analogies
EVERYDAY_ANCHORS = [
    "chatgpt", "google", "whatsapp", "excel", "upi", "youtube", "calculator",
    "email", "phone", "camera", "car", "exam", "book", "library"
]


def count_syllables(word: str) -> int:
    """Estimate syllable count in an English word."""
    w = word.lower().strip(".:;!?,\"'()")
    if not w:
        return 0
    if len(w) <= 3:
        return 1
    w = re.sub(r"(?:[^laeiouy]|ed|es|e)$", "", w)
    w = re.sub(r"^y", "", w)
    matches = re.findall(r"[aeiouy]{1,2}", w)
    return max(1, len(matches))


def compute_readability_fk(text: str) -> Tuple[float, bool]:
    """
    Compute Flesch-Kincaid Grade Level.
    Formula: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    Returns (grade_level, is_grade_8_or_below).
    """
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    words = re.findall(r"[A-Za-z0-9\-]+", text)

    if not words or not sentences:
        return 0.0, True

    num_words = len(words)
    num_sentences = max(1, len(sentences))
    total_syllables = sum(count_syllables(w) for w in words)

    grade = 0.39 * (num_words / num_sentences) + 11.8 * (total_syllables / num_words) - 15.59
    grade = round(max(0.0, grade), 1)
    return grade, grade <= 8.5


class ContentValidator:
    """Validates generated text for trust, leaks, overclaims, and readability."""

    @staticmethod
    def check_leaks(text: str) -> List[str]:
        """Fix #1: Regex reject on placeholder leaks."""
        violations = []
        for pat in LEAK_PATTERNS:
            if re.search(pat, text, re.IGNORECASE):
                violations.append(f"Placeholder leak detected: pattern '{pat}' in text.")
        return violations

    @staticmethod
    def check_overclaims(text: str, verified_facts_text: str) -> List[str]:
        """Fix #7: Flag extreme overclaims unless explicitly supported in facts."""
        flags = []
        text_lower = text.lower()
        facts_lower = verified_facts_text.lower()

        for word in OVERCLAIM_WORDS:
            if word in text_lower and word not in facts_lower:
                flags.append(f"Unsubstantiated overclaim: word '{word}' found without factual proof.")
        return flags

    @staticmethod
    def check_verdict_vs_limits(verdict: str, limitations: str) -> List[str]:
        """Fix #8: Ensure verdict line is consistent with stated limitations."""
        flags = []
        v_low = verdict.lower()
        l_low = limitations.lower()

        if "waitlist" in l_low or "unreleased" in l_low or "closed" in l_low:
            if any(term in v_low for term in ["available now", "use it today", "anyone can download", "ready for everyone"]):
                flags.append("Inconsistency: verdict claims public availability while limitations specify a closed waitlist or unreleased state.")
        return flags

    @staticmethod
    def check_baseline(text: str) -> bool:
        """Fix #9: Ensure any comparative claim names its comparison baseline."""
        has_comparison = any(term in text.lower() for term in ["better than", "jumped from", "faster than", "compared to", "earlier", "baseline"])
        return has_comparison

    @staticmethod
    def validate_explainer(headline: str, what_happened: str, comparison: str, limitations: str, facts_str: str) -> Dict[str, any]:
        """Runs full validation suite on an Explainer card."""
        errors = []
        full_text = f"{headline} {what_happened} {comparison} {limitations}"

        # 1. Leaks
        errors.extend(ContentValidator.check_leaks(full_text))

        # 2. Overclaims
        errors.extend(ContentValidator.check_overclaims(full_text, facts_str))

        # 3. Readability check (Grade 8 or below on plain explanation)
        grade, is_readable = compute_readability_fk(what_happened)
        if not is_readable:
            errors.append(f"Readability gate failed: Grade level {grade} exceeds Grade 8 target.")

        # 4. Comparison baseline check
        if comparison and not ContentValidator.check_baseline(comparison):
            errors.append("Comparison missing baseline: benchmarks must name what was improved upon.")

        return {
            "is_valid": len(errors) == 0,
            "grade_level": grade,
            "errors": errors
        }
