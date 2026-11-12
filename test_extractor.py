
from newsroom.content_extractor import extract_article_content

urls = [
    "https://ai.meta.com/blog/llama-4-general-availability/",
    "https://www.nist.gov/aisi/announcements/frontier-agent-evaluations-2026",
    "https://www.dhawalshah.net/article/ai-agent-governance/"
]

for url in urls:
    print("\n" + "=" * 80)
    print("URL:", url)

    content = extract_article_content(url)

    if content:
        print("STATUS: SUCCESS")
        print("LENGTH:", len(content))
        print("CONTENT:", content[:800])
    else:
        print("STATUS: UNAVAILABLE")
