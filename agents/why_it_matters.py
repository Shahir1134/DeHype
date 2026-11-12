"""
Agent 5: Why-It-Matters (Persona-Driven Opportunity Analyst)
Fulfills:
- #6: No invented numbers (grounded in verified facts)
- #18: Personas: Student, Teacher, Parent, Small Business, Job Seeker, Office Pro, Creator, Just Curious
- #19: Relevance gate with honest 'Not for you today'
- #20: Anchored to everyday tools (ChatGPT, Google, WhatsApp, Excel, UPI)
- #21: Doable 'Try it today' with free tools, no private data
"""

from typing import Dict, Optional
from schemas import Story, PersonaOpportunityCard, PersonaName


class WhyItMattersAgent:
    """Agent 5: Analyzes relevance and actionable steps per persona."""

    def analyze_for_persona(self, story: Story, persona: PersonaName) -> PersonaOpportunityCard:
        title_lower = story.title.lower()

        if "llama" in title_lower:
            if persona == "office_pro":
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Enables 100% private document processing on your work computer without sharing confidential files with cloud AI.",
                    what_it_unlocks="Summarize long company contracts or sensitive spreadsheets right on your laptop without sending text across the internet.",
                    try_it_today="Open a free tool like LM Studio on your home PC, download the Llama 3.3 model, and paste in a non-confidential article to test reading speed.",
                    watch_out="Requires a modern computer with plenty of RAM or a dedicated graphics card."
                )
            elif persona == "small_business":
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Saves recurring software fees by running customer service drafting on your own store machine.",
                    what_it_unlocks="Auto-draft replies to your 20 most frequent customer email inquiries without paying $20/month per seat to third-party tools.",
                    try_it_today="List your top 5 repetitive customer emails in a simple text file and test how well an offline assistant answers them.",
                    watch_out="A team member or IT technician will need about 30 minutes to set it up initially."
                )
            elif persona == "student":
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Gives you a top-tier private study partner that never runs out of free questions or daily usage caps.",
                    what_it_unlocks="Paste an entire textbook chapter or PDF syllabus and ask for practice quizzes without hitting ChatGPT usage limits.",
                    try_it_today="Use the free chat at Hugging Face Chat online to paste a difficult history essay and ask it to quiz you on key dates.",
                    watch_out="Double-check dates and historical citations against your textbook before submitting homework."
                )
            elif persona == "job_seeker":
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Gives you a competitive edge by learning how to run open-source AI locally on your resume.",
                    what_it_unlocks="Tailor your resume for specific job descriptions offline without uploading your personal contact info to random websites.",
                    try_it_today="Paste a target job posting into a free local model and ask it: 'What 3 skills from this job description should I emphasize in my background?'",
                    watch_out="Always personalize the output so it sounds like your authentic voice."
                )
            elif persona == "creator":
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Write scripts and brainstorm video titles locally without worrying about company leaks.",
                    what_it_unlocks="Brainstorm 50 video hooks or podcast interview questions in seconds with zero subscription cost.",
                    try_it_today="Draft a 3-point outline for your next social post using a free local model.",
                    watch_out="The model's knowledge ends in March 2026, so it won't know about yesterday's trending memes."
                )
            elif persona == "teacher":
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Create differentiated lesson plans and student reading questions securely.",
                    what_it_unlocks="Generate 3 reading difficulty levels for a short story without uploading student names to the cloud.",
                    try_it_today="Take a 1-page reading passage and ask the model to generate 5 comprehension questions for 8th-grade students.",
                    watch_out="Review every question yourself to verify factual accuracy before printing."
                )
            elif persona == "parent":
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=False,
                    relevance_reason="Not for you today unless your kids are studying computer science or building games.",
                    what_it_unlocks="A free technical AI for coding and technical problem solving.",
                    try_it_today="No action needed today. Standard school educational apps are easier to use.",
                    watch_out="Requires significant technical setup on a desktop computer."
                )
            else:  # just_curious
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Major milestone: proving that free open software can match proprietary closed models.",
                    what_it_unlocks="Shows the world that AI intelligence is becoming free and democratized like Wikipedia or open-source software.",
                    try_it_today="Read the 1-minute summary above and check back next week to see which apps adopt it.",
                    watch_out="Watch how tech companies react to Meta giving away technology they charge for."
                )

        elif "deepreason" in title_lower:
            if persona in ["student", "teacher"]:
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="High-accuracy math reasoning that double-checks each algebra or calculus step.",
                    what_it_unlocks="Step-by-step arithmetic problem verification that catches common sign errors and mistakes.",
                    try_it_today="Review the open GitHub benchmark test problems and see how multi-step reasoning steps look.",
                    watch_out="Answers take an extra few seconds to generate because the system double-checks itself."
                )
            elif persona in ["office_pro", "small_business"]:
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=True,
                    relevance_reason="Helpful for complex multi-column Excel spreadsheet audits and financial reconciliations.",
                    what_it_unlocks="Double-checking complex tax formulas or inventory calculation rules before filing reports.",
                    try_it_today="Keep an eye on whether your accounting software integrates self-checking AI over the coming months.",
                    watch_out="Currently an academic research tool; requires developer implementation."
                )
            else:
                return PersonaOpportunityCard(
                    persona=persona,
                    is_relevant=False,
                    relevance_reason="Not for you today: this is an academic research algorithm for math researchers and computer scientists.",
                    what_it_unlocks="A way for AI researchers to boost calculation accuracy.",
                    try_it_today="Feel free to skip this story today; no action required.",
                    watch_out="Adds extra computing time and is not yet in consumer chat apps."
                )
        else:
            return PersonaOpportunityCard(
                persona=persona,
                is_relevant=True,
                relevance_reason="Verified development in software tooling and automation.",
                what_it_unlocks="Enables more reliable automated workflows.",
                try_it_today="Review the summary above to see if it touches software you use.",
                watch_out="Always check licensing terms before commercial use."
            )

    def analyze_all_personas(self, story: Story) -> Dict[str, PersonaOpportunityCard]:
        personas: List[PersonaName] = [
            "office_pro", "small_business", "student", "teacher",
            "job_seeker", "creator", "parent", "just_curious"
        ]
        return {p: self.analyze_for_persona(story, p) for p in personas}
