"""
Evaluation Harness for 'AI for Everyone' pipeline (#33).
Runs the full evaluation against the 6-story labeled set + planted fake number.
Fails if any expected label is missed, if fake numbers pass unnoticed, or if leaks occur.
"""

import sys
from pathlib import Path
from agents.fetcher import FetcherAgent
from agents.fact_verifier import FactVerifierAgent
from agents.signal_agent import SignalAgent
from agents.explainer import ExplainerAgent
from agents.why_it_matters import WhyItMattersAgent
from agents.claim_verifier import ClaimVerifierAgent
from validator import ContentValidator


def run_eval():
    print("=" * 65)
    print("  RUNNING PIPELINE EVALUATION HARNESS (#33)")
    print("=" * 65)

    fetcher = FetcherAgent()
    verifier = FactVerifierAgent()
    signal_agent = SignalAgent()
    explainer_agent = ExplainerAgent()
    why_it_matters_agent = WhyItMattersAgent()
    claim_verifier = ClaimVerifierAgent()

    # Step 1: Ingest
    stories = fetcher.fetch_and_cluster(use_live=False)
    print(f"\n[Eval 1/5] Ingested {len(stories)} clusters.")

    # Step 2: Fact Verification
    reports = {}
    verified_stories = []
    for s in stories:
        up_s, rep = verifier.verify_story(s)
        verified_stories.append(up_s)
        reports[up_s.id] = rep

    # Verify planted fake number detection on OmniLogic story
    omnilogic_story = next(s for s in verified_stories if "omnilogic" in s.id)
    omnilogic_rep = reports[omnilogic_story.id]
    assert len(omnilogic_rep.unclear_claims) > 0, "FAILED: Planted fake number was not caught!"
    print(f"[Eval 2/5] Planted fake number check: PASSED (caught {omnilogic_rep.unclear_claims[0]})")

    # Step 3: Signal Agent classification
    labels = {}
    for s in verified_stories:
        sig = signal_agent.classify(s, reports[s.id])
        labels[s.id] = sig.label

    useful_count = sum(1 for l in labels.values() if l == "USEFUL")
    hype_count = sum(1 for l in labels.values() if l == "HYPE")
    buzz_count = sum(1 for l in labels.values() if l == "BUZZ")

    print(f"[Eval 3/5] Label counts: {useful_count} USEFUL, {hype_count} HYPE, {buzz_count} BUZZ")
    assert useful_count == 2, f"Expected 2 USEFUL, got {useful_count}"
    assert hype_count == 2, f"Expected 2 HYPE, got {hype_count}"
    assert buzz_count == 2, f"Expected 2 BUZZ, got {buzz_count}"

    # Step 4: Leak and Readability Gate on Useful Stories
    print("[Eval 4/5] Checking placeholder leaks (#1) & readability grade (#16)...")
    for s in verified_stories:
        if labels[s.id] == "USEFUL":
            glance = explainer_agent.generate_glance(s)
            explainer = explainer_agent.explain(s)
            personas = why_it_matters_agent.analyze_all_personas(s)

            # Check no leaks
            combined = f"{glance.summary} {explainer.what_happened} {explainer.better_than_before}"
            leaks = ContentValidator.check_leaks(combined)
            assert len(leaks) == 0, f"FAILED: Leak found: {leaks}"

            # Check readability grade 8 or below
            assert explainer.is_grade_8_or_below, f"FAILED: Readability grade {explainer.readability_grade} > 8.0"

            # Check Claim Verifier
            gate = claim_verifier.verify_pipeline_output(s, explainer, personas)
            assert gate.status == "passed", f"FAILED: Quality Gate failed on {s.id}: {gate.flags}"

    print("[Eval 5/5] All Claim Verifier & Quality Gates: PASSED.")
    print("\n[SUCCESS] Pipeline passes 100% of P0 Trust and P1 Comprehension benchmarks.")
    return True


if __name__ == "__main__":
    success = run_eval()
    sys.exit(0 if success else 1)
