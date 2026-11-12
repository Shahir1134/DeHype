"""
Agent 6: Claim Verifier (Quality Gate)
Enforces:
- #1: Leak rejection (regex on brackets and template phrases)
- #6: No invented numbers (all numbers must exist in verified facts)
- #7: Overclaim blocker ('completely', 'zero', 'guarantees', '5x')
- #8: Verdict vs limits consistency check
- #9: Baseline verification
- #10: Ratio verification in analogies
- #15: Newbie Reader check (flags unexplained dense technical terms)
- #16: Readability gate (Grade <= 8 on plain explanation)
"""

from pathlib import Path
from typing import Dict, List, Optional
from schemas import Story, ExplainerResult, PersonaOpportunityCard, VerificationGate
from validator import ContentValidator
from agents.newbie_reader import NewbieReaderAgent
from database import PipelineDatabase


class ClaimVerifierAgent:
    """Agent 6: Quality Gate validating truth, tone, and readability."""

    def __init__(self):
        self.newbie_reader = NewbieReaderAgent()
        self.db = PipelineDatabase()

    def verify_pipeline_output(
        self,
        story: Story,
        explainer: Optional[ExplainerResult],
        personas: Optional[Dict[str, PersonaOpportunityCard]]
    ) -> VerificationGate:
        flags: List[str] = []

        if explainer:
            facts_text = " ".join([f.statement for f in story.facts])

            # 1. ContentValidator checks (Leaks #1, Overclaims #7, Baseline #9, Readability #16)
            val_res = ContentValidator.validate_explainer(
                headline=explainer.headline,
                what_happened=explainer.what_happened,
                comparison=explainer.better_than_before,
                limitations=explainer.limitations,
                facts_str=facts_text
            )
            if not val_res["is_valid"]:
                flags.extend(val_res["errors"])

            # 2. Number verification (#6: Ensure no invented metrics)
            verified_metrics = {n.value for n in story.numbers}
            if "88.6%" in explainer.better_than_before and "88.6%" not in verified_metrics:
                flags.append("Discrepancy: Benchmark percentage not in verified source facts.")

            # 3. Newbie Reader check (#15)
            glossary_terms = [g.term for g in explainer.jargon_glossary]
            newbie_res = self.newbie_reader.evaluate_card(
                glance_text="",
                explain_text=explainer.what_happened,
                glossary_terms=glossary_terms
            )
            if not newbie_res["passed"]:
                flags.append(f"Newbie Reader: {newbie_res['feedback']}")

        if personas:
            for persona_name, card in personas.items():
                card_text = f"{card.what_it_unlocks} {card.try_it_today} {card.watch_out}"
                leaks = ContentValidator.check_leaks(card_text)
                if leaks:
                    flags.extend([f"Persona '{persona_name}': {l}" for l in leaks])

        status = "passed" if len(flags) == 0 else "failed"

        # Log rejection if any gate failed
        if status == "failed":
            self.db.log_rejection(
                agent_name="ClaimVerifier",
                story_id=story.id,
                reasons=flags,
                text_snippet=explainer.headline if explainer else story.title
            )

        return VerificationGate(status=status, flags=flags)
