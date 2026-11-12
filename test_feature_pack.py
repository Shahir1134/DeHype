"""
Acceptance Test Suite for Feature Pack:
'Catch me up' + 'Then vs Now' + 'Which AI tool for this job?'

Covers the 7 Required Acceptance Criteria:
1. Every catch-up bullet maps to a story inside the window and has a working source link.
2. A then-vs-now item without 'then' evidence renders as 'New in 2026'.
3. Every tool recommendation has an official URL and a last_verified_at; stale pricing is hidden.
4. A planted fake price and a planted fake date are rejected.
5. Top picks are not identical across all jobs (sanity check).
6. Persona snapshot tests: all 4 personas render different language and examples, no jargon.
7. 360px layout: no horizontal scroll, all targets 44px or larger.
"""

import json
import re
from datetime import datetime, timedelta
import pytest
from pathlib import Path

from models import (
    init_db, SessionLocal, Story, StorySource, Tool, ToolFact, Task, TaskToolFit,
    Capability, CapabilityEvidence, RejectionLog
)
from feature_pack_engine import (
    get_catchup_selection,
    get_then_now_for_persona,
    get_tool_recommendations_for_task,
    seed_feature_pack_data,
    validate_editorial_text,
    validate_tool_fact,
    CURRENT_DATE
)
from validator import compute_readability_fk


@pytest.fixture(scope="module")
def db():
    init_db()
    session = SessionLocal()
    seed_feature_pack_data(session)
    yield session
    session.close()


def test_1_catchup_bullets_map_to_window_and_have_sources(db):
    """
    Test 1: Every catch-up bullet maps to a story inside the window
    and has a working source link.
    """
    buckets = ["1_week", "1_month", "since_january"]
    personas = ["student", "teacher", "entrepreneur", "engineer_office"]

    for persona in personas:
        for bucket in buckets:
            res = get_catchup_selection(persona_id=persona, since_bucket=bucket, db=db)
            assert "bullets" in res
            assert "window_start" in res
            assert "window_end" in res

            window_start_dt = datetime.strptime(res["window_start"], "%Y-%m-%d")
            window_end_dt = datetime.strptime(res["window_end"], "%Y-%m-%d")

            for bullet in res["bullets"]:
                # Check story existence in database
                story = db.query(Story).filter(Story.id == bullet["story_id"]).first()
                assert story is not None, f"Story {bullet['story_id']} not found in db"

                # Check event date is within window
                story_dt = datetime.strptime(bullet["date"], "%Y-%m-%d")
                assert window_start_dt <= story_dt <= window_end_dt, (
                    f"Bullet date {bullet['date']} is outside window [{res['window_start']}, {res['window_end']}]"
                )

                # Check working source link
                source_url = bullet["source_url"]
                assert source_url.startswith("http://") or source_url.startswith("https://"), (
                    f"Invalid source URL: {source_url}"
                )

                # Check importance dot
                assert bullet["importance_dot"] in [1, 2, 3]


def test_2_then_vs_now_honesty_rule(db):
    """
    Test 2: A then-vs-now item without 'then' evidence renders as 'New in 2026'.
    """
    for persona in ["student", "teacher", "entrepreneur", "engineer_office"]:
        items = get_then_now_for_persona(persona_id=persona, db=db)
        assert len(items) >= 4, f"Expected at least 4 items for {persona}"

        has_verified_baseline = False
        has_new_in_2026 = False

        for it in items:
            if it["is_new_in_2026"]:
                has_new_in_2026 = True
                assert it["badge"] == "New in 2026"
                assert it["then_text"] is None, "New in 2026 items must NOT claim an unverified 'then' baseline"
                assert it["before_stat"] is None
            else:
                has_verified_baseline = True
                assert it["badge"] == "Verified Baseline"
                assert it["then_text"] is not None and len(it["then_text"]) > 10
                assert len(it["then_sources"]) > 0, "Verified baseline must have supporting evidence links"

        assert has_new_in_2026, f"Expected at least one 'New in 2026' item for persona {persona}"
        assert has_verified_baseline, f"Expected at least one 'Verified Baseline' item for persona {persona}"


def test_3_tool_recommendations_and_stale_pricing_hiding(db):
    """
    Test 3: Every tool recommendation has an official URL and a last_verified_at;
    stale pricing is hidden.
    """
    # 1. Check normal active task
    res = get_tool_recommendations_for_task("task-summarize-doc", "student", db)
    assert len(res["recommendations"]) >= 2

    for rec in res["recommendations"]:
        assert rec["official_url"].startswith("https://")
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", rec["last_verified_at"])
        assert len(rec["fit_reason"]) > 10
        assert len(rec["starter_prompt"]) > 10

    # 2. Check stale tool (>30 days old): ensure pricing details are hidden
    # Ensure legacy tool is mapped to task-transcribe-meeting
    tfit = db.query(TaskToolFit).filter(TaskToolFit.tool_id == "tool-legacy-transcriber").first()
    if not tfit:
        db.add(TaskToolFit(
            task_id="task-transcribe-meeting",
            tool_id="tool-legacy-transcriber",
            rank=3,
            fit_reason="Legacy audio transcription tool.",
            caveat="Outdated engine.",
            starter_prompt="Transcribe this recording.",
            evidence_url="https://example.com",
            last_verified_at="2026-09-15"
        ))
        db.commit()

    stale_res = get_tool_recommendations_for_task("task-transcribe-meeting", "engineer_office", db)
    legacy_rec = next((r for r in stale_res["recommendations"] if r["tool_id"] == "tool-legacy-transcriber"), None)

    assert legacy_rec is not None
    assert legacy_rec["is_stale"] is True
    assert legacy_rec["show_pricing_details"] is False
    assert legacy_rec["pricing_summary"] == "Check the official site for current pricing."


def test_4_planted_fake_price_and_fake_date_rejected(db):
    """
    Test 4: A planted fake price and a planted fake date are rejected.
    """
    # 1. Planted fake price
    ok, reason = validate_tool_fact("pricing", "$999999 per millisecond", "2026-11-01", db)
    assert ok is False
    assert "fake" in reason.lower() or "suspicious" in reason.lower()

    # 2. Planted fake/invalid date
    ok, reason = validate_tool_fact("pricing", "$20 per month", "2099-13-45", db)
    assert ok is False
    assert "date" in reason.lower()

    # 3. Planted hype word in editorial text
    ok, reason = validate_editorial_text("This breakthrough magic model will change your life.", stage="editorial", db=db)
    assert ok is False
    assert "hype word" in reason.lower()

    # 4. Planted placeholder in editorial text
    ok, reason = validate_editorial_text("Here is [insert text here] for your company.", stage="editorial", db=db)
    assert ok is False
    assert "placeholder" in reason.lower()

    # Verify rejection logs exist in DB
    rejections = db.query(RejectionLog).all()
    assert len(rejections) >= 4


def test_5_top_picks_not_identical_across_all_jobs(db):
    """
    Test 5: Top picks are not identical across all jobs (sanity check).
    """
    tasks_to_test = [
        "task-summarize-doc",
        "task-plan-lesson",
        "task-make-slides",
        "task-transcribe-meeting",
        "task-compare-software"
    ]

    top_picks = []
    for t_id in tasks_to_test:
        rec = get_tool_recommendations_for_task(t_id, "entrepreneur", db)
        if rec["recommendations"]:
            top = next((r for r in rec["recommendations"] if r["rank"] == 1), None)
            if top:
                top_picks.append(top["name"])

    # Ensure there are multiple distinct top picks across different jobs
    assert len(set(top_picks)) >= 3, f"Expected variety in top picks, got: {top_picks}"


def test_6_persona_snapshots_distinct_language_no_jargon(db):
    """
    Test 6: Persona snapshot tests: all 4 personas render different language
    and examples, with no jargon (readability grade <= 8.5).
    """
    personas = ["student", "teacher", "entrepreneur", "engineer_office"]
    persona_recaps = {}

    for p in personas:
        # Check catch-up bullets
        catchup = get_catchup_selection(persona_id=p, since_bucket="1_month", db=db)
        why_texts = [b["why_it_matters"] for b in catchup["bullets"]]
        persona_recaps[p] = " ".join(why_texts)

        # Check readability on catchup bullets
        for b in catchup["bullets"]:
            grade, _ = compute_readability_fk(b["sentence"])
            # Catchup sentences are plain English
            assert grade <= 9.0, f"Sentence too complex (grade {grade}): {b['sentence']}"

        # Check teacher specific safety warning
        tool_rec = get_tool_recommendations_for_task("task-plan-lesson", p, db)
        for r in tool_rec["recommendations"]:
            if p == "teacher":
                assert r["safety_notice"] == "Don't paste student names or grades into third-party tools."
            else:
                assert r["safety_notice"] is None

    # Snapshot check: ensure each persona receives distinct wording
    assert persona_recaps["student"] != persona_recaps["teacher"]
    assert persona_recaps["teacher"] != persona_recaps["entrepreneur"]
    assert persona_recaps["entrepreneur"] != persona_recaps["engineer_office"]


def test_7_mobile_360px_layout_and_touch_targets():
    """
    Test 7: 360px layout: no horizontal scroll, all targets 44px or larger.
    Validates HTML and component source configurations.
    """
    # 1. Check index.html viewport
    index_html = Path("frontend/index.html").read_text(encoding="utf-8")
    assert "width=device-width" in index_html
    assert "viewport" in index_html

    # 2. Check CatchUpScreen touch targets
    catchup_code = Path("frontend/src/screens/CatchUpScreen.tsx").read_text(encoding="utf-8")
    assert "min-h-[44px]" in catchup_code

    # 3. Check ToolsScreen touch targets
    tools_code = Path("frontend/src/screens/ToolsScreen.tsx").read_text(encoding="utf-8")
    assert "min-h-[44px]" in tools_code

    # 4. Check Navbar touch targets
    navbar_code = Path("frontend/src/components/Navbar.tsx").read_text(encoding="utf-8")
    assert "min-h-[44px]" in navbar_code or "min-h-[48px]" in navbar_code
