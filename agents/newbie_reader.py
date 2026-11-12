"""
Agent: Newbie Reader (#15)
Simulates an everyday reader with zero technical AI background.
Scans each card and lists every technical word or concept it doesn't understand.
Any flagged word without an immediate everyday definition triggers a simplification rewrite.
"""

import re
from typing import List, Dict, Set


# Common AI terms that confuse non-technical readers unless immediately explained
DENSE_JARGON_TERMS = {
    "quantization", "fp8", "fp16", "int4", "4-bit", "weights", "open-weights",
    "parameters", "context window", "latent reasoning", "test-time compute",
    "mmlu", "gsm8k", "aime", "humaneval", "inference", "vllm", "vram", "rollouts",
    "multimodal", "fine-tuning", "synthetic data", "distillation", "moe"
}


class NewbieReaderAgent:
    """Agent: Evaluates card readability from the eyes of a beginner."""

    def __init__(self):
        self.jargon_set = DENSE_JARGON_TERMS

    def inspect_text(self, text: str, defined_terms: Set[str] = None) -> List[str]:
        """
        Scans text for dense technical jargon.
        If a term is already explained in defined_terms (or glossary), it is forgiven.
        """
        flagged = []
        defined = {t.lower() for t in (defined_terms or set())}
        words = re.findall(r"[A-Za-z0-9\-]+", text.lower())

        for term in self.jargon_set:
            if term in text.lower():
                # Check if this term was given an everyday analogy in the glossary or text
                is_forgiven = any(term in d for d in defined) or (
                    f"like " in text.lower() and term in text.lower()
                )
                if not is_forgiven:
                    flagged.append(term)

        return sorted(list(set(flagged)))

    def evaluate_card(self, glance_text: str, explain_text: str, glossary_terms: List[str]) -> Dict[str, any]:
        """Runs the Newbie Reader test on a card."""
        defined = set(glossary_terms)
        unexplained = self.inspect_text(f"{glance_text} {explain_text}", defined_terms=defined)
        return {
            "passed": len(unexplained) == 0,
            "unexplained_words": unexplained,
            "feedback": (
                "Card is beginner-friendly!"
                if len(unexplained) == 0
                else f"Too complex for a beginner: the terms {unexplained} need everyday analogies or removal."
            )
        }
