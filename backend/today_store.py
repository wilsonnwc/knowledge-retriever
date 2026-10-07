"""
today_store.py — Neon access for the Today page: the day's cards, the reader, button presses, metrics.

Events are append-only (the database enforces it). Undo is an event that points at the press it
cancels, so "what is this card's state now?" is always computed from the full history, never stored.
"""

import os
import sys
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from db_schema import use_schema  # noqa: E402

load_dotenv(ROOT / ".env")  # local only; hosted platforms provide the variables directly

LONDON = ZoneInfo("Europe/London")          # metrics count calendar days where the user lives
# Decisions (count toward the success metrics). Revised with the user on 2026-10-05:
#   reading status — later / read ("Completed") / dismiss ("Skip"): one at a time, the latest live one wins;
#   build — a separate flag that can sit beside any status.
# 'read_now' (the old "Read now", meaning "about to read") only exists in history: it still folds as a
# status, but new presses can't write it.
STATUSES = ("later", "read", "dismiss", "read_now")
DECISIONS = STATUSES + ("build",)
ACTIONS = ("later", "read", "dismiss", "build", "open", "undo", "not_junk")  # what a button may write
SECTION_ORDER = {"top": 0, "next": 1, "rest": 2, "junk": 3}


class InvalidEvent(ValueError):
    """The request is well-formed JSON but not an allowed button press (→ HTTP 400)."""


class NotFound(LookupError):
    """No such item (→ HTTP 404)."""


@contextmanager
def tx():
    """One transaction per call: commits on success, rolls back on error."""
    with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=15, row_factory=dict_row) as conn:
        use_schema(conn, os.environ.get("DB_SCHEMA", "public"))
        yield conn


# ── State from history ────────────────────────────────────────────────────────

def state_from_events(events: list[dict]) -> dict:
    """Fold one item's events (oldest first) into its current state: a reading status plus a build flag."""
    undone = {e["undoes_event_id"] for e in events if e["action"] == "undo"}
    live = [e for e in events if e["id"] not in undone and e["action"] != "undo"]
    statuses = [e for e in live if e["action"] in STATUSES]
    status = statuses[-1] if statuses else None
    builds = [e for e in live if e["action"] == "build"]
    build = builds[-1] if builds else None
    return {
        "status": status["action"] if status else None,
        "status_event_id": status["id"] if status else None,
        "reason": status["reason"] if status else None,
        "build": build is not None,
        "build_event_id": build["id"] if build else None,
        "build_note": build["reason"] if build else None,
        "opened": any(e["action"] == "open" for e in live),
        "not_junk": any(e["action"] == "not_junk" for e in live),
        "not_junk_event_id": next((e["id"] for e in reversed(live) if e["action"] == "not_junk"), None),
    }


def _events_by_item(conn, item_ids: list[str]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {i: [] for i in item_ids}
    if item_ids:
        for e in conn.execute("SELECT * FROM events WHERE item_id = ANY(%s::text[]) ORDER BY id", (item_ids,)):
            out[e["item_id"]].append(e)
    return out


def _card(row: dict, events: list[dict]) -> dict:
    return {
        "id": row["id"], "title": row["title"], "source": row["source"], "also_in": row["also_in"],
        "url": row["url"], "kind": row["kind"], "retrieval_status": row["retrieval_status"],
        "category": row["category"], "summary": row["summary"], "one_liner": row["one_liner"],
        "read_time_min": row["read_time_min"], "section": row["section"], "rank": row["rank"],
        "why": row["why"], "class_reason": row["class_reason"],
        "received_at": row["received_at"].isoformat() if row.get("received_at") else None,
        "position": row.get("position"),
        "state": state_from_events(events),
    }


# ── Reads ─────────────────────────────────────────────────────────────────────

def digest_dates(limit: int = 30) -> list[str]:
    with tx() as conn:
        rows = conn.execute("SELECT DISTINCT digest_date FROM sightings ORDER BY digest_date DESC LIMIT %s", (limit,))
        return [r["digest_date"].isoformat() for r in rows]


def today(day: str | None = None) -> dict:
    """The page for one digest day (default: the latest). Junk corrected as 'not junk' moves to the rest list."""
    dates = digest_dates()
    day = day or (dates[0] if dates else None)
    page = {"date": day, "previous_dates": [d for d in dates if d != day][:14],
            "top": [], "next": [], "rest": [], "junk": [], "last_updated": last_updated(), "metrics": metrics()}
    if not day:
        return page
    with tx() as conn:
        rows = list(conn.execute(
            """SELECT i.*, s.source, s.section, s.rank, s.why, s.received_at, s.position
               FROM sightings s JOIN items i ON i.id = s.item_id
               WHERE s.digest_date = %s""", (day,)))
        events = _events_by_item(conn, [r["id"] for r in rows])
    rows.sort(key=lambda r: (SECTION_ORDER[r["section"]], r["rank"] if r["rank"] is not None else 999, r["title"]))
    for r in rows:
        card = _card(r, events[r["id"]])
        section = "rest" if r["section"] == "junk" and card["state"]["not_junk"] else r["section"]
        page[section].append(card)
    page["rest"] = by_newsletter(page["rest"])
    return page


def by_newsletter(cards: list[dict]) -> list[dict]:
    """Everything else, grouped by newsletter: the oldest email first, each newsletter in its own order.
    Days stored before delivery times were kept (6 Oct and earlier) fall back to newsletter name, then title."""
    first = {}
    for c in cards:
        if c["received_at"] and (c["source"] not in first or c["received_at"] < first[c["source"]]):
            first[c["source"]] = c["received_at"]
    return sorted(cards, key=lambda c: (c["source"] not in first, first.get(c["source"], ""), c["source"],
                                        c["position"] if c["position"] is not None else 1 << 30, c["title"]))


def item(item_id: str) -> dict:
    with tx() as conn:
        row = conn.execute("SELECT * FROM items WHERE id = %s", (item_id,)).fetchone()
        if not row:
            raise NotFound(item_id)
        events = _events_by_item(conn, [item_id])[item_id]
        seen = [r["digest_date"].isoformat() for r in conn.execute(
            "SELECT digest_date FROM sightings WHERE item_id = %s ORDER BY digest_date DESC", (item_id,))]
    return {"id": row["id"], "title": row["title"], "source": row["source"], "also_in": row["also_in"],
            "url": row["url"], "kind": row["kind"], "retrieval_status": row["retrieval_status"],
            "content_md": row["content_md"], "heading": row["heading"], "context": row["context"],
            "summary": row["summary"], "class_reason": row["class_reason"], "seen_on": seen,
            "state": state_from_events(events)}


def later() -> list[dict]:
    """Items whose current decision is 'later' (latest live decision), newest first."""
    with tx() as conn:
        ids = [r["item_id"] for r in conn.execute(
            "SELECT DISTINCT item_id FROM events WHERE action = 'later'")]
        events = _events_by_item(conn, ids)
        keep = [i for i in ids if state_from_events(events[i])["status"] == "later"]
        rows = list(conn.execute(
            """SELECT i.*, s.section, s.rank, s.why, s.source
               FROM items i JOIN LATERAL (SELECT * FROM sightings WHERE item_id = i.id
                                          ORDER BY digest_date DESC LIMIT 1) s ON true
               WHERE i.id = ANY(%s::text[])""", (keep,)))
    cards = [_card(r, events[r["id"]]) for r in rows]
    return sorted(cards, key=lambda c: c["state"]["status_event_id"], reverse=True)


def last_updated() -> dict | None:
    with tx() as conn:
        r = conn.execute("SELECT digest_date, finished_at FROM runs WHERE finished_at IS NOT NULL "
                         "ORDER BY finished_at DESC LIMIT 1").fetchone()
    return {"digest_date": r["digest_date"].isoformat(), "finished_at": r["finished_at"].isoformat()} if r else None


def metrics(now: datetime | None = None) -> dict:
    """Spec metrics: active days this month (>=1 live decision) and cards actioned today, in London days."""
    now = (now or datetime.now(LONDON)).astimezone(LONDON)
    month_start = now.date().replace(day=1)
    with tx() as conn:
        events = list(conn.execute(
            "SELECT * FROM events WHERE occurred_at >= %s ORDER BY id",
            (datetime(month_start.year, month_start.month, 1, tzinfo=LONDON),)))
    undone = {e["undoes_event_id"] for e in events if e["action"] == "undo"}
    live = [e for e in events if e["action"] in DECISIONS and e["id"] not in undone]
    local_day = lambda e: e["occurred_at"].astimezone(LONDON).date()  # noqa: E731
    active = {local_day(e) for e in live}
    today_items = {e["item_id"] for e in live if local_day(e) == now.date()}
    return {"active_days": len(active), "days_so_far": now.day, "actioned_today": len(today_items)}


# ── Writes ────────────────────────────────────────────────────────────────────

def record_event(item_id: str, action: str, reason: str | None = None, undoes_event_id: int | None = None) -> dict:
    """Validate and append one button press. Returns the event and the item's new state."""
    if action not in ACTIONS:
        raise InvalidEvent(f"unknown action: {action}")
    if reason is not None and not isinstance(reason, str):
        raise InvalidEvent("reason must be text")
    reason = (reason or "").strip() or None
    if action == "undo" and undoes_event_id is None:
        raise InvalidEvent("undo needs the event it cancels")
    with tx() as conn:
        row = conn.execute("SELECT kind FROM items WHERE id = %s", (item_id,)).fetchone()
        if not row:
            raise NotFound(item_id)
        if action == "not_junk" and row["kind"] != "junk":
            raise InvalidEvent("only junk items can be marked not junk")
        if action == "undo":
            target = conn.execute("SELECT * FROM events WHERE id = %s", (undoes_event_id,)).fetchone()
            if not target or target["item_id"] != item_id or target["action"] in ("undo", "open"):
                raise InvalidEvent("that press can't be undone")
            if conn.execute("SELECT 1 FROM events WHERE undoes_event_id = %s", (undoes_event_id,)).fetchone():
                raise InvalidEvent("already undone")
        event = conn.execute(
            """INSERT INTO events (item_id, action, reason, undoes_event_id) VALUES (%s, %s, %s, %s)
               RETURNING id, item_id, action, reason, undoes_event_id, occurred_at""",
            (item_id, action, reason, undoes_event_id if action == "undo" else None)).fetchone()
        state = state_from_events(_events_by_item(conn, [item_id])[item_id])
    event["occurred_at"] = event["occurred_at"].isoformat()
    return {"event": event, "state": state}

