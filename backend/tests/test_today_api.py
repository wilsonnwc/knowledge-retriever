"""Phase 2a / B1: password login on every route; the Today page API; append-only button presses."""

import os
from datetime import datetime, timedelta, timezone

import psycopg
import pytest

from conftest import PASSWORD, seed

DAY = "2026-10-05"


def _seed_day(schema):
    seed(schema, [
        ("a1", "article", "Top story", "top", 1, DAY),
        ("a2", "article", "Second", "top", 2, DAY),
        ("n4", "article", "Next item", "next", 4, DAY),
        ("r1", "article", "Everything else", "rest", None, DAY),
        ("j1", "junk", "Manage preferences", "junk", None, DAY),
        ("old", "article", "Yesterday's story", "top", 1, "2026-10-04"),
    ])


def press(c, item_id, action, **kw):
    return c.post("/api/events", json={"item_id": item_id, "action": action, **kw})


# ── Login guard ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize("method,path", [("GET", "/api/today"), ("GET", "/api/item?id=a1"), ("POST", "/api/events"),
                                         ("GET", "/api/later"), ("GET", "/api/notes"), ("DELETE", "/api/notes")])
def test_every_api_route_requires_login(client, method, path):
    assert client.open(path, method=method).status_code == 401


def test_wrong_password_is_rejected_and_right_one_lasts_30_days(client):
    assert client.post("/api/login", json={"password": "nope"}).status_code == 401
    r = client.post("/api/login", json={"password": PASSWORD})
    assert r.status_code == 200
    cookie = r.headers["Set-Cookie"]
    assert "HttpOnly" in cookie and "Expires=" in cookie
    assert client.get("/api/session").get_json() == {"auth_required": True, "authenticated": True}


def test_hosted_without_a_password_refuses_to_start(monkeypatch):
    from flask import Flask
    from auth import init_auth
    monkeypatch.setenv("RENDER", "true")
    monkeypatch.delenv("APP_PASSWORD", raising=False)
    with pytest.raises(RuntimeError):
        init_auth(Flask(__name__))


def test_local_without_a_password_keeps_auth_off(monkeypatch):
    from flask import Flask
    from auth import init_auth
    monkeypatch.delenv("RENDER", raising=False)
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.delenv("APP_PASSWORD", raising=False)
    app = Flask(__name__)
    init_auth(app)
    assert app.config["AUTH_REQUIRED"] is False


# ── The page ──────────────────────────────────────────────────────────────────

def test_today_defaults_to_latest_day_with_sections_in_rank_order(logged_in, schema):
    _seed_day(schema)
    page = logged_in.get("/api/today").get_json()["page"]
    assert page["date"] == DAY and page["previous_dates"] == ["2026-10-04"]
    assert [c["id"] for c in page["top"]] == ["a1", "a2"]
    assert [c["id"] for c in page["next"]] == ["n4"]
    assert [c["id"] for c in page["rest"]] == ["r1"] and [c["id"] for c in page["junk"]] == ["j1"]
    assert page["rest"][0]["one_liner"] == "A summary."
    assert logged_in.get("/api/today?date=2026-10-04").get_json()["page"]["top"][0]["id"] == "old"
    assert logged_in.get("/api/today?date=yesterday").status_code == 400


def test_reader_and_unknown_item(logged_in, schema):
    _seed_day(schema)
    assert logged_in.get("/api/item?id=a1").get_json()["item"]["seen_on"] == [DAY]
    assert logged_in.get("/api/item?id=nope").status_code == 404
    assert logged_in.get("/api/item").status_code == 400


@pytest.mark.parametrize("item_id", ["email:<20261004.3.5ce6@mg1.substack.com>", "pub.example/p/a-story?id=7"])
def test_reader_opens_real_shaped_ids(logged_in, schema, item_id):
    # B3's real ids: an email Message-ID (<, @, >) and a canonical URL (/, ?). Hosted, they failed in the path.
    from urllib.parse import quote
    seed(schema, [(item_id, "email_body", "Real", "top", 1, DAY)])
    got = logged_in.get(f"/api/item?id={quote(item_id, safe='')}")
    assert got.status_code == 200 and got.get_json()["item"]["id"] == item_id


# ── Button presses ────────────────────────────────────────────────────────────

def test_skip_reason_is_optional(logged_in, schema):
    # user decision 2026-10-05: Skip (stored as 'dismiss') no longer requires a reason
    _seed_day(schema)
    assert press(logged_in, "a1", "dismiss").get_json()["state"]["status"] == "dismiss"
    r = press(logged_in, "a2", "dismiss", reason="already read it elsewhere")
    assert r.status_code == 201 and r.get_json()["state"]["reason"] == "already read it elsewhere"


def test_completed_and_build_go_together_and_status_switches(logged_in, schema):
    _seed_day(schema)
    press(logged_in, "a1", "later")
    press(logged_in, "a1", "build", reason="a prompt library")
    state = press(logged_in, "a1", "read").get_json()["state"]      # Later -> Completed: the status switches
    assert (state["status"], state["build"], state["build_note"]) == ("read", True, "a prompt library")
    assert logged_in.get("/api/later").get_json()["items"] == []    # no longer on the Later list
    undo = press(logged_in, "a1", "undo", undoes_event_id=state["build_event_id"]).get_json()["state"]
    assert (undo["status"], undo["build"]) == ("read", False)      # undoing Build leaves Completed alone


def test_old_read_now_can_no_longer_be_written(logged_in, schema):
    _seed_day(schema)
    assert press(logged_in, "a1", "read_now").status_code == 400


def test_malformed_input_is_a_400_not_a_crash(client, schema):
    _seed_day(schema)
    assert client.post("/api/login", json={"password": 12345}).status_code == 401
    client.post("/api/login", json={"password": PASSWORD})
    assert press(client, "a1", "dismiss", reason=5).status_code == 400
    assert press(client, "a1", "undo", undoes_event_id="7").status_code == 400


def test_undo_restores_the_previous_decision_and_cannot_repeat(logged_in, schema):
    _seed_day(schema)
    first = press(logged_in, "a1", "later").get_json()["event"]["id"]
    second = press(logged_in, "a1", "read").get_json()["event"]["id"]
    undo = press(logged_in, "a1", "undo", undoes_event_id=second)
    assert undo.get_json()["state"]["status"] == "later"
    assert press(logged_in, "a1", "undo", undoes_event_id=second).status_code == 400  # already undone
    assert press(logged_in, "a2", "undo", undoes_event_id=first).status_code == 400   # another card's press


def test_not_junk_moves_a_junk_link_into_everything_else(logged_in, schema):
    _seed_day(schema)
    assert press(logged_in, "a1", "not_junk").status_code == 400
    assert press(logged_in, "j1", "not_junk").status_code == 201
    page = logged_in.get("/api/today").get_json()["page"]
    assert "j1" in [c["id"] for c in page["rest"]] and page["junk"] == []


def test_later_list_follows_the_current_status(logged_in, schema):
    _seed_day(schema)
    ev = press(logged_in, "n4", "later").get_json()["event"]["id"]
    assert [c["id"] for c in logged_in.get("/api/later").get_json()["items"]] == ["n4"]
    press(logged_in, "n4", "undo", undoes_event_id=ev)
    assert logged_in.get("/api/later").get_json()["items"] == []


def test_metrics_count_live_decisions_only(logged_in, schema):
    _seed_day(schema)
    press(logged_in, "a1", "open")                      # opening is not a decision
    press(logged_in, "a2", "build", reason="try it")
    ev = press(logged_in, "n4", "later").get_json()["event"]["id"]
    press(logged_in, "n4", "undo", undoes_event_id=ev)  # undone decisions don't count
    m = logged_in.get("/api/today").get_json()["page"]["metrics"]
    assert m["actioned_today"] == 1 and m["active_days"] == 1


def test_metrics_use_london_days(schema):
    import today_store
    _seed_day(schema)
    late_utc = datetime(2026, 7, 10, 23, 30, tzinfo=timezone.utc)  # 00:30 on 11 July in London (BST)
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        today_store.use_schema(conn, schema)
        conn.execute("INSERT INTO events (item_id, action, occurred_at) VALUES ('a1', 'read_now', %s)", (late_utc,))
    m = today_store.metrics(now=late_utc + timedelta(minutes=5))
    assert m["actioned_today"] == 1 and m["days_so_far"] == 11


def test_events_cannot_be_edited_or_deleted(schema):
    _seed_day(schema)
    import today_store
    today_store.record_event("a1", "later")
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        today_store.use_schema(conn, schema)
        with pytest.raises(psycopg.errors.RaiseException):
            conn.execute("UPDATE events SET action = 'dismiss'")
