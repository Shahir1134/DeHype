"""
Test suite validating Learn section content:
1. All 6 concept files exist and have valid structure
2. Resources and status board files exist and validate
3. No banned absolutes ('never', 'always', 'guarantees', 'without hallucinations', '100%') in lesson text
4. No hardcoded perishable facts in lesson text
5. Alt text / stage descriptions exist for all steps
6. All quiz items have explanations and valid correct_index
7. All resources have levels and valid URLs
8. Both simple and technical fields are populated
"""

import json
import re
from pathlib import Path
import pytest

CONTENT_DIR = Path(__file__).parent / "content"

BANNED_ABSOLUTES = [
    r"\bnever\b",
    r"\balways\b",
    r"\bguarantees\b",
    r"\bwithout hallucinations\b",
    r"\b100%\b",
    r"\b100 percent\b"
]

PERISHABLE_PATTERNS = [
    r"\b\$\d+(\.\d+)?\/mo\b",
    r"\b\$\d+(\.\d+)? per month\b"
]

EXPECTED_CONCEPTS = [
    "chatbot-inside",
    "open-weights",
    "rag",
    "evals",
    "mcp",
    "multi-agent"
]


def test_resources_json():
    res_path = CONTENT_DIR / "resources.json"
    assert res_path.exists(), "content/resources.json must exist"
    with open(res_path, "r", encoding="utf-8") as f:
        resources = json.load(f)
    assert len(resources) >= 15, "Should have at least 15 verified resources"
    for r in resources:
        assert "id" in r and r["id"]
        assert "concept_id" in r and r["concept_id"]
        assert r["type"] in ["video", "doc", "repo"]
        assert r["level"] in ["beginner", "intermediate", "advanced"]
        assert "url" in r and r["url"].startswith("http")
        assert "what_youll_learn" in r and r["what_youll_learn"]
        assert r["link_status"] in ["ok", "broken"]


def test_status_board_json():
    status_path = CONTENT_DIR / "status_board.json"
    assert status_path.exists(), "content/status_board.json must exist"
    with open(status_path, "r", encoding="utf-8") as f:
        items = json.load(f)
    assert len(items) >= 4, "Should have status board entries"
    for item in items:
        assert "id" in item and item["id"]
        assert "subject" in item and item["subject"]
        assert "current_status" in item and item["current_status"]
        assert "verified_at" in item
        assert "source_url" in item and item["source_url"].startswith("http")
        assert item["report_status"] in ["verified", "reports_differ", "unverified"]


@pytest.mark.parametrize("concept_id", EXPECTED_CONCEPTS)
def test_concept_schema_and_rules(concept_id):
    file_path = CONTENT_DIR / "concepts" / f"{concept_id}.json"
    assert file_path.exists(), f"Concept file {concept_id}.json must exist"
    
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Required fields
    assert data["id"] == concept_id
    assert "?" in data["title_question"], "Title question must be question-first"
    assert "one_liner" in data and len(data["one_liner"]) > 10
    assert len(data["steps"]) >= 4, "Should have 4-5 steps"
    assert "analogy" in data and "breaks" in data["analogy"]
    assert "myth" in data and "claim" in data["myth"] and "reality" in data["myth"]
    assert "demo" in data and "type" in data["demo"]
    assert len(data["seen_in"]) >= 2
    
    # Persona examples
    for p in ["student", "teacher", "entrepreneur", "engineer_office"]:
        assert p in data["persona_examples"]
        assert len(data["persona_examples"][p]) > 10

    # Quiz: 3 items with instant kind explanation
    assert len(data["quiz"]) == 3
    for q in data["quiz"]:
        assert len(q["options"]) >= 3
        assert 0 <= q["correct_index"] < len(q["options"])
        assert "explanation" in q and len(q["explanation"]) > 10, "Every quiz item must have an explanation"

    # Explain back
    assert "explain_back" in data and "template" in data["explain_back"]

    # Technical depth
    assert "technical" in data
    assert len(data["technical"]["bullets"]) >= 2
    assert "code_panel" in data["technical"]
    assert len(data["technical"]["code_panel"]["code"]) > 20

    # Resources reference
    assert len(data["resources"]) >= 1

    # Rule 6: Lint banned absolutes in lesson text
    lesson_texts = [
        data["one_liner"],
        *[s["text"] for s in data["steps"]],
        data["analogy"]["text"],
        data["analogy"]["breaks"],
        data["myth"]["claim"],
        data["myth"]["reality"],
        *data["persona_examples"].values(),
        *[q["explanation"] for q in data["quiz"]]
    ]
    full_lesson_text = " ".join(lesson_texts)

    for pat in BANNED_ABSOLUTES:
        match = re.search(pat, full_lesson_text, re.IGNORECASE)
        assert not match, f"Concept '{concept_id}' contains banned absolute '{match.group(0)}' (rule 6)"

    for pat in PERISHABLE_PATTERNS:
        match = re.search(pat, full_lesson_text, re.IGNORECASE)
        assert not match, f"Concept '{concept_id}' contains hardcoded perishable fact '{match.group(0)}' (rule 8)"

    # Stage state alt text check
    for s in data["steps"]:
        assert "stage_state" in s and "description" in s["stage_state"]
        assert len(s["stage_state"]["description"]) >= 10, f"Step {s['step_number']} lacks visual stage description"
