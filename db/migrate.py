#!/usr/bin/env python3
"""Apply db/migrations/*.sql to DATABASE_URL in filename order, each exactly once.

    python3 db/migrate.py                    # the real schema (public)
    python3 db/migrate.py --schema test_x    # a throwaway schema, created if missing (used by tests)
"""

import argparse
import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "backend"))
from db_schema import check_schema, use_schema  # noqa: E402,F401  (use_schema re-exported for tests)


def migrate(schema: str = "public") -> list[str]:
    """Runs in one transaction (psycopg commits when the `with` block exits), so SET LOCAL holds throughout."""
    applied_now = []
    with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=15) as conn:
        conn.execute(f"CREATE SCHEMA IF NOT EXISTS {check_schema(schema)}")
        use_schema(conn, schema)
        conn.execute("""CREATE TABLE IF NOT EXISTS schema_migrations (
                            filename   TEXT PRIMARY KEY,
                            applied_at TIMESTAMPTZ NOT NULL DEFAULT now())""")
        applied = {r[0] for r in conn.execute("SELECT filename FROM schema_migrations")}
        for path in sorted((ROOT / "db" / "migrations").glob("*.sql")):
            if path.name in applied:
                continue
            with conn.transaction():  # a failing migration leaves nothing half-applied
                conn.execute(path.read_text(encoding="utf-8"))
                conn.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))
            applied_now.append(path.name)
    return applied_now


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--schema", default="public")
    args = ap.parse_args()
    done = migrate(args.schema)
    print("\n".join(f"Applied {n}" for n in done) or "Database is up to date.")


if __name__ == "__main__":
    main()
