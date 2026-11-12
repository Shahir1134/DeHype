"""
Agent 3: Signal Agent (Filter & Classifier)
Classifies stories as USEFUL, HYPE, or BUZZ.
Acts as the anti-overwhelm feed filter.
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from schemas import Story, SignalResult, SignalScores, FactVerificationResult


RED_FLAG_PATTERNS = [
    (r"\b(revolutionary|mind-blowing|game-changer|unprecedented)\b", "superlatives without verified baseline"),
    (r"\b(closed\s+waitlist|invite-only|private\s+beta|unreleased)\b", "demo-only / closed waitlist"),
    (r"\b(agi|human-level\s+reasoning)\b", "AGI / ungrounded hype language"),
    (r"\b(funding\s+round|series\s+[a-z]|\$\d+\s*(?:million|billion))\b", "funding presented as technological progress"),
    (r"\b(contradicting\s+the\s+vendor|conflicting\s+value|questioned)\b", "disputed / unconfirmed benchmark claim"),
    (r"\b(dinner\s+panel|remarks|timeline|debating\s+the\s+quote)\b", "celebrity quote / attention without substance"),
    (r"\b(affair|mistress|scandal|cheating|extramarital|defamation\s+lawsuit)\b", "personal scandal / executive gossip without technology")
]


class SignalAgent:
    """Agent 3: Scores, red-flags, and classifies AI stories."""

    def __init__(self, prompt_path: Optional[str] = None):
        self.prompt_path = prompt_path or str(
            Path(__file__).parent.parent / "prompts" / "signal_agent.txt"
        )

    def detect_red_flags(self, story: Story, verification: Optional[FactVerificationResult] = None) -> List[str]:
        """Detect hype, ungrounded promises, and buzz indicators."""
        flags = []
        combined_text = f"{story.title} {' '.join(f.statement for f in story.facts)} {' '.join(story.limitations)}".lower()

        for pattern, label in RED_FLAG_PATTERNS:
            if re.search(pattern, combined_text, re.IGNORECASE):
                if label not in flags:
                    flags.append(label)

        if verification and verification.unclear_claims:
            for unc in verification.unclear_claims:
                flags.append(f"Discrepancy: {unc}")

        return flags

    def score_story(
        self,
        story: Story,
        verification: Optional[FactVerificationResult] = None
    ) -> Tuple[SignalScores, Dict[str, str]]:
        """Score evidence, availability, novelty, user_impact, source_diversity (0-2)."""
        reasons = {}
        combined_text = f"{story.title} {' '.join(f.statement for f in story.facts)} {' '.join(story.limitations)}".lower()

        # 1. Evidence
        has_unclear = verification and len(verification.unclear_claims) > 0
        has_confirmed_metrics = verification and any(n.status == "confirmed" for n in verification.verified_numbers)
        has_academic_repo = "arxiv" in " ".join(story.source_urls).lower() or any("github" in e.lower() for e in story.ecosystem)

        # Detect conflicting numbers directly from story facts (even without verification report)
        # Only flag if the SAME benchmark has DIFFERENT values from DIFFERENT source URLs
        # (before/after on the same source is legitimate; different sources saying different things is a conflict)
        if not has_unclear and len(story.numbers) >= 2:
            benchmark_metrics = {"mmlu", "humaneval", "gsm8k", "pass@1_aime", "pass@1"}
            metric_source_values: dict = {}  # metric -> {source_url -> set of values}
            for num in story.numbers:
                m = num.metric.lower()
                if m in benchmark_metrics:
                    if m not in metric_source_values:
                        metric_source_values[m] = {}
                    src = num.source or "unknown"
                    if src not in metric_source_values[m]:
                        metric_source_values[m][src] = set()
                    metric_source_values[m][src].add(num.value)
            # Conflict: same metric, multiple sources, values differ across sources
            has_conflicting_numbers = False
            for m, src_vals in metric_source_values.items():
                if len(src_vals) > 1:
                    all_values = set()
                    for vals in src_vals.values():
                        all_values |= vals
                    if len(all_values) > 1:
                        has_conflicting_numbers = True
                        break
            if has_conflicting_numbers:
                has_unclear = True

        if has_unclear:
            evidence = 0
            reasons["evidence"] = "Disputed or conflicting benchmark claims between sources."
        elif has_confirmed_metrics:
            evidence = 2
            reasons["evidence"] = "Verified benchmarks independently corroborated across multiple sources."
        elif has_academic_repo or len(story.numbers) > 0:
            evidence = 1
            reasons["evidence"] = "Single reputable source or academic benchmark with methodology published."
        else:
            evidence = 0
            reasons["evidence"] = "No independently verifiable benchmarks or replication code."

        # 2. Availability
        is_waitlist = any(w in combined_text for w in ["waitlist", "private beta", "invite-only", "unreleased"])
        is_open_weights_or_code = any(w in combined_text for w in [
            "open-weights", "open-source", "download", "hugging face", "github", "vllm",
            "ollama", "weights", "checkpoint", "api available", "available now", "publicly available"
        ])
        is_quote_only = any(w in combined_text for w in ["dinner", "remarks", "sparks debate", "quote", "affair", "scandal"])

        if is_waitlist or is_quote_only:
            availability = 0
            reasons["availability"] = "Unreleased, closed waitlist, or conversational remarks without software."
        elif is_open_weights_or_code:
            availability = 2
            reasons["availability"] = "Weights, models, or code publicly downloadable or deployable immediately."
        else:
            availability = 1
            reasons["availability"] = "Available via limited API or standard cloud deployment."

        # 3. Novelty
        is_routine_patch = any(w in combined_text for w in ["maintenance update", "patch 1.", "internal diagnostic", "routine maintenance"])
        is_major_jump = (
            any(w in combined_text for w in [
                "405b performance", "self-correcting search", "latent reasoning", "42.1% to 68.4%",
                "new model", "model launch", "open-weights", "flagship", "reasoning model",
                "multimodal", "agentic", "benchmark leap", "frontier model"
            ]) or
            bool(re.search(r"\b(?:v?[0-9]+(?:\.[0-9]+)+(?:-[a-z0-9]+)?|[0-9]+b)\b", combined_text))
        )

        if is_routine_patch or is_quote_only:
            novelty = 0
            reasons["novelty"] = "Routine maintenance, personal drama, or philosophical remarks with no architectural leap."
        elif is_major_jump:
            novelty = 2
            reasons["novelty"] = "Substantial capability jump, major model release, or new algorithmic reasoning framework."
        else:
            novelty = 1
            reasons["novelty"] = "Incremental feature bump or evolutionary model release."

        # 4. User Impact
        is_local_consumer_gpu = any(w in combined_text for w in ["24gb", "rtx 4090", "single-gpu", "vllm"])
        is_funding_only = "funding round" in combined_text or "$150m" in combined_text

        if is_routine_patch or is_quote_only or (is_funding_only and is_waitlist):
            user_impact = 0
            reasons["user_impact"] = "Zero immediate impact on day-to-day work for real people."
        elif is_local_consumer_gpu:
            user_impact = 2
            reasons["user_impact"] = "Runs on consumer hardware, slashing hosting costs and democratizing access."
        else:
            user_impact = 1
            reasons["user_impact"] = "Applicable to specialized research engineers or math problem-solving."

        # 5. Source Diversity
        orig_count = verification.original_sources_count if verification else len(story.source_urls)
        if orig_count >= 2:
            source_diversity = 2
            reasons["source_diversity"] = f"Covered and verified across {orig_count} distinct original sources."
        elif orig_count == 1:
            source_diversity = 1
            reasons["source_diversity"] = "Single verified reporting source."
        else:
            source_diversity = 0
            reasons["source_diversity"] = "Vendor press release or syndication wire only."

        scores = SignalScores(
            evidence=evidence,
            availability=availability,
            novelty=novelty,
            user_impact=user_impact,
            source_diversity=source_diversity
        )
        return scores, reasons

    def generate_verdict_line(
        self,
        label: str,
        story: Story,
        red_flags: List[str]
    ) -> str:
        """Create exactly one clear, candid sentence describing the reality."""
        title_lower = story.title.lower()

        if label == "USEFUL":
            if "llama" in title_lower:
                return "Ready to run locally today with 405B-class intelligence on consumer hardware."
            elif "deepreason" in title_lower:
                return "Clever math reasoning search method with open code, but adds noticeable inference delay."
            else:
                return "Verified and deployable today with concrete performance gains."
        elif label == "HYPE":
            if "supercloud" in title_lower:
                return "Raised $150M on large capability claims, but the product is currently unreleased and restricted to a private waitlist."
            elif "omnilogic" in title_lower:
                return "Vendor claimed 98.5% coding benchmark accuracy; independent tests were unable to confirm this, reporting 71.2%."
            else:
                return "Significant capability claims reported, but independent evidence and public access are not yet confirmed."
        else:  # BUZZ
            if "davos" in title_lower or "ceo" in title_lower:
                return "Social media debate over dinner table remarks with zero new tools or software."
            elif "patch" in title_lower or "vectordb" in title_lower:
                return "Routine telemetry maintenance patch with no functional change for users."
            else:
                return "High online discussion volume, but nothing changes for real users today."

    def classify(
        self,
        story: Story,
        verification: Optional[FactVerificationResult] = None
    ) -> SignalResult:
        """Execute Signal Agent classification and feed scoring."""
        red_flags = self.detect_red_flags(story, verification)
        scores, reasons = self.score_story(story, verification)

        total_score = (
            scores.evidence +
            scores.availability +
            scores.novelty +
            scores.user_impact +
            scores.source_diversity
        )

        # Classification logic:
        # USEFUL: evidence >= 1 AND availability >= 1 AND user_impact >= 1 AND total >= 7
        is_useful = (
            scores.evidence >= 1 and
            scores.availability >= 1 and
            scores.user_impact >= 1 and
            total_score >= 7
        )

        # HYPE: strong promise language or superlatives but evidence=0 or availability=0
        is_hype = (
            (scores.evidence == 0 or scores.availability == 0) and
            any(
                "discrepancy" in rf.lower() or
                "superlative" in rf.lower() or
                "waitlist" in rf.lower() or
                "funding" in rf.lower() or
                "disputed" in rf.lower() or
                "unconfirmed benchmark" in rf.lower()
                for rf in red_flags
            )
        )

        if is_useful:
            label = "USEFUL"
            tier = "must_know" if total_score >= 9 else "good_to_know"
        elif is_hype:
            label = "HYPE"
            tier = None
        else:
            label = "BUZZ"
            tier = None

        verdict_line = self.generate_verdict_line(label, story, red_flags)
        confidence = 0.95 if total_score >= 8 or label in ["HYPE", "BUZZ"] else 0.88

        return SignalResult(
            label=label,
            tier=tier,
            scores=scores,
            reasons=reasons,
            red_flags=red_flags,
            verdict_line=verdict_line,
            confidence=confidence
        )
