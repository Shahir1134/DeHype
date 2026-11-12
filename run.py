#!/usr/bin/env python3
"""
'AI for Everyone' Pipeline Runner.
Runs end-to-end agent pipeline with P0 Trust & P1 Comprehension Gates:
Fetcher -> Fact Verifier -> Signal Agent -> Explainer (3-Layer) -> Persona WIM -> Claim Verifier -> Cache -> Feed Limiter -> JSON
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Add current workspace to python path
sys.path.insert(0, str(Path(__file__).parent))

from schemas import PipelineStoryOutput, Story
from agents.fetcher import FetcherAgent
from agents.fact_verifier import FactVerifierAgent
from agents.signal_agent import SignalAgent
from agents.explainer import ExplainerAgent
from agents.why_it_matters import WhyItMattersAgent
from agents.claim_verifier import ClaimVerifierAgent
from cache_manager import PipelineCache
from feed_limiter import FeedLimiter
from database import PipelineDatabase


def run_full_pipeline(
    live: bool = False,
    limit: int = 6,
    output_file: str = "output_final.json"
):
    print("=" * 70)
    print("  AI FOR EVERYONE - COMPLETE AGENT PIPELINE EXECUTION")
    print("=" * 70)

    cache = PipelineCache()
    db = PipelineDatabase()

    # Step 1: Ingestion & Clustering
    print(f"\n[Step 1: Fetcher] Ingesting & clustering launches from sources (Live={live})...")
    fetcher = FetcherAgent()
    raw_stories = fetcher.fetch_and_cluster(use_live=live)

    # Filter out trivial stories (#13)
    active_stories = [s for s in raw_stories if not s.is_trivial]
    print(f"  -> Dropped {len(raw_stories) - len(active_stories)} trivial patch/telemetry stories (#13).")

    if limit:
        active_stories = active_stories[:limit]

    # Step 2: Fact Verification & Source Typing
    print(f"\n[Step 2: Fact Verifier] Tracing original sources & typing {len(active_stories)} stories...")
    verifier = FactVerifierAgent()
    verified_stories = []
    verif_reports = {}

    for s in active_stories:
        updated_s, report = verifier.verify_story(s)
        verified_stories.append(updated_s)
        verif_reports[updated_s.id] = report

    # Step 3: Signal Agent (Calibrated Classifier)
    print("\n[Step 3: Signal Agent] Calibrated scoring across evidence, availability, novelty, impact...")
    signal_agent = SignalAgent()
    signal_results = {}
    for s in verified_stories:
        sig = signal_agent.classify(s, verif_reports.get(s.id))
        signal_results[s.id] = sig
        print(f"  -> '{s.title[:45]}...' => [{sig.label}] | {sig.verdict_line}")

    # Steps 4 & 5: Explainer (3-Layer) & Personas WIM (Useful stories only)
    explainer_agent = ExplainerAgent()
    why_it_matters_agent = WhyItMattersAgent()
    claim_verifier = ClaimVerifierAgent()

    pipeline_outputs: list[PipelineStoryOutput] = []

    print("\n[Steps 4-6: Explainer (3-Layer), Persona WIM, Claim Verifier & Cache]...")
    for s in verified_stories:
        sig = signal_results[s.id]
        verif_report = verif_reports[s.id]

        if sig.label == "USEFUL":
            # Check cache
            cached_explainer = cache.get(s.id, "general", "plain", [f.model_dump() for f in s.facts])
            if cached_explainer:
                print(f"  [Cache HIT] Story {s.id}")
                explainer = explainer_agent.explain(s)
            else:
                explainer = explainer_agent.explain(s)
                cache.set(s.id, "general", "plain", [f.model_dump() for f in s.facts], explainer.model_dump())

            glance = explainer_agent.generate_glance(s)
            builder = explainer_agent.generate_builder_layer(s)
            personas = why_it_matters_agent.analyze_all_personas(s)

            # Step 6: Claim Verifier
            verif_gate = claim_verifier.verify_pipeline_output(s, explainer, personas)
            product_name = explainer.product_name
        else:
            # HYPE & BUZZ get filtered with verdict only
            glance = None
            explainer = None
            builder = None
            personas = None
            verif_gate = claim_verifier.verify_pipeline_output(s, None, None)
            product_name = s.title.split(":")[0] if ":" in s.title else s.title[:30]

        output_obj = PipelineStoryOutput(
            story_id=s.id,
            product_name=product_name,
            headline=explainer.headline if explainer else s.title,
            date=s.date,
            sources_detailed=s.sources_detailed,
            verification_level=verif_report.verification_level,
            signal=sig,
            glance=glance,
            explainer=explainer,
            personas=personas,
            builder=builder,
            verification=verif_gate
        )
        pipeline_outputs.append(output_obj)

    # Step 7: Feed Limiter (Curator)
    limiter = FeedLimiter(max_daily_stories=3)
    curated = limiter.curate(
        stories=pipeline_outputs,
        total_ingested=len(raw_stories),
        sources_monitored_count=3,
        is_test_data=not live
    )

    # Save to final output file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(curated.model_dump(), f, indent=2)

    print("\n" + "=" * 70)
    print("  PIPELINE EXECUTION SUMMARY")
    print("=" * 70)
    print(f"Total Ingested: {curated.total_ingested}")
    print(f"Daily Stories Curated (Cap 3): {len(curated.daily_stories)}")
    print(f"Skip Today Items (Hype + Buzz): {len(curated.skip_today_list)}")
    print(f"Run Date: {curated.run_date} (Is Test Data: {curated.is_test_data})")
    print(f"\n[Saved curated output to: {output_file}]")
    return curated


def main():
    parser = argparse.ArgumentParser(description="AI for Everyone: Master Pipeline Runner")
    parser.add_argument("--limit", type=int, default=6, help="Maximum number of stories to process")
    parser.add_argument("--live", action="store_true", help="Fetch live feeds over the network")
    parser.add_argument("--output", type=str, default="output_final.json", help="Path to save final output JSON")

    args = parser.parse_args()
    run_full_pipeline(live=args.live, limit=args.limit, output_file=args.output)


if __name__ == "__main__":
    main()
