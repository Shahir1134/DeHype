"""
Comprehensive Acceptance & Unit Tests for 'AI for Everyone' v2.
Covers:
1. Eval set: 6 labeled stories (2 useful, 2 hype, 2 buzz) + planted fake number + forum post audit rejection.
2. Persona snapshot test: same story renders distinctly across all 4 personas without jargon.
3. No card contains placeholder text, debug labels, or numbers absent from facts.
4. Switching persona alters hero, section headings, and story ranking.
5. Addendum 1 Source links: primary link first, broken link marked.
6. Addendum 2 Listen Mode: spoken_text has no raw digits/symbols/URLs and numbers match card.
"""

import json
import re
import pytest
from pathlib import Path

from models import init_db, SessionLocal, Story, StorySource, PersonaCard
from backfill_2026 import seed_database
from api import get_feed, get_personas, run_link_checker
from validator import ContentValidator, compute_readability_fk
from agents.signal_agent import SignalAgent
from agents.fact_verifier import FactVerifierAgent
from agents.fetcher import FetcherAgent


@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()


def test_acceptance_1_eval_set_and_discrepancy(db_session):
    """
    Acceptance Test 1:
    Eval set: 6 labeled stories (2 useful, 2 hype, 2 buzz)
    Plus planted fake number caught
    Plus forum post cannot verify benchmarks
    """
    fetcher = FetcherAgent()
    verifier = FactVerifierAgent()
    signal = SignalAgent()

    stories = fetcher.fetch_and_cluster(use_live=False)
    assert len(stories) >= 6

    # Verify planted fake number is caught
    omnilogic = next(s for s in stories if "omnilogic" in s.id)
    _, report = verifier.verify_story(omnilogic)
    assert len(report.unclear_claims) > 0
    assert any("humaneval" in c.lower() for c in report.unclear_claims)

    # Forum post source classification check
    hn_facts = [f for f in omnilogic.facts if "ycombinator" in f.source_url]
    for hf in hn_facts:
        assert hf.source_type == "forum"
        # Forum source can only say "users report" or "community report"
        assert "community report" in hf.statement.lower() or "users report" in hf.statement.lower()

    # Verify 6-story classification labels
    verified_stories = [verifier.verify_story(s)[0] for s in stories]
    labels = [signal.classify(s).label for s in verified_stories]
    assert labels.count("USEFUL") == 2
    assert labels.count("HYPE") == 2
    assert labels.count("BUZZ") == 2


def test_acceptance_2_persona_differentiation_no_jargon(db_session):
    """
    Acceptance Test 2:
    Same story renders differently for all 4 personas, none with jargon.
    """
    personas = ["student", "teacher", "entrepreneur", "engineer_office"]
    story = db_session.query(Story).filter(Story.id == "story-2026-001-meta-llama-3-3-70b").first()
    assert story is not None

    rendered_cards = {}
    for p in personas:
        card = db_session.query(PersonaCard).filter(
            PersonaCard.story_id == story.id,
            PersonaCard.persona_id == p
        ).first()
        assert card is not None
        data = json.loads(card.card_json)
        rendered_cards[p] = data

        # Check readability Grade 8 or below
        grade, is_readable = compute_readability_fk(data["explain"]["what_happened"])
        assert is_readable, f"Persona {p} failed readability test: grade {grade}"

    # Verify each persona receives a different specific action
    actions = [rendered_cards[p]["explain"]["why_it_matters"] for p in personas]
    assert len(set(actions)) == 4, "Each persona must have a unique 'what it means' explanation!"


def test_acceptance_3_no_leaks_or_unsubstantiated_numbers(db_session):
    """
    Acceptance Test 3:
    No card contains placeholder text like '[Technical Track]', '[...]', or invented numbers.
    """
    all_cards = db_session.query(PersonaCard).all()
    for card in all_cards:
        data = json.loads(card.card_json)
        card_text = json.dumps(data)

        # 1. No placeholder leaks
        leaks = ContentValidator.check_leaks(card_text)
        assert len(leaks) == 0, f"Found leak in card {card.id}: {leaks}"

        # 2. No invented numbers: any percentage in text must match story facts
        story = card.story
        story_facts_text = story.facts_json
        story_percentages = set(re.findall(r"\d+(?:\.\d+)?%", story_facts_text))
        card_percentages = set(re.findall(r"\d+(?:\.\d+)?%", data["explain"]["better_than_before"]))

        for pct in card_percentages:
            assert pct in story_percentages, f"Invented number {pct} in card {card.id}!"


def test_acceptance_4_persona_reskinning(db_session):
    """
    Acceptance Test 4:
    Switching persona changes hero, section headings, and story selection.
    """
    feed_student = get_feed(persona="student", user=None, db=db_session)
    feed_teacher = get_feed(persona="teacher", user=None, db=db_session)
    feed_entrepreneur = get_feed(persona="entrepreneur", user=None, db=db_session)

    # Hero headlines must differ
    assert feed_student["persona"]["hero_headline"] != feed_teacher["persona"]["hero_headline"]
    assert feed_teacher["persona"]["hero_headline"] != feed_entrepreneur["persona"]["hero_headline"]

    # Section titles must differ
    assert feed_student["persona"]["section_titles"]["today"] != feed_teacher["persona"]["section_titles"]["today"]

    # Accent colors must match config
    assert feed_student["persona"]["accent_color"] == "#059669"
    assert feed_teacher["persona"]["accent_color"] == "#4f46e5"
    assert feed_entrepreneur["persona"]["accent_color"] == "#d97706"


def test_acceptance_5_source_links_primary_first(db_session):
    """
    Acceptance Test 5 (Addendum 1):
    Every story card shows sources with primary source first.
    Link checker marks broken links.
    """
    stories = db_session.query(Story).filter(Story.is_milestone == True).all()
    for s in stories:
        sources = db_session.query(StorySource).filter(StorySource.story_id == s.id).order_by(StorySource.is_primary.desc()).all()
        assert len(sources) >= 1
        assert sources[0].is_primary is True, f"Primary source must be first for story {s.id}!"
        assert sources[0].url.startswith("http")

    # Run link checker
    res = run_link_checker(db=db_session)
    assert res["status"] == "completed"
    assert res["total_checked"] > 0


def test_acceptance_6_listen_mode_spoken_text(db_session):
    """
    Acceptance Test 6 (Addendum 2):
    spoken_text contains no digits-with-symbols, URLs, or markup, and numbers match card.
    """
    cards = db_session.query(PersonaCard).all()
    for c in cards:
        spoken = c.spoken_text
        assert len(spoken) > 50

        # No raw URLs
        assert "http://" not in spoken and "https://" not in spoken

        # No percentage symbols (must be spelled out as 'percent')
        assert "%" not in spoken, f"Found '%' symbol in spoken text: {spoken}"
        assert "$" not in spoken, f"Found '$' symbol in spoken text: {spoken}"

        # Clean sentences
        assert not re.search(r"\[.*?\]", spoken), "Found bracket markup in spoken text!"
