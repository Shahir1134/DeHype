import pytest
from datetime import datetime
from models import SessionLocal, init_db
from api import get_feed, get_personas

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    yield db
    db.close()

def test_persona_labels_no_enum():
    """Rule 1: Show persona labels as 'Office / Engineer', never enum values like ENGINEER_OFFICE."""
    personas = get_personas()
    # personas is a list of persona objects
    engineer_persona = next((p for p in personas if p["id"] == "engineer_office"), None)
    assert engineer_persona is not None
    label = engineer_persona.get("name") or engineer_persona.get("label", "")
    assert "ENGINEER_OFFICE" not in label
    assert "engineer_office" not in label

def test_feed_time_window_filtering(db_session):
    """Rule 4: Past 24h | Past 7 days filters by primary source published_at, nothing older appears."""
    feed = get_feed(persona="student", time_window="7d", db=db_session)
    cards = feed.get("today_stories", [])
    now_dt = datetime.now()
    for card in cards:
        pub_str = card.get("published_at") or card.get("event_date")
        if pub_str:
            dt = datetime.strptime(pub_str, "%Y-%m-%d")
            diff_days = (now_dt - dt).days
            assert 0 <= diff_days <= 7, f"Story {card.get('title')} date {pub_str} outside 7 days"

def test_source_labeling_and_diversity(db_session):
    """Rule 5: 'From the company', at most 1 card per source, at most 1 high relevance per 3 stories."""
    for persona in ["student", "teacher", "entrepreneur", "engineer_office"]:
        feed = get_feed(persona=persona, limit=3, db=db_session)
        cards = feed.get("today_stories", [])
        
        seen_sources = set()
        high_relevance_count = 0
        for card in cards:
            sources = card.get("sources", [])
            for s in sources:
                assert s.get("type_badge") != "Official", "Source type must not be 'Official'"
            
            # Primary source uniqueness (at most 1 card per source)
            prim = next((s for s in sources if s.get("is_primary")), None)
            if prim:
                src_key = prim.get("display_label") or prim.get("url")
                assert src_key not in seen_sources, f"Duplicate source on page: {src_key}"
                seen_sources.add(src_key)
            
            if card.get("does_it_matter", {}).get("status") == "high":
                high_relevance_count += 1
        
        assert high_relevance_count <= 1, f"Found {high_relevance_count} high relevance stories on {persona} feed (max 1)"

def test_motion_constants_and_flags():
    """Verify motion.ts constants adhere to the strict Motion System spec."""
    with open("frontend/src/motion.ts", "r", encoding="utf-8") as f:
        code = f.read()
    
    # Durations
    assert "fast: 0.16" in code
    assert "base: 0.24" in code
    assert "slow: 0.4" in code
    assert "hero: 0.6" in code
    assert "reduced: 0.12" in code
    # Springs
    assert "stiffness: 380" in code
    assert "damping: 30" in code
    assert "stiffness: 220" in code
    assert "damping: 26" in code
    # Stagger
    assert "delay: 0.06" in code
    assert "max: 6" in code
    # Distance, press, hover
    assert "distance = 12" in code
    assert "scale: 0.97" in code
    assert "y: -2" in code
