"""
5-hour newsroom scheduler using APScheduler.
Run: python scheduler.py
Keeps running in background; logs to logs/scheduler.log
"""
import logging
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/scheduler.log", encoding="utf-8")
    ]
)
logger = logging.getLogger(__name__)


def run_cycle():
    """Called by APScheduler every 5 hours."""
    logger.info(f"[Scheduler] Cycle triggered at {datetime.now(timezone.utc).isoformat()}")
    try:
        from newsroom.pipeline import run_pipeline
        stats = run_pipeline(live=True)
        logger.info(f"[Scheduler] Cycle done: {stats}")
    except Exception as e:
        logger.error(f"[Scheduler] Cycle error: {e}", exc_info=True)


def main():
    try:
        from apscheduler.schedulers.blocking import BlockingScheduler
        from apscheduler.triggers.interval import IntervalTrigger
    except ImportError:
        logger.error("APScheduler not installed. Run: pip install apscheduler")
        sys.exit(1)

    os.makedirs("logs", exist_ok=True)

    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(
        run_cycle,
        trigger=IntervalTrigger(hours=5),
        id="newsroom_cycle",
        name="Newsroom 5h ingest cycle",
        replace_existing=True,
        max_instances=1,          # never overlap
        misfire_grace_time=300,   # 5 min grace on missed fires
    )

    # Also run immediately on start
    logger.info("[Scheduler] Starting — running initial cycle now...")
    run_cycle()

    logger.info("[Scheduler] Scheduler started. Next run in 5 hours.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("[Scheduler] Stopped.")


if __name__ == "__main__":
    main()
