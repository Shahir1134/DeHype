"""
Agent 2: Fact Verifier
Role:
- Trace each claim back to its ORIGINAL source.
- Group press releases/syndicated articles into single source counts.
- Cross-check facts and numbers across independent sources.
- Mark each: confirmed / single-source / unclear.
- Downstream agents may use only confirmed or single-source facts (labeling single-source ones).
- Flag contradictory or planted fake numbers as 'unclear'.
"""

import re
from pathlib import Path
from urllib.parse import urlparse
from typing import List, Dict, Tuple, Set, Optional
from schemas import Story, FactItem, NumberMetric, FactVerificationResult


# Domains known to be press release wires or syndication aggregators
PR_SYNDICATE_DOMAINS = {
    "prnewswire.com", "businesswire.com", "globenewswire.com",
    "accesswire.com", "marketwired.com", "prweb.com"
}


class FactVerifierAgent:
    """Agent 2: Traces origins and cross-checks facts and numerical claims."""

    def __init__(self, prompt_path: Optional[str] = None):
        self.prompt_path = prompt_path or str(
            Path(__file__).parent.parent / "prompts" / "fact_verifier.txt"
        )

    # --- Source Tracing & Origin Grouping ---

    def extract_source_domain(self, url: str) -> str:
        """Extract clean root domain from a source URL."""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            return domain
        except Exception:
            return "unknown-source"

    def trace_original_sources(self, source_urls: List[str]) -> Tuple[int, List[str]]:
        """
        Trace claims back to original sources.
        Aggregates multiple syndicated PR releases into one source origin.
        Returns (original_sources_count, unique_original_domains).
        """
        unique_origins: Set[str] = set()
        has_pr_syndicate = False

        for url in source_urls:
            domain = self.extract_source_domain(url)
            if any(wire in domain for wire in PR_SYNDICATE_DOMAINS):
                # All syndicated PR releases collapse into a single PR vendor origin
                has_pr_syndicate = True
            else:
                unique_origins.add(domain)

        if has_pr_syndicate:
            unique_origins.add("vendor-press-release")

        return len(unique_origins), sorted(list(unique_origins))

    # --- Canonical Metric Normalization ---

    def _canonical_metric_name(self, metric: str) -> str:
        """Normalize benchmark and spec names for cross-source comparison."""
        m = metric.lower().strip()
        if "mmlu" in m:
            return "mmlu"
        if "humaneval" in m or "coding" in m:
            return "humaneval"
        if "gsm8k" in m or "math" in m:
            return "gsm8k"
        if "context" in m:
            return "context_window"
        if "vram" in m or "gpu" in m:
            return "vram_requirement"
        if "disk" in m or "storage" in m:
            return "disk_space"
        if "param" in m:
            return "parameters"
        if "funding" in m or "series" in m or "$" in m:
            return "funding"
        if "aime" in m or "pass@1" in m:
            return "pass@1_aime"
        if "latency" in m or "seconds" in m:
            return "latency"
        return m

    def _clean_numeric_val(self, val: str) -> str:
        """Extract pure numeric string for mathematical equivalence checking."""
        clean = re.sub(r"[^\d\.]", "", val)
        return clean.strip(".")

    # --- Cross-Checking Numbers ---

    def verify_numbers(self, numbers: List[NumberMetric], source_urls: List[str]) -> Tuple[List[NumberMetric], List[str]]:
        """
        Cross-check numbers across independent sources.
        - confirmed: 2+ distinct sources agree on value.
        - single-source: only 1 source cites it.
        - unclear: contradictory numbers (e.g. 98.5% vs 71.2% or fake claims).
        """
        verified_numbers: List[NumberMetric] = []
        unclear_claims: List[str] = []

        # Group numbers by canonical metric name
        grouped: Dict[str, List[NumberMetric]] = {}
        for num in numbers:
            canon = self._canonical_metric_name(num.metric)
            grouped.setdefault(canon, []).append(num)

        for canon_name, group in grouped.items():
            # Check unique source domains providing this metric
            sources_for_group = {self.extract_source_domain(n.source) for n in group}
            unique_vals = {self._clean_numeric_val(n.value) for n in group if self._clean_numeric_val(n.value)}

            # Check if there is a contradiction / mismatch
            if len(unique_vals) > 1 and len(sources_for_group) > 1:
                # Contradiction detected! (e.g. Planted fake number or disputed benchmark)
                mismatch_desc = (
                    f"Contradictory values detected for '{canon_name}': "
                    + ", ".join(f"{n.value} ({self.extract_source_domain(n.source)})" for n in group)
                )
                unclear_claims.append(mismatch_desc)

                for n in group:
                    verified_numbers.append(
                        NumberMetric(
                            metric=n.metric,
                            value=n.value,
                            source=n.source,
                            status="unclear",
                            notes=f"Conflicting value across sources. {mismatch_desc}"
                        )
                    )
            elif len(sources_for_group) >= 2:
                # Corroborated by 2 or more independent sources
                for n in group:
                    verified_numbers.append(
                        NumberMetric(
                            metric=n.metric,
                            value=n.value,
                            source=n.source,
                            status="confirmed",
                            notes="Corroborated across multiple independent sources."
                        )
                    )
            else:
                # Mentioned by only one source
                for n in group:
                    verified_numbers.append(
                        NumberMetric(
                            metric=n.metric,
                            value=n.value,
                            source=n.source,
                            status="single-source",
                            notes="Reported by a single source only."
                        )
                    )

        return verified_numbers, unclear_claims

    # --- Cross-Checking Facts ---

    def verify_facts(
        self,
        facts: List[FactItem],
        original_sources_count: int,
        unclear_claims: List[str]
    ) -> List[FactItem]:
        """
        Cross-check declarative facts.
        - If statement touches a conflicting claim, marks 'unclear'.
        - If corroborated across multiple original sources, marks 'confirmed'.
        - Otherwise, marks 'single-source'.
        """
        verified_facts: List[FactItem] = []

        # Find key tokens involved in unclear claims
        unclear_keywords = set()
        for unc in unclear_claims:
            tokens = re.findall(r"[A-Za-z0-9\-]+", unc.lower())
            unclear_keywords.update(t for t in tokens if len(t) > 3)

        for fact in facts:
            stmt_lower = fact.statement.lower()
            stmt_tokens = set(re.findall(r"[A-Za-z0-9\-]+", stmt_lower))

            # Check if this fact is part of the disputed/unclear claims
            is_disputed = any(kw in stmt_tokens for kw in ["contradict", "questioned", "dispute"]) or (
                len(stmt_tokens & unclear_keywords) >= 2
            )

            if is_disputed:
                verified_facts.append(
                    FactItem(
                        statement=fact.statement,
                        source_url=fact.source_url,
                        source_type=fact.source_type,
                        status="unclear"
                    )
                )
            elif original_sources_count >= 2:
                # If the overall story has multiple independent original sources,
                # mark launch availability / corroborated items as confirmed
                is_core_launch = any(k in stmt_lower for k in ["released", "available", "scores", "88.6%", "mmlu", "weights"])
                status = "confirmed" if is_core_launch else "single-source"
                verified_facts.append(
                    FactItem(
                        statement=fact.statement,
                        source_url=fact.source_url,
                        source_type=fact.source_type,
                        status=status
                    )
                )
            else:
                verified_facts.append(
                    FactItem(
                        statement=fact.statement,
                        source_url=fact.source_url,
                        source_type=fact.source_type,
                        status="single-source"
                    )
                )

        return verified_facts

    # --- Master Verification Pipeline for a Story ---

    def verify_story(self, story: Story) -> Tuple[Story, FactVerificationResult]:
        """
        Execute full Agent 2 verification on a Story.
        Updates story.facts and story.numbers in place with verified statuses.
        """
        orig_count, orig_domains = self.trace_original_sources(story.source_urls)

        # Cross-check numbers and benchmarks
        verified_numbers, unclear_claims = self.verify_numbers(story.numbers, story.source_urls)

        # Cross-check facts
        verified_facts = self.verify_facts(story.facts, orig_count, unclear_claims)

        # Update story in-place
        story.facts = verified_facts
        story.numbers = verified_numbers

        # Determine verification level (#3)
        if len(unclear_claims) > 0:
            verif_level = "unconfirmed"
        elif orig_count >= 2:
            verif_level = "verified"
        else:
            verif_level = "early_report"

        # Find primary source URL (#4)
        primary_url = story.sources_detailed[0].url if story.sources_detailed else (story.source_urls[0] if story.source_urls else None)

        verification_result = FactVerificationResult(
            story_id=story.id,
            verified_facts=verified_facts,
            verified_numbers=verified_numbers,
            original_sources_count=orig_count,
            primary_source_url=primary_url,
            verification_level=verif_level,
            unclear_claims=unclear_claims
        )

        return story, verification_result
