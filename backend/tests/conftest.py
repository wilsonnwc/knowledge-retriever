"""Today API tests run against a throwaway schema on the real Neon database, dropped afterwards."""

import os
import sys
import uuid
from pathlib import Path

import psycopg
import pytest

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent / "db"))

from dotenv import load_dotenv  # noqa: E402
load_dotenv(BACKEND.parent / ".env")

import migrate  # noqa: E402

PASSWORD = "correct horse battery staple"


@pytest.fixture
def schema(monkeypatch):
    if not os.environ.get("DATABASE_URL"):
        pytest.skip("DATABASE_URL not set")
    name = f"test_{uuid.uuid4().hex[:10]}"
    migrate.migrate(name)
    monkeypatch.setenv("DB_SCHEMA", name)
    yield name
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        conn.execute(f"DROP SCHEMA {name} CASCADE")


def seed(schema_name: str, rows: list[tuple]) -> None:
    """rows: (id, kind, title, section, rank, digest_date)"""
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        migrate.use_schema(conn, schema_name)
        for item_id, kind, title, section, rank, day in rows:
            conn.execute(
                """INSERT INTO items (id, digest_date, source, kind, title, url, retrieval_status, summary, one_liner)
                   VALUES (%s, %s, 'TLDR', %s, %s, %s, 'ok', 'A summary. Second sentence.', 'A summary.')
                   ON CONFLICT (id) DO NOTHING""",
                (item_id, day, kind, title, f"https://x.example/{item_id}"))
            conn.execute("INSERT INTO sightings (item_id, digest_date, source, section, rank) VALUES (%s, %s, 'TLDR', %s, %s)",
                         (item_id, day, section, rank))


@pytest.fixture
def client(schema, monkeypatch):
    from flask import Flask
    monkeypatch.setenv("APP_PASSWORD", PASSWORD)
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.delenv("RENDER", raising=False)
    from auth import init_auth
    from routes.today_routes import today_bp
    app = Flask(__name__)
    init_auth(app)
    app.register_blueprint(today_bp)

    @app.route("/api/notes", methods=["GET", "DELETE"])  # stands in for the existing, unprotected notes API
    def notes():
        return {"status": "success"}

    return app.test_client()


@pytest.fixture
def logged_in(client):
    assert client.post("/api/login", json={"password": PASSWORD}).status_code == 200
    return client
