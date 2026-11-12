
import logging
import requests
import trafilatura
from typing import Optional

logger = logging.getLogger(__name__)

MIN_CONTENT_LENGTH = 300
MAX_CONTENT_LENGTH = 15000

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}


def extract_article_content(url: str) -> Optional[str]:
    try:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=15
        )

        logger.info(
            "[ContentExtractor] HTTP %s for %s",
            response.status_code, url
        )

        response.raise_for_status()

        text = trafilatura.extract(
            response.text,
            include_comments=False,
            include_tables=True,
            favor_precision=True
        )

        if not text:
            logger.warning("No readable content: %s", url)
            return None

        text = " ".join(text.split())

        if len(text) < MIN_CONTENT_LENGTH:
            logger.warning(
                "Insufficient content (%s chars): %s",
                len(text), url
            )
            return None

        return text[:MAX_CONTENT_LENGTH]

    except requests.RequestException as e:
        logger.warning("HTTP extraction failed for %s: %s", url, e)
        return None

    except Exception:
        logger.exception("Extraction failed: %s", url)
        return None
