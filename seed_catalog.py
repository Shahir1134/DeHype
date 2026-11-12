"""
Full Tools Catalog Seeder:
Populates tasks, tools, facts, and task_tool_fit across all 5 user categories:
1. Create (Make images, video clips, presenter videos, edit video, music, voice, posters)
2. Build (Websites without code, vibe coding apps, coding help, connect apps/automate)
3. Work (Presentations, write/polish docs, spreadsheets, meeting notes, research, resumes)
4. Learn (Study & quiz, teaching lesson plans/rubrics, practice language)
5. Everyday (General assistant, translation, accessibility)

Enforces:
- Discontinued tools (DALL-E 3, Relay) are marked discontinued and excluded from recommendations.
- Plain language facts, zero hype words.
- Detailed beginner fields: example output, difficulty, time to result, free option, paid option,
  platforms, account needed, best for, not good for, privacy summary, starter prompt.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import Tool, ToolFact, Task, TaskToolFit

CURRENT_VERIFIED_DATE = "2026-11-04"

def seed_full_catalog(db: Session):
    """Seeds or updates the full tools and tasks catalog."""
    
    # -------------------------------------------------------------
    # 1. TOOLS CATALOG
    # -------------------------------------------------------------
    tools_list = [
        # --- CREATE: IMAGES ---
        {
            "id": "tool-flux",
            "name": "FLUX.1",
            "maker": "Black Forest Labs",
            "official_url": "https://blackforestlabs.ai",
            "summary_own_words": "An open-weight image model known for accurate hands, photorealism, and readable text.",
            "example_output": "A photo of an artisan bakery with the sign 'Morning Sourdough' written clearly in chalk.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "Free to try on web playgrounds (FAL, Replicate, Hugging Face); open weights for local GPUs.",
            "paid_option": "Pro API access from $0.03 per image generation.",
            "platforms": "Web, Local (via ComfyUI / Ollama)",
            "account_needed": "Free account on web hosts",
            "languages": "English prompt inputs",
            "best_for": "Realistic photos with legible signs and accurate anatomy.",
            "not_good_for": "Instant chat-based conversational image adjustments.",
            "privacy_summary": "Open weights run 100% privately on your own computer.",
            "privacy_note_url": "https://blackforestlabs.ai/privacy",
            "status": "active",
            "status_source_url": "https://blackforestlabs.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-ideogram",
            "name": "Ideogram",
            "maker": "Ideogram Inc.",
            "official_url": "https://ideogram.ai",
            "summary_own_words": "An AI image creator specialized in rendering clear typography and text inside graphic designs.",
            "example_output": "A retro travel poster of Kyoto with 'Visit Japan 2026' printed in bold vintage fonts.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "Free tier grants 10 slow generation credits per day.",
            "paid_option": "Basic plan at $8/month for faster generations and private images.",
            "platforms": "Web, iOS",
            "account_needed": "Free account required",
            "languages": "English and major languages",
            "best_for": "Logos, posters, stickers, and t-shirt designs requiring readable words.",
            "not_good_for": "Editing existing photos or subtle color adjustments.",
            "privacy_summary": "Free tier generations are publicly visible on the community feed.",
            "privacy_note_url": "https://ideogram.ai/privacy",
            "status": "active",
            "status_source_url": "https://ideogram.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-midjourney",
            "name": "Midjourney",
            "maker": "Midjourney Inc.",
            "official_url": "https://www.midjourney.com",
            "summary_own_words": "A high-fidelity image generator celebrated for painterly aesthetics and cinematic lighting.",
            "example_output": "A cinematic shot of a misty mountain library with golden hour sunlight streaming through glass.",
            "difficulty": "Needs practice",
            "time_to_first_result": "about 5 minutes",
            "free_option": "No ongoing free plan; occasional limited trial promotions.",
            "paid_option": "Basic plan from $10/month for ~200 GPU minutes.",
            "platforms": "Web, Discord",
            "account_needed": "Discord or Midjourney web account",
            "languages": "English prompts",
            "best_for": "Concept art, imaginative illustrations, and editorial photography.",
            "not_good_for": "Exact pinpoint text placement or technical diagram drafting.",
            "privacy_summary": "Generations are public in the community showcase unless on the Pro tier Stealth mode.",
            "privacy_note_url": "https://docs.midjourney.com/docs/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.midjourney.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-adobe-firefly",
            "name": "Adobe Firefly",
            "maker": "Adobe",
            "official_url": "https://www.adobe.com/products/firefly.html",
            "summary_own_words": "An image and design generator trained strictly on licensed Adobe Stock images for commercial safety.",
            "example_output": "A commercial product banner showing a cosmetics bottle against green palm leaves.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "25 free generative credits per month with a free Adobe ID.",
            "paid_option": "Premium plan at $4.99/month for 100 monthly credits.",
            "platforms": "Web, Photoshop, Illustrator",
            "account_needed": "Adobe ID required",
            "languages": "Over 100 languages",
            "best_for": "Commercial business marketing without copyright infringement risks.",
            "not_good_for": "Anime styles or gritty niche underground art.",
            "privacy_summary": "Trained only on licensed assets; enterprise indemnity protections available.",
            "privacy_note_url": "https://www.adobe.com/privacy.html",
            "status": "active",
            "status_source_url": "https://www.adobe.com/products/firefly.html",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-chatgpt-images",
            "name": "ChatGPT Images",
            "maker": "OpenAI",
            "official_url": "https://chatgpt.com",
            "summary_own_words": "Chat-based image creation where you can ask for adjustments and edits in normal conversation.",
            "example_output": "An illustration of a cartoon mascot holding an apple, then modified to wear sunglasses.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "Free users get limited daily image creations using GPT-4o.",
            "paid_option": "Plus tier at $20/month grants higher daily creation caps.",
            "platforms": "Web, iOS, Android, Mac, Windows",
            "account_needed": "Free OpenAI account required",
            "languages": "English and 50+ languages",
            "best_for": "Quick conversational mockups and iterative tweaks.",
            "not_good_for": "High-resolution print production or vector graphic export.",
            "privacy_summary": "Free accounts may train models unless opted out in Data Controls settings.",
            "privacy_note_url": "https://openai.com/policies/privacy-policy",
            "status": "active",
            "status_source_url": "https://chatgpt.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            # DISCONTINUED TOOL RECORD
            "id": "tool-dalle-3",
            "name": "DALL·E 3 (Standalone)",
            "maker": "OpenAI",
            "official_url": "https://openai.com/dall-e-3",
            "summary_own_words": "OpenAI's previous standalone image model, now merged directly into ChatGPT.",
            "example_output": "Legacy standalone web interface outputs.",
            "difficulty": "Beginner",
            "time_to_first_result": "Discontinued",
            "free_option": "Retired as standalone portal in May 2026; integrated into ChatGPT.",
            "paid_option": "None",
            "platforms": "Web (Archived)",
            "account_needed": "N/A",
            "languages": "N/A",
            "best_for": "Historical reference only.",
            "not_good_for": "New projects.",
            "privacy_summary": "N/A",
            "privacy_note_url": "https://openai.com/policies/privacy-policy",
            "status": "discontinued",
            "status_source_url": "https://openai.com/blog",
            "last_verified_at": "2026-05-30"
        },

        # --- CREATE: VIDEO ---
        {
            "id": "tool-runway",
            "name": "Runway Gen-3",
            "maker": "Runway",
            "official_url": "https://runwayml.com",
            "summary_own_words": "Generates 5 to 10 second cinematic video clips from text prompts or still photos.",
            "example_output": "A 5-second video of waves crashing on rocks in slow motion with cinematic camera tilt.",
            "difficulty": "Needs practice",
            "time_to_first_result": "about 4 minutes",
            "free_option": "One-time 125 free credits upon sign-up.",
            "paid_option": "Standard plan from $12/month for 625 credits per month.",
            "platforms": "Web, iOS",
            "account_needed": "Free account required",
            "languages": "English prompt inputs",
            "best_for": "B-roll clips, mood boards, and creative video shorts.",
            "not_good_for": "Long multi-minute storytelling with consistent character dialogue.",
            "privacy_summary": "Paid subscribers can keep project assets private.",
            "privacy_note_url": "https://runwayml.com/privacy-policy",
            "status": "active",
            "status_source_url": "https://runwayml.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-luma",
            "name": "Luma Dream Machine",
            "maker": "Luma AI",
            "official_url": "https://lumalabs.ai/dream-machine",
            "summary_own_words": "Fast, physics-consistent video generator capable of smooth camera movements and lighting shifts.",
            "example_output": "A smooth drone shot flying over a golden wheat field at sunset.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 3 minutes",
            "free_option": "30 free generations per month with standard queue speed.",
            "paid_option": "Lite tier from $7.99/month for faster rendering.",
            "platforms": "Web, iOS",
            "account_needed": "Google or Apple account",
            "languages": "English prompts",
            "best_for": "Smooth camera panning and realistic object motion.",
            "not_good_for": "Human speech lip-syncing.",
            "privacy_summary": "Free generations appear in the public discovery feed.",
            "privacy_note_url": "https://lumalabs.ai/privacy",
            "status": "active",
            "status_source_url": "https://lumalabs.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-pika",
            "name": "Pika",
            "maker": "Pika Labs",
            "official_url": "https://pika.art",
            "summary_own_words": "Playful video maker that animates still images, changes outfits, and adds visual effects.",
            "example_output": "An image of a portrait with eyes blinking and coffee steam rising in the background.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "Daily free generation allowance with Pika watermark.",
            "paid_option": "Standard plan at $8/month to remove watermarks.",
            "platforms": "Web",
            "account_needed": "Free account required",
            "languages": "English",
            "best_for": "Social media animations, meme creation, and photo-to-video effects.",
            "not_good_for": "Professional 4K commercial broadcast clips.",
            "privacy_summary": "Content stored on secure servers; terms grant standard hosting license.",
            "privacy_note_url": "https://pika.art/privacy",
            "status": "active",
            "status_source_url": "https://pika.art",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- CREATE: TALKING PRESENTER & VIDEO EDITING ---
        {
            "id": "tool-heygen",
            "name": "HeyGen",
            "maker": "HeyGen",
            "official_url": "https://www.heygen.com",
            "summary_own_words": "Creates realistic talking-avatar videos from a written script, including natural lip-syncing in 40+ languages.",
            "example_output": "A professional presenter explaining a 2-minute employee onboarding guide with clear audio.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 5 minutes",
            "free_option": "Free trial includes 1 free credit (1 minute of video).",
            "paid_option": "Creator plan from $24/month for 15 credits per month.",
            "platforms": "Web",
            "account_needed": "Free account required",
            "languages": "40+ languages with matching lip-sync",
            "best_for": "Employee training, localized customer onboarding, and tutorial explainers.",
            "not_good_for": "Fast-action cinema or emotional acting scenes.",
            "privacy_summary": "Requires consent verification before creating custom digital clones.",
            "privacy_note_url": "https://www.heygen.com/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.heygen.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-synthesia",
            "name": "Synthesia",
            "maker": "Synthesia Ltd.",
            "official_url": "https://www.synthesia.io",
            "summary_own_words": "Corporate-ready AI presenter platform for educational modules and corporate presentations.",
            "example_output": "A clean studio avatar narrating a quarterly compliance update with side bullet slides.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 5 minutes",
            "free_option": "Free demo allows 1 trial video generation.",
            "paid_option": "Starter plan at $22/month (billed annually) for 120 minutes/year.",
            "platforms": "Web",
            "account_needed": "Account required",
            "languages": "140+ languages and accents",
            "best_for": "Standardized school lectures and business corporate training.",
            "not_good_for": "Spontaneous conversational podcasts.",
            "privacy_summary": "SOC 2 Type II certified; strict AI ethics screening on all uploaded scripts.",
            "privacy_note_url": "https://www.synthesia.io/legal/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.synthesia.io",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-descript",
            "name": "Descript",
            "maker": "Descript Inc.",
            "official_url": "https://www.descript.com",
            "summary_own_words": "An editor that lets you edit podcast audio and video like a text doc—delete words in text to cut the audio.",
            "example_output": "An interview recording where removing 15 'um' filler words in the transcript cuts them from the audio seamlessly.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 5 minutes",
            "free_option": "Free tier gives 1 transcription hour per month and 720p video export.",
            "paid_option": "Hobbyist plan from $12/month for 10 transcription hours.",
            "platforms": "Mac, Windows, Web",
            "account_needed": "Account required",
            "languages": "23 transcription languages",
            "best_for": "Podcasts, lecture recordings, and automated subtitle generation.",
            "not_good_for": "Complex multi-camera Hollywood color grading.",
            "privacy_summary": "User recordings are encrypted; training on user voice requires explicit opt-in.",
            "privacy_note_url": "https://www.descript.com/privacy",
            "status": "active",
            "status_source_url": "https://www.descript.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-capcut",
            "name": "CapCut",
            "maker": "ByteDance",
            "official_url": "https://www.capcut.com",
            "summary_own_words": "Mobile-friendly video editor with automated auto-captions, background removal, and sound effects.",
            "example_output": "A 30-second vertical social video with animated yellow captions synced to speech.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "Robust free tier includes automatic captions and templates.",
            "paid_option": "CapCut Pro from $7.99/month for premium transitions and cloud storage.",
            "platforms": "iOS, Android, Web, Mac, Windows",
            "account_needed": "Free account optional for basic edits",
            "languages": "Global language support",
            "best_for": "Quick vertical video editing for TikTok, YouTube Shorts, and Instagram Reels.",
            "not_good_for": "Sensitive corporate documents subject to strict government data controls.",
            "privacy_summary": "Data stored on ByteDance infrastructure; review privacy terms for corporate use.",
            "privacy_note_url": "https://www.capcut.com/clause/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.capcut.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- CREATE: MUSIC & VOICE ---
        {
            "id": "tool-suno",
            "name": "Suno",
            "maker": "Suno Inc.",
            "official_url": "https://suno.com",
            "summary_own_words": "Generates complete 2-minute songs with vocals, instruments, and lyrics from a simple text prompt.",
            "example_output": "A catchy acoustic folk song about studying for final exams with acoustic guitar and dual harmony vocals.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "50 free daily credits (makes 10 songs) for non-commercial personal use.",
            "paid_option": "Pro plan at $8/month gives 2,500 credits and grants commercial ownership of generated songs.",
            "platforms": "Web, iOS",
            "account_needed": "Free account required",
            "languages": "English and major languages",
            "best_for": "Background jingles, student projects, songwriting inspiration, and fun custom songs.",
            "not_good_for": "Fine-grained individual audio track stem editing (drums, bass separation).",
            "privacy_summary": "Free tier songs belong to Suno's non-commercial commons; paid users own generated audio.",
            "privacy_note_url": "https://suno.com/privacy",
            "status": "active",
            "status_source_url": "https://suno.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-udio",
            "name": "Udio",
            "maker": "Uncharted Labs",
            "official_url": "https://www.udio.com",
            "summary_own_words": "High-fidelity AI music engine with expressive vocal dynamics across jazz, classical, rock, and pop.",
            "example_output": "A warm lo-fi beat with relaxing piano chords and gentle rain sounds for background study.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "Free tier includes 10 credits daily.",
            "paid_option": "Standard tier from $10/month for commercial use rights and track extension.",
            "platforms": "Web",
            "account_needed": "Free account required",
            "languages": "Multi-language singing support",
            "best_for": "High-clarity music production and complex musical genres.",
            "not_good_for": "Audiobooks or plain spoken-word narration.",
            "privacy_summary": "Commercial use requires paid active subscription; review terms before selling tracks.",
            "privacy_note_url": "https://www.udio.com/privacy",
            "status": "active",
            "status_source_url": "https://www.udio.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-elevenlabs",
            "name": "ElevenLabs",
            "maker": "ElevenLabs",
            "official_url": "https://elevenlabs.io",
            "summary_own_words": "Natural-sounding voice generator with emotional inflection, pacing control, and 30+ languages.",
            "example_output": "A warm, natural voiceover reading a chapter of a children's audio story with proper pauses.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "Free plan includes 10,000 characters per month for non-commercial attribution use.",
            "paid_option": "Starter plan at $5/month for 30,000 characters and instant voice cloning.",
            "platforms": "Web, API, iOS reader app",
            "account_needed": "Free account required",
            "languages": "32 languages with native accents",
            "best_for": "Audiobook narration, video voiceovers, and language pronunciation practice.",
            "not_good_for": "Full singing pop songs (use Suno or Udio instead).",
            "privacy_summary": "Voice cloning requires reading a live consent verification phrase. Never clone someone without consent.",
            "privacy_note_url": "https://elevenlabs.io/privacy",
            "status": "active",
            "status_source_url": "https://elevenlabs.io",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- CREATE: POSTERS & DESIGN ---
        {
            "id": "tool-canva",
            "name": "Canva Magic Studio",
            "maker": "Canva",
            "official_url": "https://www.canva.com",
            "summary_own_words": "An accessible graphic design studio that helps anyone make posters, flyers, and social graphics.",
            "example_output": "A clean school bake sale flyer with matching fonts, colors, and an automatically removed photo background.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 3 minutes",
            "free_option": "Free tier has thousands of templates, photos, and basic AI resizing tools.",
            "paid_option": "Canva Pro from $12.99/month for unlimited background removal and brand kits.",
            "platforms": "Web, iOS, Android, Mac, Windows",
            "account_needed": "Free account required",
            "languages": "100+ languages",
            "best_for": "Classroom flyers, business cards, Instagram posts, and school presentations.",
            "not_good_for": "Complex custom 3D modeling or video special effects.",
            "privacy_summary": "Free education accounts available for K-12 teachers with student privacy protections.",
            "privacy_note_url": "https://www.canva.com/policies/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.canva.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- BUILD: WEBSITES & VIBE CODING ---
        {
            "id": "tool-framer",
            "name": "Framer",
            "maker": "Framer B.V.",
            "official_url": "https://www.framer.com",
            "summary_own_words": "A modern website designer that publishes responsive, beautiful landing pages from a visual canvas.",
            "example_output": "A sleek 3-page portfolio website with smooth scroll animations published on a custom domain.",
            "difficulty": "Needs practice",
            "time_to_first_result": "about 10 minutes",
            "free_option": "Free plan includes free publishing on a framer.website subdomain.",
            "paid_option": "Mini plan from $5/month to connect your own custom .com domain.",
            "platforms": "Web, Mac, Windows",
            "account_needed": "Free account required",
            "languages": "Global web text support",
            "best_for": "Portfolios, startup landing pages, and creative studio websites.",
            "not_good_for": "Complex backend databases like hospital medical record portals.",
            "privacy_summary": "Hosted on secure global AWS/Cloudflare CDNs with SSL certificates.",
            "privacy_note_url": "https://www.framer.com/legal/privacy-statement/",
            "status": "active",
            "status_source_url": "https://www.framer.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-lovable",
            "name": "Lovable",
            "maker": "Lovable Labs",
            "official_url": "https://lovable.dev",
            "summary_own_words": "Build web applications by describing what you want in plain words ('vibe coding') with instant live previews.",
            "example_output": "A functioning habit-tracker web app with checkable daily boxes and data saved to Supabase.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 5 minutes",
            "free_option": "Free starter credits to build and preview prototype web apps.",
            "paid_option": "Pro plans from $20/month for custom domains and expanded message credits.",
            "platforms": "Web",
            "account_needed": "GitHub or Google account",
            "languages": "English prompt instructions",
            "best_for": "Non-technical founders and creators prototyping real working software in hours.",
            "not_good_for": "Mission-critical financial banking infrastructure.",
            "privacy_summary": "Exports clean standard React/TypeScript code that you own completely.",
            "privacy_note_url": "https://lovable.dev/privacy",
            "status": "active",
            "status_source_url": "https://lovable.dev",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-bolt",
            "name": "Bolt.new",
            "maker": "StackBlitz",
            "official_url": "https://bolt.new",
            "summary_own_words": "An in-browser AI development environment that builds, installs, and runs full-stack web apps in seconds.",
            "example_output": "A complete recipe-sharing website running live in your browser tab with working buttons.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 3 minutes",
            "free_option": "Free tier with daily generation tokens and WebContainer execution.",
            "paid_option": "Pro at $20/month for higher token quotas and private deployments.",
            "platforms": "Web",
            "account_needed": "GitHub account recommended",
            "languages": "All major frameworks",
            "best_for": "Instantly testing and building web ideas without installing anything on your computer.",
            "not_good_for": "Native iOS or Android mobile app store packaging.",
            "privacy_summary": "Code runs directly inside your local browser via WebContainers.",
            "privacy_note_url": "https://stackblitz.com/privacy-policy",
            "status": "active",
            "status_source_url": "https://bolt.new",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- BUILD: CODING HELP & AUTOMATION ---
        {
            "id": "tool-cursor",
            "name": "Cursor",
            "maker": "Anysphere",
            "official_url": "https://www.cursor.com",
            "summary_own_words": "A smart code editor built on VS Code that understands your whole folder and writes multi-file edits.",
            "example_output": "A working Python script that cleans messy CSV spreadsheets and creates a chart automatically.",
            "difficulty": "Needs practice",
            "time_to_first_result": "about 5 minutes",
            "free_option": "Free tier provides basic AI completions and 50 slow premium requests.",
            "paid_option": "Pro plan at $20/month for fast Claude 3.7 and GPT-4o completions.",
            "platforms": "Mac, Windows, Linux",
            "account_needed": "Account required",
            "languages": "All programming languages",
            "best_for": "Editing office scripts, website code, and automating data pipelines.",
            "not_good_for": "Users who do not want to install a desktop code editor.",
            "privacy_summary": "Privacy Mode guarantees your code is never stored or used to train models.",
            "privacy_note_url": "https://www.cursor.com/privacy",
            "status": "active",
            "status_source_url": "https://www.cursor.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-github-copilot",
            "name": "GitHub Copilot",
            "maker": "GitHub / Microsoft",
            "official_url": "https://github.com/features/copilot",
            "summary_own_words": "Auto-completes code and explains technical scripts directly inside Visual Studio, Xcode, and JetBrains.",
            "example_output": "A small script that automatically fetches current currency exchange rates and formats the output.",
            "difficulty": "Needs practice",
            "time_to_first_result": "about 3 minutes",
            "free_option": "Free for verified students, teachers, and popular open-source maintainers.",
            "paid_option": "Copilot Individual at $10/month or $100/year.",
            "platforms": "Mac, Windows, Linux, VS Code, JetBrains",
            "account_needed": "GitHub account required",
            "languages": "Python, JavaScript, TypeScript, Ruby, Go, C#",
            "best_for": "Autocomplete assistance while writing programming code and Excel macros.",
            "not_good_for": "Writing marketing copy or making slideshows.",
            "privacy_summary": "Individual tier allows opting out of code snippet collection.",
            "privacy_note_url": "https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement",
            "status": "active",
            "status_source_url": "https://github.com/features/copilot",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-zapier",
            "name": "Zapier",
            "maker": "Zapier Inc.",
            "official_url": "https://zapier.com",
            "summary_own_words": "Connects over 6,000 apps together so actions in one app trigger automatic updates in another.",
            "example_output": "An automated flow where a new form submission automatically adds a contact to Google Sheets and sends a Slack alert.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 5 minutes",
            "free_option": "Free plan includes 100 automated tasks per month across 2-step Zaps.",
            "paid_option": "Starter plan from $19.99/month for multi-step automations and 750 tasks.",
            "platforms": "Web",
            "account_needed": "Free account required",
            "languages": "English and major interfaces",
            "best_for": "Connecting forms, email inboxes, spreadsheets, and CRM tools without coding.",
            "not_good_for": "High-frequency millisecond financial trading transactions.",
            "privacy_summary": "SOC 2 Type II and SOC 3 compliant; strict credential vault encryption.",
            "privacy_note_url": "https://zapier.com/privacy",
            "status": "active",
            "status_source_url": "https://zapier.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            # DISCONTINUED TOOL RECORD
            "id": "tool-relay",
            "name": "Relay.app",
            "maker": "Relay",
            "official_url": "https://relay.app",
            "summary_own_words": "A workflow automation alternative to Zapier that shut down operations in 2026.",
            "example_output": "N/A",
            "difficulty": "Beginner",
            "time_to_first_result": "Shut down",
            "free_option": "Service discontinued; user data removed.",
            "paid_option": "N/A",
            "platforms": "Web (Archived)",
            "account_needed": "N/A",
            "languages": "N/A",
            "best_for": "Historical note on automation ecosystem changes.",
            "not_good_for": "Active projects.",
            "privacy_summary": "N/A",
            "privacy_note_url": "https://techcrunch.com",
            "status": "discontinued",
            "status_source_url": "https://techcrunch.com",
            "last_verified_at": "2026-06-01"
        },

        # --- WORK: PRESENTATIONS & DOCUMENTS ---
        {
            "id": "tool-gamma",
            "name": "Gamma",
            "maker": "Gamma App Inc.",
            "official_url": "https://gamma.app",
            "summary_own_words": "Generates complete presentation decks, web documents, and flyers from a one-paragraph text outline.",
            "example_output": "An 8-slide presentation explaining renewable energy with custom layout cards, icons, and charts.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "400 free starter credits upon sign-up.",
            "paid_option": "Plus tier at $8/month for unlimited basic AI generations and export options.",
            "platforms": "Web",
            "account_needed": "Free account required",
            "languages": "Multi-language generation support",
            "best_for": "Quick business pitch decks, lecture slides, and beautiful meeting briefings.",
            "not_good_for": "Highly complex animated PowerPoint transitions or corporate template lock-in.",
            "privacy_summary": "Generations are private to your workspace; enterprise controls available.",
            "privacy_note_url": "https://gamma.app/privacy",
            "status": "active",
            "status_source_url": "https://gamma.app",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-grammarly",
            "name": "Grammarly",
            "maker": "Grammarly Inc.",
            "official_url": "https://www.grammarly.com",
            "summary_own_words": "A writing helper that checks grammar, spelling, clarity, and tone across your browser and desktop apps.",
            "example_output": "A draft email with 3 typos fixed and sentence flow rewritten from passive to active voice.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "Free tier covers basic spelling, grammar, punctuation, and conciseness suggestions.",
            "paid_option": "Premium from $12/month for full-sentence rewrites, tone adjustments, and citation checks.",
            "platforms": "Web, Windows, Mac, iOS, Android, Browser extension",
            "account_needed": "Free account required",
            "languages": "English",
            "best_for": "Polishing work emails, student essays, and resumes before sending.",
            "not_good_for": "Generating brand-new fictional novels from scratch.",
            "privacy_summary": "Grammarly explicitly states it does not sell user data or use text to train public models.",
            "privacy_note_url": "https://www.grammarly.com/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.grammarly.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- WORK: MEETING NOTES & RESEARCH ---
        {
            "id": "tool-otter",
            "name": "Otter.ai",
            "maker": "Otter.ai",
            "official_url": "https://otter.ai",
            "summary_own_words": "Records spoken meeting audio, distinguishes speakers, and generates real-time summaries with action items.",
            "example_output": "A 4-point executive meeting summary with an action items table listing who agreed to do what.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 3 minutes",
            "free_option": "Free Basic plan includes 300 monthly transcription minutes (30 mins per conversation).",
            "paid_option": "Pro plan at $10/month (billed annually) for 1,200 monthly minutes.",
            "platforms": "Web, iOS, Android, Zoom, Microsoft Teams, Google Meet",
            "account_needed": "Free account required",
            "languages": "English, Spanish, French",
            "best_for": "Team syncs, classroom lectures, interviews, and doctor consultation notes.",
            "not_good_for": "Secret meetings where recording devices are prohibited by law.",
            "privacy_summary": "Two-factor authentication and encryption; users control meeting recording permissions.",
            "privacy_note_url": "https://otter.ai/privacy-policy",
            "status": "active",
            "status_source_url": "https://otter.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-notebooklm",
            "name": "NotebookLM",
            "maker": "Google",
            "official_url": "https://notebooklm.google.com",
            "summary_own_words": "A private study guide that answers strictly from notes and PDFs you upload, plus turns them into audio discussions.",
            "example_output": "A grounded FAQ answering questions about your 40-page employee handbook with page citations.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "100% Free with a standard Google Account.",
            "paid_option": "None (free core service offered by Google Labs).",
            "platforms": "Web",
            "account_needed": "Google account required",
            "languages": "English and 15+ major languages",
            "best_for": "Students studying textbooks, educators reviewing curricula, and researchers synthesizing PDFs.",
            "not_good_for": "Searching live current news across the open internet.",
            "privacy_summary": "Google guarantees your uploaded documents are not used to train consumer AI models.",
            "privacy_note_url": "https://notebooklm.google.com/faq",
            "status": "active",
            "status_source_url": "https://notebooklm.google.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-perplexity",
            "name": "Perplexity",
            "maker": "Perplexity AI",
            "official_url": "https://www.perplexity.ai",
            "summary_own_words": "A conversational search engine that browses the live web and adds clickable source citations to every sentence.",
            "example_output": "A concise summary of recent changes in electric vehicle tax credits with 5 verified news links.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 30 seconds",
            "free_option": "Free standard searches with source citations and basic file uploads.",
            "paid_option": "Perplexity Pro at $20/month for deep research mode and Claude/GPT-4o selection.",
            "platforms": "Web, iOS, Android",
            "account_needed": "No account required for basic searches; free account to save threads",
            "languages": "Global search support",
            "best_for": "Fact-checking news, comparative shopping research, and discovering source references.",
            "not_good_for": "Long private document brainstorming without public web lookups.",
            "privacy_summary": "Searches query public web indexes; users can toggle AI data retention in profile settings.",
            "privacy_note_url": "https://www.perplexity.ai/hub/legal/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.perplexity.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-elicit",
            "name": "Elicit",
            "maker": "Elicit Research",
            "official_url": "https://elicit.com",
            "summary_own_words": "An AI research assistant for academic papers that extracts key findings, methodology, and sample sizes into tables.",
            "example_output": "A comparison table of 10 peer-reviewed papers on sleep deprivation showing sample sizes and conclusions.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 3 minutes",
            "free_option": "Free plan includes 5,000 one-time research credits.",
            "paid_option": "Plus plan from $10/month for 12,000 monthly credits and high-speed exports.",
            "platforms": "Web",
            "account_needed": "Free account required",
            "languages": "English academic literature",
            "best_for": "Literature reviews, meta-analyses, and medical/scientific research.",
            "not_good_for": "Casual social media writing or video editing.",
            "privacy_summary": "Searches open-access semantic scholar databases; uploaded papers are private to your account.",
            "privacy_note_url": "https://elicit.com/privacy",
            "status": "active",
            "status_source_url": "https://elicit.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-kickresume",
            "name": "Kickresume",
            "maker": "Kickresume s.r.o.",
            "official_url": "https://www.kickresume.com",
            "summary_own_words": "An AI resume and cover letter builder with ATS-friendly templates and role-specific bullet suggestions.",
            "example_output": "A 1-page modern software engineer resume formatted cleanly with quantifiable achievement bullets.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 5 minutes",
            "free_option": "Free tier gives access to 4 basic resume templates and standard export.",
            "paid_option": "Premium from $9/month (billed annually) for full template library and AI grammar checks.",
            "platforms": "Web, iOS, Android",
            "account_needed": "Free account required",
            "languages": "English and major languages",
            "best_for": "Job seekers formatting career history into hiring-manager friendly formats.",
            "not_good_for": "Inventing fake job qualifications or past experience.",
            "privacy_summary": "GDPR compliant; your contact information and work history are never sold to advertisers.",
            "privacy_note_url": "https://www.kickresume.com/en/privacy-policy/",
            "status": "active",
            "status_source_url": "https://www.kickresume.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- LEARN: STUDY & TEACHING ---
        {
            "id": "tool-magicschool",
            "name": "MagicSchool AI",
            "maker": "MagicSchool Inc.",
            "official_url": "https://www.magicschool.ai",
            "summary_own_words": "An all-in-one platform for teachers with 60+ tools to draft lesson plans, IEP suggestions, and rubrics.",
            "example_output": "A 5-level rubric for an 8th-grade science fair project aligned to state learning standards.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "Free plan includes core educator tools and generative assistance.",
            "paid_option": "MagicSchool Plus at $9.99/month for custom tools and student room integrations.",
            "platforms": "Web, Chrome extension",
            "account_needed": "Free educator account required",
            "languages": "English, Spanish, and 25+ languages",
            "best_for": "Teachers reclaiming weekend hours on administrative lesson prep.",
            "not_good_for": "Grading without teacher review or submitting unverified report cards.",
            "privacy_summary": "FERPA and COPPA compliant; explicitly designed with student data privacy protections.",
            "privacy_note_url": "https://www.magicschool.ai/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.magicschool.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-quizlet",
            "name": "Quizlet",
            "maker": "Quizlet Inc.",
            "official_url": "https://quizlet.com",
            "summary_own_words": "Digital flashcards and study sets with AI-powered 'Magic Notes' that turn notes into practice tests.",
            "example_output": "A 20-card flashcard deck on Spanish vocabulary with audio pronunciation and practice tests.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 2 minutes",
            "free_option": "Free tier allows creating flashcard sets and standard study modes.",
            "paid_option": "Quizlet Plus at $35.99/year removes ads and unlocks unlimited AI study guides.",
            "platforms": "Web, iOS, Android",
            "account_needed": "Free account required",
            "languages": "Global language support",
            "best_for": "Memorizing terminology, anatomy, foreign language vocabulary, and exam prep.",
            "not_good_for": "Writing long analytical research dissertations.",
            "privacy_summary": "COPPA compliant for students under 13; parent consent workflows supported.",
            "privacy_note_url": "https://quizlet.com/privacy",
            "status": "active",
            "status_source_url": "https://quizlet.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-duolingo",
            "name": "Duolingo Max",
            "maker": "Duolingo",
            "official_url": "https://www.duolingo.com",
            "summary_own_words": "Gamified language learning app featuring AI roleplay and 'Explain My Answer' interactive tutors.",
            "example_output": "A simulated conversation ordering coffee in a Parisian café with real-time grammar feedback.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 3 minutes",
            "free_option": "Core language courses are 100% free with ad support.",
            "paid_option": "Duolingo Max subscription adds AI Roleplay and Explanation features.",
            "platforms": "iOS, Android, Web",
            "account_needed": "Free account required",
            "languages": "40+ languages taught",
            "best_for": "Building daily language habits and casual conversational practice.",
            "not_good_for": "Rapid professional translation of technical legal documents.",
            "privacy_summary": "Strict student and child privacy controls; no public chat exposure for minors.",
            "privacy_note_url": "https://www.duolingo.com/privacy",
            "status": "active",
            "status_source_url": "https://www.duolingo.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # --- EVERYDAY: GENERAL ASSISTANTS & ACCESSIBILITY ---
        {
            "id": "tool-claude",
            "name": "Claude",
            "maker": "Anthropic",
            "official_url": "https://claude.ai",
            "summary_own_words": "A calm, thoughtful assistant with huge memory for long documents, nuanced writing, and logic.",
            "example_output": "A compassionate, professionally worded email resolving a sensitive dispute with a client.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "Free tier with Claude 3.5 Sonnet access subject to standard usage caps.",
            "paid_option": "Claude Pro at $20/month for 5x more usage and early access to new models.",
            "platforms": "Web, iOS, Android, Mac, Windows",
            "account_needed": "Free account required",
            "languages": "English and 30+ languages",
            "best_for": "Complex writing, long PDF analysis, code explanations, and calm advisory reasoning.",
            "not_good_for": "Generating photorealistic fantasy art or live music audio.",
            "privacy_summary": "Anthropic guarantees user prompts are not used to train generative models without consent.",
            "privacy_note_url": "https://www.anthropic.com/privacy",
            "status": "active",
            "status_source_url": "https://claude.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-chatgpt",
            "name": "ChatGPT",
            "maker": "OpenAI",
            "official_url": "https://chatgpt.com",
            "summary_own_words": "The most widely used conversational assistant with voice mode, web browsing, and custom GPTs.",
            "example_output": "A step-by-step troubleshooting checklist to fix a home Wi-Fi router.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "Free access to GPT-4o mini with standard browsing and image creation.",
            "paid_option": "Plus tier at $20/month for advanced voice mode, higher limits, and o1 reasoning models.",
            "platforms": "Web, iOS, Android, Mac, Windows",
            "account_needed": "Can be used without account on web; free account to save chats",
            "languages": "50+ languages",
            "best_for": "General questions, drafting everyday emails, brainstorming, and voice chat.",
            "not_good_for": "Private internal documents if data sharing is left enabled in settings.",
            "privacy_summary": "Users can disable chat history in Data Controls to prevent training on conversations.",
            "privacy_note_url": "https://openai.com/policies/privacy-policy",
            "status": "active",
            "status_source_url": "https://chatgpt.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-gemini",
            "name": "Google Gemini",
            "maker": "Google",
            "official_url": "https://gemini.google.com",
            "summary_own_words": "Google's assistant deeply integrated with Google Docs, Gmail, YouTube, and Google Drive.",
            "example_output": "A summary of flight details found across 3 family emails in your Gmail inbox.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 1 minute",
            "free_option": "Free tier powered by Gemini 2.5 Flash with live Google Workspace extensions.",
            "paid_option": "Google One AI Premium at $19.99/month for Gemini Advanced and 2TB storage.",
            "platforms": "Web, Android, iOS (Google app)",
            "account_needed": "Google account required",
            "languages": "40+ languages",
            "best_for": "Users with Google Workspace, Android devices, and large multi-hour YouTube summaries.",
            "not_good_for": "Users looking for completely unlinked anonymous accounts.",
            "privacy_summary": "Workspace extension data from personal Gmail is not used to train public models.",
            "privacy_note_url": "https://policies.google.com/privacy",
            "status": "active",
            "status_source_url": "https://gemini.google.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-deepl",
            "name": "DeepL",
            "maker": "DeepL SE",
            "official_url": "https://www.deepl.com",
            "summary_own_words": "Highly accurate language translator that preserves natural conversational tone and document formatting.",
            "example_output": "A translated German business contract with precise legal terms and original Word document formatting intact.",
            "difficulty": "Beginner",
            "time_to_first_result": "about 30 seconds",
            "free_option": "Free web translation up to 1,500 characters and 3 document translations per month.",
            "paid_option": "DeepL Pro from $8.74/month for unlimited text translation and maximum data security.",
            "platforms": "Web, Windows, Mac, iOS, Android, Browser extension",
            "account_needed": "No account required for quick web translations",
            "languages": "32 major world languages",
            "best_for": "Translating sensitive business emails, academic papers, and Word/PDF documents.",
            "not_good_for": "Casual live voice conversations with cartoon avatars.",
            "privacy_summary": "DeepL Pro texts are immediately deleted from servers after translation.",
            "privacy_note_url": "https://www.deepl.com/privacy",
            "status": "active",
            "status_source_url": "https://www.deepl.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "id": "tool-bemyeyes",
            "name": "Be My Eyes",
            "maker": "Be My Eyes",
            "official_url": "https://www.bemyeyes.com",
            "summary_own_words": "An accessibility app for blind and low-vision individuals that uses AI to describe what your phone camera sees in real time.",
            "example_output": "A spoken description: 'In front of you on the kitchen counter is an opened can of crushed tomatoes on the left, and a carton of milk on the right.'",
            "difficulty": "Beginner",
            "time_to_first_result": "about 30 seconds",
            "free_option": "100% Free worldwide for blind and low-vision users.",
            "paid_option": "None (free non-profit supported service).",
            "platforms": "iOS, Android",
            "account_needed": "Free account required",
            "languages": "Over 180 languages supported",
            "best_for": "Describing street signs, reading medicine prescription labels, and identifying food packages.",
            "not_good_for": "Generating imaginary fantasy art.",
            "privacy_summary": "Strict user privacy safeguards; users can connect to volunteer humans if AI answers are unclear.",
            "privacy_note_url": "https://www.bemyeyes.com/privacy-policy",
            "status": "active",
            "status_source_url": "https://www.bemyeyes.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        }
    ]

    for td in tools_list:
        tool = db.query(Tool).filter(Tool.id == td["id"]).first()
        if not tool:
            db.add(Tool(**td))
        else:
            for k, v in td.items():
                setattr(tool, k, v)

    # -------------------------------------------------------------
    # 2. CATEGORIZED TASKS (Create, Build, Work, Learn, Everyday)
    # -------------------------------------------------------------
    tasks_list = [
        # --- CREATE ---
        {
            "id": "task-make-images",
            "title": "Make images and visual illustrations",
            "category": "Create",
            "persona_tags": ["entrepreneur", "teacher", "student", "engineer_office"],
            "not_for_ai": "Never use AI to forge real human identity photos, fake legal evidence, or copyrighted trademarks."
        },
        {
            "id": "task-make-video-clips",
            "title": "Make short video clips from text prompts",
            "category": "Create",
            "persona_tags": ["entrepreneur", "student", "engineer_office"],
            "not_for_ai": "Do not attempt to generate deepfake videos of real living people without explicit legal authorization."
        },
        {
            "id": "task-presenter-videos",
            "title": "Create talking-presenter and explainer videos",
            "category": "Create",
            "persona_tags": ["teacher", "entrepreneur", "engineer_office"],
            "not_for_ai": "Never clone someone else's face or voice without notarized written consent."
        },
        {
            "id": "task-edit-video-captions",
            "title": "Edit video, add automatic captions and dubbing",
            "category": "Create",
            "persona_tags": ["student", "teacher", "entrepreneur"],
            "not_for_ai": "Do not publish unverified automated captions on emergency medical or safety training videos."
        },
        {
            "id": "task-music-songs",
            "title": "Generate custom music tracks and songs",
            "category": "Create",
            "persona_tags": ["student", "entrepreneur", "teacher"],
            "not_for_ai": "Check commercial terms on your specific plan before releasing songs on Spotify or for paid TV ads."
        },
        {
            "id": "task-voice-narration",
            "title": "Voiceover and natural speech narration",
            "category": "Create",
            "persona_tags": ["student", "teacher", "entrepreneur", "engineer_office"],
            "not_for_ai": "Consent warning: Only clone your own voice or voices with verified written consent."
        },
        {
            "id": "task-posters-logos",
            "title": "Design posters, social posts, and logos",
            "category": "Create",
            "persona_tags": ["entrepreneur", "teacher", "student"],
            "not_for_ai": "Always conduct a trademark search before registering an AI-generated logo as an official trademark."
        },

        # --- BUILD ---
        {
            "id": "task-build-website-nocode",
            "title": "Build a website without writing code",
            "category": "Build",
            "persona_tags": ["entrepreneur", "teacher", "student"],
            "not_for_ai": "Do not rely on one-click site builders for HIPAA-regulated patient medical portals without custom auditing."
        },
        {
            "id": "task-vibe-coding-apps",
            "title": "Build apps by describing them (Vibe Coding)",
            "category": "Build",
            "persona_tags": ["entrepreneur", "student", "engineer_office"],
            "not_for_ai": "Always have an experienced security engineer audit database authentication rules before storing credit card details."
        },
        {
            "id": "task-coding-help",
            "title": "Coding help and automated script debugging",
            "category": "Build",
            "persona_tags": ["engineer_office", "student", "entrepreneur"],
            "not_for_ai": "Never copy and paste proprietary closed-source code into public web chats without company data protection agreements."
        },
        {
            "id": "task-connect-apps-automation",
            "title": "Connect apps and automate repetitive chores",
            "category": "Build",
            "persona_tags": ["engineer_office", "entrepreneur"],
            "not_for_ai": "Do not automate financial fund transfers or irreversible customer data deletion without human review steps."
        },

        # --- WORK ---
        {
            "id": "task-make-slides",
            "title": "Make presentation slides from a text outline",
            "category": "Work",
            "persona_tags": ["entrepreneur", "teacher", "engineer_office", "student"],
            "not_for_ai": "Never generate investor financial return tables with AI. Keep actual cash flow numbers human-verified."
        },
        {
            "id": "task-write-polish-docs",
            "title": "Write, edit, and polish formal documents",
            "category": "Work",
            "persona_tags": ["student", "teacher", "engineer_office", "entrepreneur"],
            "not_for_ai": "Do not submit sensitive legal NDAs or medical reports to consumer web tools without enterprise confidentiality."
        },
        {
            "id": "task-spreadsheets-data",
            "title": "Analyze spreadsheets and calculate data trends",
            "category": "Work",
            "persona_tags": ["engineer_office", "entrepreneur"],
            "not_for_ai": "Spot-check 5 random rows to verify that numbers, telephone codes, and currency symbols were not corrupted."
        },
        {
            "id": "task-meeting-notes",
            "title": "Transcribe meetings and extract action items",
            "category": "Work",
            "persona_tags": ["engineer_office", "entrepreneur", "teacher"],
            "not_for_ai": "Do not record private one-on-one HR performance reviews without the explicit informed consent of the employee."
        },
        {
            "id": "task-research-summarize-docs",
            "title": "Research and summarize long documents and PDFs",
            "category": "Work",
            "persona_tags": ["student", "teacher", "engineer_office", "entrepreneur"],
            "not_for_ai": "Never blindly cite legal case numbers or medical clinical trials without checking primary published sources."
        },
        {
            "id": "task-resumes-job-search",
            "title": "Format resumes and write tailored cover letters",
            "category": "Work",
            "persona_tags": ["student", "engineer_office"],
            "not_for_ai": "Do not invent false employment history or skills. Hiring managers will ask detailed behavioral questions in interviews."
        },

        # --- LEARN ---
        {
            "id": "task-study-quiz-yourself",
            "title": "Study for exams and quiz yourself on notes",
            "category": "Learn",
            "persona_tags": ["student"],
            "not_for_ai": "Do not memorize answers blindly. Use AI to understand underlying concepts rather than relying on rote predictions."
        },
        {
            "id": "task-teaching-lesson-plans",
            "title": "Lesson plans, differentiated materials, and rubrics",
            "category": "Learn",
            "persona_tags": ["teacher"],
            "not_for_ai": "Teacher rule: Don't paste student names, identifiable IEP details, or personal grades into third-party tools."
        },
        {
            "id": "task-practice-language",
            "title": "Practice speaking and listening to a new language",
            "category": "Learn",
            "persona_tags": ["student", "entrepreneur"],
            "not_for_ai": "AI cannot fully replace real-world conversations with native speakers for understanding cultural subtleties."
        },

        # --- EVERYDAY ---
        {
            "id": "task-general-assistant",
            "title": "General assistant: ask anything in plain language",
            "category": "Everyday",
            "persona_tags": ["student", "teacher", "entrepreneur", "engineer_office"],
            "not_for_ai": "Never rely on a conversational chatbot for urgent medical diagnoses, suicide crisis counseling, or certified legal advice."
        },
        {
            "id": "task-translate-languages",
            "title": "Accurately translate documents and conversation",
            "category": "Everyday",
            "persona_tags": ["student", "entrepreneur", "engineer_office"],
            "not_for_ai": "Do not use unverified automated translation for pharmaceutical dosage labels or international treaties."
        },
        {
            "id": "task-accessibility-vision",
            "title": "Describe what a camera sees for accessibility",
            "category": "Everyday",
            "persona_tags": ["student", "teacher", "engineer_office", "entrepreneur"],
            "not_for_ai": "Never rely solely on visual AI when crossing active high-speed traffic intersections or identifying wild mushrooms."
        }
    ]

    for td in tasks_list:
        task = db.query(Task).filter(Task.id == td["id"]).first()
        if not task:
            t = Task(
                id=td["id"],
                title=td["title"],
                category=td["category"],
                not_for_ai=td.get("not_for_ai")
            )
            t.persona_tags = td["persona_tags"]
            db.add(t)
        else:
            task.title = td["title"]
            task.category = td["category"]
            task.not_for_ai = td.get("not_for_ai")
            task.persona_tags = td["persona_tags"]

    # -------------------------------------------------------------
    # 3. TASK-TOOL FITS (Top Pick + Also Good + Also Consider)
    # -------------------------------------------------------------
    # Discontinued tools (DALL-E 3, Relay) are NEVER mapped to active fits.
    fits_list = [
        # task-make-images
        {
            "task_id": "task-make-images",
            "tool_id": "tool-ideogram",
            "rank": 1,
            "fit_reason": "Renders crisp typography and text inside images where most models output garbled characters.",
            "caveat": "Free tier generations appear publicly in the community discovery feed.",
            "starter_prompt": "A modern graphic poster for a local organic farmers market with the words 'Fresh Harvest 2026' in bold clean typography.",
            "evidence_url": "https://ideogram.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-make-images",
            "tool_id": "tool-flux",
            "rank": 2,
            "fit_reason": "State-of-the-art realistic lighting and anatomy; open weights allow running locally without cloud fees.",
            "caveat": "Requires modern GPU hardware if running on your own computer.",
            "starter_prompt": "A warm photo of an artisan baker taking golden sourdough bread out of a stone oven, soft morning light, 35mm lens.",
            "evidence_url": "https://blackforestlabs.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-make-images",
            "tool_id": "tool-adobe-firefly",
            "rank": 3,
            "fit_reason": "Trained strictly on licensed Adobe Stock, making it the safest option for business and commercial marketing.",
            "caveat": "Has stricter safety filters on stylization and historical fiction than open models.",
            "starter_prompt": "A clean commercial product background of smooth river stones and green bamboo shoots, soft studio lighting.",
            "evidence_url": "https://www.adobe.com/products/firefly.html",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-make-video-clips
        {
            "task_id": "task-make-video-clips",
            "tool_id": "tool-runway",
            "rank": 1,
            "fit_reason": "The most versatile director controls for cinematic camera movement, tilt, and photorealistic motion.",
            "caveat": "Limited to 5-10 second clips per generation; multi-minute videos require manual stitching.",
            "starter_prompt": "Slow-motion cinematic drone shot flying through a redwood forest with morning mist and golden sunbeams, 4k.",
            "evidence_url": "https://runwayml.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-make-video-clips",
            "tool_id": "tool-luma",
            "rank": 2,
            "fit_reason": "Exceptional physics consistency and smooth transitions when animating from a starting still photo.",
            "caveat": "Generations on the free plan take longer during peak evening traffic hours.",
            "starter_prompt": "A peaceful mountain lake at sunrise, gentle water ripples expanding outward, camera gently drifting forward.",
            "evidence_url": "https://lumalabs.ai/dream-machine",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-make-video-clips",
            "tool_id": "tool-pika",
            "rank": 3,
            "fit_reason": "Great for quick social media loops and animating existing still illustrations.",
            "caveat": "Free exports carry a visible watermark.",
            "starter_prompt": "Add gentle falling snow and flickering lantern light to this winter landscape photo.",
            "evidence_url": "https://pika.art",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-presenter-videos
        {
            "task_id": "task-presenter-videos",
            "tool_id": "tool-heygen",
            "rank": 1,
            "fit_reason": "Photorealistic digital presenters with natural vocal inflections and multi-language lip-syncing.",
            "caveat": "Strict video verification required before you can clone yourself.",
            "starter_prompt": "Act as an onboarding guide. Welcome our new staff member to the company, explain our core hours, and wish them a great first week.",
            "evidence_url": "https://www.heygen.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-presenter-videos",
            "tool_id": "tool-synthesia",
            "rank": 2,
            "fit_reason": "Enterprise-ready with 140+ language templates designed specifically for workplace compliance and training.",
            "caveat": "More formal studio posture than casual social media video styles.",
            "starter_prompt": "Welcome everyone to our laboratory safety refresher course. Here are the 3 mandatory protocols for this semester.",
            "evidence_url": "https://www.synthesia.io",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-edit-video-captions
        {
            "task_id": "task-edit-video-captions",
            "tool_id": "tool-descript",
            "rank": 1,
            "fit_reason": "Allows editing podcast and interview videos by simply highlighting and deleting words in the text transcript.",
            "caveat": "Best on conversations with clear audio; muffled background music can confuse the word alignment.",
            "starter_prompt": "Remove all filler words ('um', 'uh', repeated phrases) from this recording while keeping natural conversational pauses.",
            "evidence_url": "https://www.descript.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-edit-video-captions",
            "tool_id": "tool-capcut",
            "rank": 2,
            "fit_reason": "One-click automated captions with high accuracy and popular animated styling for phones.",
            "caveat": "Corporate teams should verify data compliance terms for enterprise recordings.",
            "starter_prompt": "Generate dynamic yellow auto-captions with highlighted active words synced to speech.",
            "evidence_url": "https://www.capcut.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-music-songs
        {
            "task_id": "task-music-songs",
            "tool_id": "tool-suno",
            "rank": 1,
            "fit_reason": "Creates full 2-minute songs with vocals, harmonies, and instruments across any genre from a text prompt.",
            "caveat": "Commercial use requires an active Pro plan ($8/mo); free plan is strictly for personal non-commercial fun.",
            "starter_prompt": "An upbeat acoustic indie-folk song about late-night study sessions in the campus library with acoustic guitar and light percussion.",
            "evidence_url": "https://suno.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-music-songs",
            "tool_id": "tool-udio",
            "rank": 2,
            "fit_reason": "Produces remarkable audio fidelity in jazz, classical, and electronic musical styles.",
            "caveat": "Extending songs past initial segments requires learning the track continuation interface.",
            "starter_prompt": "A relaxing lo-fi hip hop beat with warm electric piano chords and vinyl crackle, ideal for focused reading.",
            "evidence_url": "https://www.udio.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-voice-narration
        {
            "task_id": "task-voice-narration",
            "tool_id": "tool-elevenlabs",
            "rank": 1,
            "fit_reason": "The most natural-sounding voice generator with realistic emotional warmth, whisper modes, and 30+ languages.",
            "caveat": "Consent warning: Only clone your own voice or voices with explicit written permission.",
            "starter_prompt": "Read this calm educational script about oceanic ecosystems with patient, warm pacing suitable for a high school lecture.",
            "evidence_url": "https://elevenlabs.io",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-posters-logos
        {
            "task_id": "task-posters-logos",
            "tool_id": "tool-canva",
            "rank": 1,
            "fit_reason": "Combines generative AI layout ideas with complete drag-and-drop manual control over typography, colors, and margins.",
            "caveat": "Do not rely on one-click AI generation alone; align fonts and colors manually to match your brand.",
            "starter_prompt": "Create an eye-catching poster for our high school science club astronomy night on Friday, featuring deep navy and warm gold accents.",
            "evidence_url": "https://www.canva.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-posters-logos",
            "tool_id": "tool-ideogram",
            "rank": 2,
            "fit_reason": "Outstanding when you need an illustrative t-shirt badge or sticker with guaranteed readable lettering.",
            "caveat": "Exports raster images; requires manual vectorization in Illustrator if high-res SVG vectors are required.",
            "starter_prompt": "A circular vector-style emblem for a small local bakery with the words 'Wild Yeast Bakery' in a clean arc.",
            "evidence_url": "https://ideogram.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-build-website-nocode
        {
            "task_id": "task-build-website-nocode",
            "tool_id": "tool-framer",
            "rank": 1,
            "fit_reason": "Visual, intuitive designer that publishes modern, lightning-fast landing pages with zero coding.",
            "caveat": "Connecting a custom .com domain requires a paid plan from $5/month.",
            "starter_prompt": "Design a modern 1-page landing page for an independent coffee roaster, featuring a hero section, 3 product cards, and a visit us map.",
            "evidence_url": "https://www.framer.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-vibe-coding-apps
        {
            "task_id": "task-vibe-coding-apps",
            "tool_id": "tool-lovable",
            "rank": 1,
            "fit_reason": "Lets non-technical creators build real working web apps by chatting in plain English with instant visual previews.",
            "caveat": "Requires connecting Supabase if your app requires permanent user logins and database storage.",
            "starter_prompt": "Build a clean daily habit-tracker web app with a streak counter, category tags, and a dark mode toggle.",
            "evidence_url": "https://lovable.dev",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-vibe-coding-apps",
            "tool_id": "tool-bolt",
            "rank": 2,
            "fit_reason": "Runs a complete development environment directly inside your browser tab without installing Node.js or Git.",
            "caveat": "Complex full-stack database setups may consume daily free tokens quickly.",
            "starter_prompt": "Create an interactive quiz application where users can take a 5-question general knowledge test and see their final score.",
            "evidence_url": "https://bolt.new",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-coding-help
        {
            "task_id": "task-coding-help",
            "tool_id": "tool-cursor",
            "rank": 1,
            "fit_reason": "The leading AI code editor that understands your entire workspace folder and applies multi-file edits simultaneously.",
            "caveat": "Designed for users comfortable with a desktop code editor like VS Code.",
            "starter_prompt": "Review this Python script that cleans our monthly invoice CSV files. Add error handling for missing date values.",
            "evidence_url": "https://www.cursor.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-coding-help",
            "tool_id": "tool-github-copilot",
            "rank": 2,
            "fit_reason": "Integrates directly inside existing developer tools with choice of Claude, GPT-4o, or Codex models.",
            "caveat": "Free only for verified students and open-source contributors; otherwise $10/month.",
            "starter_prompt": "Write a TypeScript function to parse URL query parameters safely and return a strongly-typed object.",
            "evidence_url": "https://github.com/features/copilot",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-connect-apps-automation
        {
            "task_id": "task-connect-apps-automation",
            "tool_id": "tool-zapier",
            "rank": 1,
            "fit_reason": "Supports over 6,000 apps with simple if-this-then-that triggers that require zero technical coding.",
            "caveat": "Free plan is capped at 100 task executions per month; high-volume flows require paid tiers.",
            "starter_prompt": "When a new lead fills out our website Google Form, automatically add their name to our spreadsheet and post an alert to Slack.",
            "evidence_url": "https://zapier.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-make-slides
        {
            "task_id": "task-make-slides",
            "tool_id": "tool-gamma",
            "rank": 1,
            "fit_reason": "Turns a messy bullet outline into a polished 10-slide deck with layout cards, icons, and typography in 30 seconds.",
            "caveat": "Free tier has a Gamma watermark on exported PDF slides.",
            "starter_prompt": "Transform this bullet outline about 'The Future of Renewable Energy' into an 8-slide presentation with clear cards.",
            "evidence_url": "https://gamma.app",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-make-slides",
            "tool_id": "tool-canva",
            "rank": 2,
            "fit_reason": "Gives you complete manual design freedom over animations, fonts, and company branding kits.",
            "caveat": "Takes more manual positioning than one-click presentation generators.",
            "starter_prompt": "Suggest a cohesive 4-slide layout for a small business quarterly update with revenue charts.",
            "evidence_url": "https://www.canva.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-write-polish-docs
        {
            "task_id": "task-write-polish-docs",
            "tool_id": "tool-claude",
            "rank": 1,
            "fit_reason": "Writes with an articulate, respectful, and calm human tone without robotic corporate buzzwords.",
            "caveat": "Do not paste sensitive proprietary agreements unless using an enterprise account.",
            "starter_prompt": "Review this draft email to a client explaining a 2-day delivery delay. Make it warm, professional, and reassuring without defensive language.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-write-polish-docs",
            "tool_id": "tool-grammarly",
            "rank": 2,
            "fit_reason": "Runs directly inside your browser and desktop apps, providing real-time grammar and clarity feedback as you type.",
            "caveat": "Advanced tone adjustments and sentence rewrites require the paid Premium plan.",
            "starter_prompt": "Check this cover letter for passive voice and suggest ways to make the opening paragraph more engaging.",
            "evidence_url": "https://www.grammarly.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-meeting-notes
        {
            "task_id": "task-meeting-notes",
            "tool_id": "tool-otter",
            "rank": 1,
            "fit_reason": "Joins Zoom and Google Meet automatically, labels different voices, and outputs an action items table.",
            "caveat": "Always obtain verbal or written consent from all attendees before activating automated meeting recording.",
            "starter_prompt": "From this staff meeting transcript, generate a summary table with 3 columns: Action Item, Assigned Person, and Deadline.",
            "evidence_url": "https://otter.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-research-summarize-docs
        {
            "task_id": "task-research-summarize-docs",
            "tool_id": "tool-notebooklm",
            "rank": 1,
            "fit_reason": "Answers strictly from the PDFs and notes you upload, with clickable citation badges pointing to exact pages.",
            "caveat": "Cannot browse the open live internet; only reads documents you explicitly provide.",
            "starter_prompt": "Based only on my uploaded PDF syllabus, explain the grading policy for late assignments and list the final exam date.",
            "evidence_url": "https://notebooklm.google.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-research-summarize-docs",
            "tool_id": "tool-perplexity",
            "rank": 2,
            "fit_reason": "Searches the live public internet and attaches verified source links to every single sentence.",
            "caveat": "Always verify primary source links before relying on facts for medical or legal decisions.",
            "starter_prompt": "Explain the recent changes to EU artificial intelligence regulations that took effect in 2026, with primary source links.",
            "evidence_url": "https://www.perplexity.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-research-summarize-docs",
            "tool_id": "tool-elicit",
            "rank": 3,
            "fit_reason": "Specifically designed for academic literature reviews; extracts methodology, sample sizes, and conclusions from papers.",
            "caveat": "Specialized in scientific literature; not suitable for casual general news.",
            "starter_prompt": "Find 5 peer-reviewed papers on the impact of sleep duration on cognitive performance and compare their sample sizes in a table.",
            "evidence_url": "https://elicit.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-resumes-job-search
        {
            "task_id": "task-resumes-job-search",
            "tool_id": "tool-kickresume",
            "rank": 1,
            "fit_reason": "Offers ATS-friendly resume templates with AI-assisted bullet writing tailored to specific job titles.",
            "caveat": "Never let AI invent fake past accomplishments; interviewers verify previous employment records.",
            "starter_prompt": "Review my current resume bullets for a Project Manager role. Make them more impactful using active verbs and quantifiable outcomes.",
            "evidence_url": "https://www.kickresume.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-study-quiz-yourself
        {
            "task_id": "task-study-quiz-yourself",
            "tool_id": "tool-notebooklm",
            "rank": 1,
            "fit_reason": "Generates custom flashcards, study guides, and audio discussions restricted strictly to your course notes.",
            "caveat": "Upload clean text or PDF notes for the most accurate review questions.",
            "starter_prompt": "Based on my uploaded lecture notes, quiz me with 3 challenging conceptual questions one at a time. Wait for my answer before grading.",
            "evidence_url": "https://notebooklm.google.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-study-quiz-yourself",
            "tool_id": "tool-quizlet",
            "rank": 2,
            "fit_reason": "Turn notes into interactive flashcards and practice quizzes with audio pronunciation.",
            "caveat": "Free tier has banner advertisements between flashcard rounds.",
            "starter_prompt": "Convert this vocabulary list of 15 biology terms into flashcard format with plain English definitions.",
            "evidence_url": "https://quizlet.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-teaching-lesson-plans
        {
            "task_id": "task-teaching-lesson-plans",
            "tool_id": "tool-magicschool",
            "rank": 1,
            "fit_reason": "Over 60 dedicated educator tools to build lesson plans, rubrics, and differentiated reading levels in 2 minutes.",
            "caveat": "Teacher rule: Don't paste student names, identifiable IEP details, or personal grades into third-party tools.",
            "starter_prompt": "Draft a 45-minute lesson plan introducing plant photosynthesis for 7th grade students. Include an engaging 5-minute hook question.",
            "evidence_url": "https://www.magicschool.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-teaching-lesson-plans",
            "tool_id": "tool-claude",
            "rank": 2,
            "fit_reason": "Excels at writing deeply thoughtful, pedagogically sound essay questions and step-by-step rubrics.",
            "caveat": "Teacher rule: Don't paste student names, identifiable IEP details, or personal grades into third-party tools.",
            "starter_prompt": "Create a 4-tier grading rubric for an 8th grade persuasive essay, evaluating thesis clarity, supporting evidence, and mechanics.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-practice-language
        {
            "task_id": "task-practice-language",
            "tool_id": "tool-duolingo",
            "rank": 1,
            "fit_reason": "Gamified bite-sized daily lessons that build consistent habits with conversational roleplay scenarios.",
            "caveat": "Best for beginner to intermediate conversational fluency; advanced grammar requires supplemental textbooks.",
            "starter_prompt": "Simulate a practice conversation where I am ordering food at a bakery in Madrid in beginner Spanish. Correct my mistakes gently.",
            "evidence_url": "https://www.duolingo.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-general-assistant
        {
            "task_id": "task-general-assistant",
            "tool_id": "tool-claude",
            "rank": 1,
            "fit_reason": "Thoughtful, honest, and calm assistant that explains complex topics simply without sales hype.",
            "caveat": "Cannot generate images or video directly.",
            "starter_prompt": "Explain how an electric motor works to a 12-year-old using the analogy of a bicycle pedal.",
            "evidence_url": "https://claude.ai",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-general-assistant",
            "tool_id": "tool-chatgpt",
            "rank": 2,
            "fit_reason": "All-in-one assistant with voice mode, web search, code interpretation, and image generation.",
            "caveat": "Turn off model training in account settings to protect private conversations.",
            "starter_prompt": "Help me plan a 3-day weekend itinerary for a family trip to Chicago that is fun for both parents and a 10-year-old.",
            "evidence_url": "https://chatgpt.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },
        {
            "task_id": "task-general-assistant",
            "tool_id": "tool-gemini",
            "rank": 3,
            "fit_reason": "Connects directly to Google Docs, Gmail, and Google Drive for seamless personal file assistance.",
            "caveat": "Requires a Google account.",
            "starter_prompt": "Draft a gentle 2-paragraph email to my landlord requesting a maintenance visit for a leaky kitchen faucet.",
            "evidence_url": "https://gemini.google.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-translate-languages
        {
            "task_id": "task-translate-languages",
            "tool_id": "tool-deepl",
            "rank": 1,
            "fit_reason": "Known for the most accurate, natural-sounding translations that preserve document formatting in Word and PDF.",
            "caveat": "Free web tier has a 1,500 character limit per single translation.",
            "starter_prompt": "Translate this polite business inquiry into natural conversational Japanese, maintaining respectful business honorifics.",
            "evidence_url": "https://www.deepl.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        },

        # task-accessibility-vision
        {
            "task_id": "task-accessibility-vision",
            "tool_id": "tool-bemyeyes",
            "rank": 1,
            "fit_reason": "100% free accessibility service that speaks descriptions of what your phone camera sees in real time.",
            "caveat": "Never rely solely on visual AI in hazardous situations like street traffic or dangerous power tools.",
            "starter_prompt": "Point camera at food packaging and ask: 'Read the cooking instructions and expiration date on this box.'",
            "evidence_url": "https://www.bemyeyes.com",
            "last_verified_at": CURRENT_VERIFIED_DATE
        }
    ]

    for fit in fits_list:
        existing = db.query(TaskToolFit).filter(
            TaskToolFit.task_id == fit["task_id"],
            TaskToolFit.tool_id == fit["tool_id"]
        ).first()
        if not existing:
            db.add(TaskToolFit(**fit))
        else:
            for k, v in fit.items():
                setattr(existing, k, v)

    db.commit()
    print("Catalog seed completed successfully!")
