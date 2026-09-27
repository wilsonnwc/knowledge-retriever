#!/usr/bin/env python3
"""Apply db/migrations/*.sql to DATABASE_URL in filename order, each exactly once."""

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


def main():
    with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=15) as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS schema_migrations (
                            filename   TEXT PRIMARY KEY,
                            applied_at TIMESTAMPTZ NOT NULL DEFAULT now())""")
        applied = {r[0] for r in conn.execute("SELECT filename FROM schema_migrations")}
        pending = [p for p in sorted((ROOT / "db" / "migrations").glob("*.sql")) if p.name not in applied]
        if not pending:
            print("Database is up to date.")
        for path in pending:
            with conn.transaction():  # a failing migration leaves nothing half-applied
                conn.execute(path.read_text(encoding="utf-8"))
                conn.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))
            print(f"Applied {path.name}")


if __name__ == "__main__":
    main()
