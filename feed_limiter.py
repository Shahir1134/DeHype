"""
Feed Limiter & Anti-Overwhelm Curator.
Fulfills:
- #2: Headers computed from data, not hardcoded (pull from run metadata, no fake claims)
- #24: Cap daily feed to max 3 stories with read-time labels
- #25: Beginners see 'Skip these today' (hype and buzz merged); keep internal labels
"""

from datetime import datetime
from typing import List, Dict, Any
from schemas import PipelineStoryOutput, CuratedFeedOutput


class FeedLimiter:
    """Curates output to strictly prevent user overwhelm."""

    def __init__(self, max_daily_stories: int = 3):
        self.max_daily_stories = max_daily_stories

    def curate(
        self,
        stories: List[PipelineStoryOutput],
        total_ingested: int,
        sources_monitored_count: int = 3,
        is_test_data: bool = True
    ) -> CuratedFeedOutput:
        daily_candidates: List[PipelineStoryOutput] = []
        skip_list: List[Dict[str, Any]] = []

        for s in stories:
            if s.signal.label == "USEFUL":
                daily_candidates.append(s)
            else:
                # Merge Hype & Buzz for beginners into 'Skip these today' (#25)
                # Map internal tags to plain phrases (#14)
                if s.signal.label == "HYPE":
                    skip_reason_tag = "Big promise, nothing to test yet"
                else:
                    skip_reason_tag = "High chatter, no direct user impact"

                skip_list.append({
                    "story_id": s.story_id,
                    "title": s.headline,
                    "category_plain": skip_reason_tag,
                    "internal_label": s.signal.label,
                    "verdict": s.signal.verdict_line,
                    "red_flags": s.signal.red_flags,
                    "primary_source": s.sources_detailed[0].url if s.sources_detailed else ""
                })

        # Cap daily feed to max 3 stories (#24)
        curated_daily = daily_candidates[:self.max_daily_stories]

        # Feed summary computed purely from metadata (#2)
        feed_summary = (
            f"From {total_ingested} launches evaluated across {sources_monitored_count} sources, "
            f"{len(curated_daily)} passed all trust and usefulness gates for today's feed."
        )

        return CuratedFeedOutput(
            run_date=datetime.now().strftime("%B %d, %Y"),
            is_test_data=is_test_data,
            total_ingested=total_ingested,
            sources_monitored_count=sources_monitored_count,
            daily_stories=curated_daily,
            skip_today_list=skip_list,
            feed_summary=feed_summary
        )
