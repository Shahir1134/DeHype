"""
Shared Pydantic schemas for the 'AI for Everyone' pipeline.
Supports P0 Trust, P1 Comprehension (3-Layer Cards, Personas, Source Types, Readability).
"""

from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field


# Source Classification (#5)
SourceType = Literal["official", "news", "preprint", "forum", "vendor_pr"]


class RawArticle(BaseModel):
    """Raw article fetched from an external source."""
    source_name: str
    source_url: str
    title: str
    date: str
    summary: str
    raw_content: Optional[str] = None
    content_status: str = "rss_only"
    content_source: str = "feed"


class SourceInfo(BaseModel):
    """Detailed source provenance and classification."""
    url: str
    domain: str
    source_type: SourceType
    is_primary: bool = False
    display_name: str


class FactItem(BaseModel):
    """An extracted factual statement tied directly to a source URL. No inference."""
    statement: str
    source_url: str
    source_type: SourceType = "news"
    status: Literal["confirmed", "single-source", "unclear"] = "single-source"


class NumberMetric(BaseModel):
    """Extracted numeric or benchmark data tied directly to a source."""
    metric: str
    value: str
    source: str
    status: Literal["confirmed", "single-source", "unclear"] = "single-source"
    notes: Optional[str] = None


class Story(BaseModel):
    """
    Deduplicated, clustered story representing an AI launch across multiple sources.
    Required output of Agent 1 (Fetcher).
    """
    id: str
    title: str
    date: str
    source_urls: List[str] = Field(default_factory=list)
    sources_detailed: List[SourceInfo] = Field(default_factory=list)
    facts: List[FactItem] = Field(default_factory=list)
    numbers: List[NumberMetric] = Field(default_factory=list)
    ecosystem: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    is_trivial: bool = False  # Filter for telemetry/patches (#13)


class FactVerificationResult(BaseModel):
    """Result of tracing each fact back to original sources and cross-checking."""
    story_id: str
    verified_facts: List[FactItem]
    verified_numbers: List[NumberMetric]
    original_sources_count: int
    primary_source_url: Optional[str] = None
    verification_level: Literal["verified", "early_report", "unconfirmed"] = "early_report"
    unclear_claims: List[str] = Field(default_factory=list)


# --- Agent 3: Signal Agent Models ---

class SignalScores(BaseModel):
    evidence: int = Field(ge=0, le=2)
    availability: int = Field(ge=0, le=2)
    novelty: int = Field(ge=0, le=2)
    user_impact: int = Field(ge=0, le=2)
    source_diversity: int = Field(ge=0, le=2)


class SignalResult(BaseModel):
    label: Literal["USEFUL", "HYPE", "BUZZ"]
    tier: Optional[Literal["must_know", "good_to_know"]] = None
    scores: SignalScores
    reasons: Dict[str, str] = Field(default_factory=dict)
    red_flags: List[str] = Field(default_factory=list)
    verdict_line: str  # Plain English neutral summary (#12)
    confidence: float = Field(ge=0.0, le=1.0)


# --- Agent 4: Explainer (3-Layer Card Models) ---

class JargonGlossaryItem(BaseModel):
    term: str
    one_line_analogy: str


class CardGlanceLayer(BaseModel):
    """Layer 1: Under 40 words with decision chips (#17)."""
    summary: str
    should_you_care: str  # e.g., "Yes, if you use spreadsheets or write emails"
    can_you_use_it: str   # e.g., "Yes, free download on your computer today"
    read_time: str = "1 min read"


class CardBuilderLayer(BaseModel):
    """Layer 3: Technical specifications and starter resources for engineers."""
    exact_metrics: List[Dict[str, str]] = Field(default_factory=list)
    hardware_requirements: str
    api_or_code_link: str
    starter_command: Optional[str] = None


class ExplainerResult(BaseModel):
    """Layer 2: Plain-language translation + anchors (#20, #23)."""
    product_name: str
    official_link: str
    headline: str
    what_happened: str
    better_than_before: str  # Must name baseline (#9) and ratio (#10)
    limitations: str
    jargon_glossary: List[JargonGlossaryItem] = Field(default_factory=list)
    readability_grade: float = 7.0
    is_grade_8_or_below: bool = True


# --- Agent 5: Persona-Based Why-It-Matters Models (#18, #19, #21) ---

PersonaName = Literal[
    "student", "teacher", "parent", "small_business",
    "job_seeker", "office_pro", "creator", "just_curious"
]


class PersonaOpportunityCard(BaseModel):
    persona: PersonaName
    is_relevant: bool
    relevance_reason: str
    what_it_unlocks: str
    try_it_today: str  # Uses free tools user already owns (#21)
    watch_out: str


# --- Full Pipeline Output Schema ---

class VerificationGate(BaseModel):
    status: Literal["passed", "failed"]
    flags: List[str] = Field(default_factory=list)


class PipelineStoryOutput(BaseModel):
    story_id: str
    product_name: str
    headline: str
    date: str
    sources_detailed: List[SourceInfo]
    verification_level: Literal["verified", "early_report", "unconfirmed"]
    signal: SignalResult
    glance: Optional[CardGlanceLayer] = None
    explainer: Optional[ExplainerResult] = None
    personas: Optional[Dict[str, PersonaOpportunityCard]] = None
    builder: Optional[CardBuilderLayer] = None
    verification: VerificationGate


class CuratedFeedOutput(BaseModel):
    """Curated daily feed enforcing 3 stories/day (#24) and metadata honesty (#2)."""
    run_date: str
    is_test_data: bool
    total_ingested: int
    sources_monitored_count: int
    daily_stories: List[PipelineStoryOutput]
    skip_today_list: List[Dict[str, Any]]  # Hype & buzz combined (#25)
    feed_summary: str
