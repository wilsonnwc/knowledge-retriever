"""Schema scoping shared by the app and db/migrate.py. Lives in backend/ so the hosted (Vercel) backend
service, whose bundle is the backend/ folder only, can import it."""

import re


def check_schema(schema: str) -> str:
    if not re.fullmatch(r"[a-z_][a-z0-9_]*", schema):
        raise ValueError(f"unsafe schema name: {schema!r}")
    return schema


def use_schema(conn, schema: str) -> None:
    """Scope this transaction to `schema`. Neon's pooled endpoint rejects search_path as a startup
    option and pools by transaction, so it is set per transaction (SET LOCAL), never per session."""
    # Always set, even for public: a session-level SET left on a pooled server connection (10 Oct: a test's
    # `SET search_path`, its schema then dropped) would otherwise silently redirect every later query.
    conn.execute(f"SET LOCAL search_path TO {check_schema(schema)}")
