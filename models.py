"""
SQLAlchemy Database Models for 'AI for Everyone' v2.
Postgres-ready schema with SQLite default.
Fulfills Data Model and Addendum 1 & 2 schemas.
"""

import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

Base = declarative_base()


class Source(Base):
    """Monitored content feed or primary origin."""
    __tablename__ = "sources"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    type = Column(String(32), nullable=False)  # official | news | preprint | forum | vendor_pr | government
    feed_url = Column(String(512), nullable=False)
    verified_at = Column(DateTime, default=datetime.utcnow)

    articles = relationship("Article", back_populates="source", cascade="all, delete-orphan")


class Article(Base):
    """
    Fetched article item.
    COPYRIGHT RULE: Store headline, URL, date, and our OWN-WORDS summary. NEVER full article text.
    """
    __tablename__ = "articles"

    id = Column(String(64), primary_key=True)
    source_id = Column(String(64), ForeignKey("sources.id"), nullable=False)
    url = Column(String(512), nullable=False, unique=True)
    title = Column(String(256), nullable=False)
    published_at = Column(String(32), nullable=False)
    own_words_summary = Column(Text, nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("Source", back_populates="articles")
    story_sources = relationship("StorySource", back_populates="article")


class Story(Base):
    """Deduplicated, clustered story representing a real-world launch or event."""
    __tablename__ = "stories"

    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    event_date = Column(String(32), nullable=False)
    category = Column(String(64), default="general")
    topic_tags_raw = Column(Text, default="[]")  # JSON list of topic tags
    primary_source_url = Column(String(512), nullable=True)
    source_count = Column(Integer, default=1)
    facts_json = Column(Text, default="[]")  # JSON list of verified facts
    signal_label = Column(String(16), nullable=False)  # useful | hype | buzz
    signal_tier = Column(String(16), nullable=True)   # must_know | good_to_know | null
    importance = Column(Integer, default=3)           # 1 to 5 scale
    scores_json = Column(Text, default="{}")
    confidence = Column(Float, default=0.95)
    is_milestone = Column(Boolean, default=False)
    status = Column(String(16), default="early_report")  # early_report | verified

    story_sources = relationship("StorySource", back_populates="story", cascade="all, delete-orphan")
    persona_cards = relationship("PersonaCard", back_populates="story", cascade="all, delete-orphan")

    @property
    def topic_tags(self) -> List[str]:
        try:
            return json.loads(self.topic_tags_raw)
        except Exception:
            return []

    @topic_tags.setter
    def topic_tags(self, tags: List[str]):
        self.topic_tags_raw = json.dumps(tags)


class StorySource(Base):
    """
    Join table linking stories to articles and original sources.
    Fulfills Addendum 1 (Source Links, type badges, link checkers).
    """
    __tablename__ = "story_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    story_id = Column(String(64), ForeignKey("stories.id"), nullable=False)
    article_id = Column(String(64), ForeignKey("articles.id"), nullable=True)
    origin_id = Column(String(64), nullable=True)  # original source after tracing
    url = Column(String(512), nullable=False)
    display_label = Column(String(128), default="Source")
    type_badge = Column(String(64), default="News")  # Official | News | Research (not yet peer reviewed) | Community discussion | Government
    is_primary = Column(Boolean, default=False)
    last_checked_at = Column(DateTime, default=datetime.utcnow)
    link_status = Column(String(16), default="ok")  # ok | broken

    story = relationship("Story", back_populates="story_sources")
    article = relationship("Article", back_populates="story_sources")


class PersonaCard(BaseModel if False else Base):
    """
    Cached persona card for a given (story_id, persona_id, depth).
    Includes spoken_text for Listen Mode (Addendum 2).
    """
    __tablename__ = "persona_cards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    story_id = Column(String(64), ForeignKey("stories.id"), nullable=False)
    persona_id = Column(String(32), nullable=False)  # student | teacher | entrepreneur | engineer_office
    depth = Column(String(16), default="simple")     # simple | detailed
    card_json = Column(Text, nullable=False)         # Full structured card
    spoken_text = Column(Text, nullable=False)       # Addendum 2: text for Web Speech API
    readability_grade = Column(Float, default=7.0)
    verified_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("Story", back_populates="persona_cards")


class User(Base):
    """Anonymous user profile stored via anonymous ID in localStorage."""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)  # Anonymous UUID
    persona_id = Column(String(32), default="office_pro")
    created_at = Column(DateTime, default=datetime.utcnow)

    interests = relationship("Interest", back_populates="user", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="user", cascade="all, delete-orphan")


class Interest(Base):
    """Interest weight per user per topic_tag."""
    __tablename__ = "interests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    topic_tag = Column(String(64), nullable=False)
    weight = Column(Float, default=1.0)

    user = relationship("User", back_populates="interests")


class Interaction(Base):
    """User interaction signals for personalization."""
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    story_id = Column(String(64), ForeignKey("stories.id"), nullable=False)
    type = Column(String(32), nullable=False)  # like | dislike | save | tell_me_more | not_for_me | listen | listen_complete
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interactions")


class GlossaryTerm(Base):
    """Everyday AI terms with friendly analogies."""
    __tablename__ = "glossary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    term = Column(String(128), unique=True, nullable=False)
    plain_definition = Column(Text, nullable=False)
    analogy = Column(Text, nullable=False)
    category = Column(String(64), default="general")
    concept_of_the_week = Column(Boolean, default=False)
    first_seen_story_id = Column(String(64), nullable=True)


class RejectionLog(Base):
    """Logs every verifier rejection for auditing and quality."""
    __tablename__ = "rejections_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stage = Column(String(64), nullable=False)
    story_id = Column(String(64), nullable=True)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Tool(Base):
    """Vetted AI tool with verified facts and freshness tracking."""
    __tablename__ = "tools"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    maker = Column(String(128), nullable=False)
    official_url = Column(String(512), nullable=False)
    summary_own_words = Column(Text, nullable=False)
    example_output = Column(Text, nullable=True)          # "What you'll get" example output
    difficulty = Column(String(32), default="Beginner")   # Beginner | Needs practice | Technical
    time_to_first_result = Column(String(64), default="about 3 minutes")
    free_option = Column(Text, nullable=True)             # Verified free option description
    paid_option = Column(Text, nullable=True)             # Verified paid option description
    platforms = Column(String(256), nullable=False)       # Phone, web, desktop
    account_needed = Column(String(64), default="Free account required")
    languages = Column(String(256), default="English + 50 languages")
    best_for = Column(Text, nullable=True)
    not_good_for = Column(Text, nullable=True)
    privacy_summary = Column(Text, nullable=True)
    privacy_note_url = Column(String(512), nullable=True)
    status = Column(String(32), default="active")         # active | changing | discontinued | acquired
    status_source_url = Column(String(512), nullable=True)
    last_verified_at = Column(String(32), nullable=False)

    facts = relationship("ToolFact", back_populates="tool", cascade="all, delete-orphan")
    task_fits = relationship("TaskToolFit", back_populates="tool", cascade="all, delete-orphan")


class ToolFact(Base):
    """Verified factual claim about a tool (pricing, limits, availability, privacy)."""
    __tablename__ = "tool_facts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tool_id = Column(String(64), ForeignKey("tools.id"), nullable=False)
    fact_type = Column(String(32), nullable=False)  # pricing | limits | availability | privacy
    value = Column(Text, nullable=False)
    source_url = Column(String(512), nullable=False)
    verified_at = Column(String(32), nullable=False)

    tool = relationship("Tool", back_populates="facts")


class Task(Base):
    """Everyday job to be done for non-technical users."""
    __tablename__ = "tasks"

    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    persona_tags_raw = Column(Text, default="[]")
    category = Column(String(64), default="general")
    not_for_ai = Column(Text, nullable=True)  # When NOT to use AI for this job

    tool_fits = relationship("TaskToolFit", back_populates="task", cascade="all, delete-orphan")

    @property
    def persona_tags(self) -> List[str]:
        try:
            return json.loads(self.persona_tags_raw)
        except Exception:
            return []

    @persona_tags.setter
    def persona_tags(self, tags: List[str]):
        self.persona_tags_raw = json.dumps(tags)


class TaskToolFit(Base):
    """Recommendation mapping a task to a tool with fit rationale and starter prompt."""
    __tablename__ = "task_tool_fit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    tool_id = Column(String(64), ForeignKey("tools.id"), nullable=False)
    fit_reason = Column(Text, nullable=False)
    caveat = Column(Text, nullable=False)
    starter_prompt = Column(Text, nullable=False)
    evidence_url = Column(String(512), nullable=False)
    last_verified_at = Column(String(32), nullable=False)
    rank = Column(Integer, default=1)  # 1 = Top pick, 2/3 = Also good

    task = relationship("Task", back_populates="tool_fits")
    tool = relationship("Tool", back_populates="task_fits")


class Capability(Base):
    """Then vs Now capability tracking real 2026 shifts with honesty checks."""
    __tablename__ = "capabilities"

    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    then_text = Column(Text, nullable=True)
    now_text = Column(Text, nullable=False)
    persona_tags_raw = Column(Text, default="[]")
    has_then_evidence = Column(Boolean, default=False)
    confidence = Column(String(32), default="High")
    what_it_means = Column(Text, nullable=False)
    before_stat_num = Column(Integer, nullable=True)
    before_stat_total = Column(Integer, nullable=True)
    before_stat_baseline = Column(String(128), nullable=True)
    after_stat_num = Column(Integer, nullable=True)
    after_stat_total = Column(Integer, nullable=True)

    evidence = relationship("CapabilityEvidence", back_populates="capability", cascade="all, delete-orphan")

    @property
    def persona_tags(self) -> List[str]:
        try:
            return json.loads(self.persona_tags_raw)
        except Exception:
            return []

    @persona_tags.setter
    def persona_tags(self, tags: List[str]):
        self.persona_tags_raw = json.dumps(tags)


class CapabilityEvidence(Base):
    """Evidence links supporting either the Then baseline or the Now advancement."""
    __tablename__ = "capability_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    capability_id = Column(String(64), ForeignKey("capabilities.id"), nullable=False)
    story_id = Column(String(64), nullable=True)
    side = Column(String(16), nullable=False)  # then | now
    source_url = Column(String(512), nullable=False)

    capability = relationship("Capability", back_populates="evidence")


class CatchupCache(Base):
    """Cached Catch-Up recaps per window bucket and persona."""
    __tablename__ = "catchup_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bucket = Column(String(32), nullable=False)  # 1_week | 1_month | since_january
    persona_id = Column(String(32), nullable=False)
    bullets_json = Column(Text, nullable=False)
    spoken_text = Column(Text, nullable=False)
    built_at = Column(String(32), nullable=False)
    window_end = Column(String(32), nullable=False)


class Feedback(Base):
    """Anonymous user feedback votes and notes on recommendations and recaps."""
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    target_type = Column(String(32), nullable=False)  # story | tool | catchup | then_now
    target_id = Column(String(64), nullable=False)
    vote = Column(String(16), nullable=False)         # up | down
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# Database Engine and Session Factory
DATABASE_URL = "sqlite:///platform_v2.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)
