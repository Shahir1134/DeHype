"""
Automated unit tests for the 'AI for Everyone' pipeline.
Verifies all agents, classification logic, discrepancy detection, and caching.
"""

import pytest
from agents.fetcher import FetcherAgent
from agents.fact_verifier import FactVerifierAgent
from agents.signal_agent import SignalAgent
from agents.explainer import ExplainerAgent
from agents.why_it_matters import WhyItMattersAgent
from agents.claim_verifier import ClaimVerifierAgent
from cache_manager import PipelineCache
from validator import ContentValidator


def test_full_pipeline_classification():
    # 1. Fetcher
    fetcher = FetcherAgent()
    stories = fetcher.fetch_and_cluster(use_live=False)
    # 6 story clusters formed from 8 articles
    assert len(stories) == 6, f"Expected 6 story clusters, got {len(stories)}"

    # 2. Fact Verifier
    verifier = FactVerifierAgent()
    verified_stories = []
    reports = {}
    for s in stories:
        up_s, rep = verifier.verify_story(s)
        verified_stories.append(up_s)
        reports[up_s.id] = rep

    # Verify planted fake number detection on OmniLogic story
    omnilogic_story = next(s for s in verified_stories if "omnilogic" in s.id)
    omnilogic_rep = reports[omnilogic_story.id]
    assert len(omnilogic_rep.unclear_claims) > 0, "Fact Verifier failed to catch the planted fake benchmark!"
    assert any("humaneval" in c.lower() for c in omnilogic_rep.unclear_claims)

    # 3. Signal Agent Classification
    signal_agent = SignalAgent()
    labels = {}
    for s in verified_stories:
        sig = signal_agent.classify(s, reports[s.id])
        labels[s.id] = sig.label

    # Check 2 Useful, 2 Hype, 2 Buzz
    useful_count = sum(1 for l in labels.values() if l == "USEFUL")
    hype_count = sum(1 for l in labels.values() if l == "HYPE")
    buzz_count = sum(1 for l in labels.values() if l == "BUZZ")

    assert useful_count == 2, f"Expected 2 USEFUL stories, got {useful_count}"
    assert hype_count == 2, f"Expected 2 HYPE stories, got {hype_count}"
    assert buzz_count == 2, f"Expected 2 BUZZ stories, got {buzz_count}"

    # 4. Explainer 3-Layer & Readability
    explainer_agent = ExplainerAgent()
    why_it_matters_agent = WhyItMattersAgent()
    claim_verifier = ClaimVerifierAgent()

    llama_story = next(s for s in verified_stories if "llama" in s.id)
    glance = explainer_agent.generate_glance(llama_story)
    explainer = explainer_agent.explain(llama_story)
    builder = explainer_agent.generate_builder_layer(llama_story)
    personas = why_it_matters_agent.analyze_all_personas(llama_story)

    assert "Meta" in explainer.headline
    assert explainer.is_grade_8_or_below, "Readability must be Grade 8 or below!"
    assert "office_pro" in personas
    assert "small_business" in personas
    assert "student" in personas

    # 5. Claim Verifier
    gate = claim_verifier.verify_pipeline_output(llama_story, explainer, personas)
    assert gate.status == "passed", f"Claim verifier failed: {gate.flags}"


def test_validator_leaks_and_overclaims():
    leak_text = "This is a test [Technical Track] with some notes."
    leaks = ContentValidator.check_leaks(leak_text)
    assert len(leaks) > 0, "Should detect bracket leak!"

    overclaim_text = "This system completely guarantees zero errors in your code."
    overclaims = ContentValidator.check_overclaims(overclaim_text, verified_facts_text="Standard accuracy.")
    assert len(overclaims) > 0, "Should detect unsubstantiated overclaim!"


def test_cache_layer(tmp_path):
    db_file = tmp_path / "test_cache.db"
    cache = PipelineCache(db_path=str(db_file))
    sample_facts = [{"statement": "Fact A"}]
    payload = {"data": "cached_explainer"}

    # Initially empty
    assert cache.get("story-1", "general", "plain", sample_facts) is None

    # Set and retrieve
    cache.set("story-1", "general", "plain", sample_facts, payload)
    retrieved = cache.get("story-1", "general", "plain", sample_facts)
    assert retrieved == payload

    # Invalidate when facts change
    changed_facts = [{"statement": "Fact B"}]
    assert cache.get("story-1", "general", "plain", changed_facts) is None
