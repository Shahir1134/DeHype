#!/usr/bin/env python3
"""
'AI for Everyone' v2 — Master Runner & Server.
Boots the FastAPI backend + frontend server, seeds 2026 data if needed,
and provides evaluation and link checker CLI options.
"""

import argparse
import sys
import uvicorn
from pathlib import Path

# Add current workspace to python path
sys.path.insert(0, str(Path(__file__).parent))

from models import init_db, SessionLocal, Story
from backfill_2026 import seed_database
from api import app, run_link_checker
from eval_harness import run_eval


def ensure_seeded():
    init_db()
    db = SessionLocal()
    try:
        count = db.query(Story).count()
        if count == 0:
            print("[Bootstrap] Seeding 2026 AI milestones...")
            seed_database(db)
        else:
            print(f"[Bootstrap] Database ready with {count} verified stories.")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="AI for Everyone v2 Server & Runner")
    parser.add_argument("--port", type=int, default=8000, help="Port to run web server on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host interface")
    parser.add_argument("--eval", action="store_true", help="Run full evaluation harness and exit")
    parser.add_argument("--link-check", action="store_true", help="Run link checker and exit")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")

    args = parser.parse_args()

    ensure_seeded()

    if args.eval:
        success = run_eval()
        sys.exit(0 if success else 1)

    if args.link_check:
        db = SessionLocal()
        res = run_link_checker(db=db)
        print("Link check results:", res)
        db.close()
        sys.exit(0)

    print(f"\n=======================================================")
    print(f"  AI for Everyone v2 — Starting Server")
    print(f"  Open in your browser: http://{args.host}:{args.port}")
    print(f"  API Documentation:    http://{args.host}:{args.port}/docs")
    print(f"=======================================================\n")

    uvicorn.run("api:app", host=args.host, port=args.port, reload=not args.no_reload)


if __name__ == "__main__":
    main()
