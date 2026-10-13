#!/usr/bin/env python3
"""Spike (2026-10-13): can a relevance score predict the user's Useful / Not useful presses?

Offline and read-only: reads Neon, calls the models, writes results to an output folder. Changes nothing live.
Compares three scorers on the same articles, against the user's latest live press on each:
  - baseline: today's ranking placement (top 3 / next 7 / everything else / junk)
  - Jev (System One, Score primitive, 4-level rubric) — also asked an article-type Choice, descriptive only
  - Haiku 4.5, given the same brief and the same rubric, answering one level
The reader brief lives outside this public repo (claude-brain/briefs/), and was written without looking at the labels.

    python system/spikes/2026-10-13-jev-relevance/run.py --brief ~/claude-brain/briefs/reader-brief-v0.md --out /tmp/x
"""

import argparse
import json
import os
import statistics
import sys
import time
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[3]
load_dotenv(ROOT / ".env")

LEVELS = [
    "Outside what this reader cares about, or a kind of item they skip (funding rounds, market moves, corporate news "
    "with no product lesson, promotions).",
    "Touches the reader's interests only loosely; little they would take away.",
    "On a topic the reader follows; keeps them up to date or adds a useful perspective.",
    "Squarely on a skill or goal in the reader's brief; something they would want to read in full, learn from or try.",
]
TYPES = {
    "market_update": "News about companies, funding, launches or market moves.",
    "opinion": "An argument or commentary piece.",
    "how_to": "A tutorial or practical guide that teaches how to do something.",
    "case_study": "How a specific team or product built, shipped or evaluated something.",
    "research": "A paper, benchmark or study summary.",
}
SECTION_SCORE = {"top": 3, "next": 2, "rest": 1, "junk": 0}

ITEMS_SQL = """
WITH live AS (
    SELECT e.* FROM events e
    WHERE e.action IN ('read', 'dismiss', 'later')
      AND NOT EXISTS (SELECT 1 FROM events u WHERE u.undoes_event_id = e.id)),
last AS (SELECT DISTINCT ON (item_id) item_id, action, surface, occurred_at FROM live ORDER BY item_id, id DESC)
SELECT i.id, i.title, i.source, i.summary, left(i.content_md, 2000) AS excerpt,
       l.action AS label_action, l.surface IS NOT NULL AS new_model,
       (SELECT s.section FROM sightings s WHERE s.item_id = i.id AND s.digest_date <= l.occurred_at::date
        ORDER BY s.digest_date DESC LIMIT 1) AS section
FROM last l JOIN items i ON i.id = l.item_id
WHERE l.action IN ('read', 'dismiss')
UNION ALL
SELECT i.id, i.title, i.source, i.summary, left(i.content_md, 2000), 'seen_only', true,
       (SELECT s.section FROM sightings s WHERE s.item_id = i.id AND s.digest_date = e.digest_date)
FROM events e JOIN items i ON i.id = e.item_id
WHERE e.action = 'seen'
  AND NOT EXISTS (SELECT 1 FROM events p WHERE p.item_id = e.item_id AND p.action IN ('read', 'dismiss', 'later', 'build'))
"""


def article_state(it: dict) -> dict:
    return {"title": it["title"], "newsletter": it["source"], "summary": it["summary"] or "",
            "opening_text": it["excerpt"] or ""}


def score_jev(client, brief: str, it: dict) -> dict:
    from typesafe_sdk import Choice, Score
    t0 = time.perf_counter()
    r = client.system_one(
        state={"reader": brief, "article": article_state(it)},
        questions={
            "relevance": Score(instructions="How likely is this reader to find this article useful?", criteria=LEVELS),
            "article_type": Choice(instructions="What kind of article is this?", criteria=TYPES),
        })
    ms = (time.perf_counter() - t0) * 1000
    rel, typ = r.answers["relevance"], r.answers["article_type"]
    usage = getattr(r, "usage", None)
    return {"jev_score": rel.score, "jev_conf": rel.confidence, "jev_probs": dict(rel.probabilities),
            "jev_type": typ.choice, "jev_type_conf": typ.confidence, "jev_ms": round(ms),
            "jev_usage": usage.model_dump() if hasattr(usage, "model_dump") else str(usage)}


def score_haiku(client, brief: str, it: dict) -> dict:
    rubric = "\n".join(f"{i}: {d}" for i, d in enumerate(LEVELS))
    prompt = (f"Reader brief:\n{brief}\n\nArticle:\n{json.dumps(article_state(it), ensure_ascii=False)}\n\n"
              f"How likely is this reader to find this article useful? Use this scale:\n{rubric}\n\n"
              "Answer with the single digit only.")
    t0 = time.perf_counter()
    m = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=5,
                               messages=[{"role": "user", "content": prompt}])
    ms = (time.perf_counter() - t0) * 1000
    text = "".join(b.text for b in m.content if b.type == "text").strip()
    level = int(text[0]) if text[:1].isdigit() else None
    return {"haiku_level": level, "haiku_ms": round(ms),
            "haiku_in": m.usage.input_tokens, "haiku_out": m.usage.output_tokens}


def auc(pos: list, neg: list) -> float | None:
    """Probability that a random Useful item scores above a random Not-useful one (ties count half)."""
    pos, neg = [p for p in pos if p is not None], [n for n in neg if n is not None]
    if not pos or not neg:
        return None
    wins = sum(1.0 if p > n else 0.5 if p == n else 0.0 for p in pos for n in neg)
    return wins / (len(pos) * len(neg))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brief", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--skip-jev", action="store_true")
    ap.add_argument("--skip-haiku", action="store_true")
    args = ap.parse_args()
    brief = Path(args.brief).expanduser().read_text(encoding="utf-8")
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)

    with psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row) as conn:
        items = list(conn.execute(ITEMS_SQL))
    print(f"{len(items)} articles", file=sys.stderr)

    jev = haiku = None
    if not args.skip_jev:
        from typesafe_sdk import TypeSafeClient
        jev = TypeSafeClient(model="jev-latest")
    if not args.skip_haiku:
        import anthropic
        haiku = anthropic.Anthropic()

    rows = []
    for n, it in enumerate(items, 1):
        row = {k: it[k] for k in ("id", "title", "source", "label_action", "new_model", "section")}
        row["baseline"] = SECTION_SCORE.get(it["section"])
        if jev:
            try:
                row.update(score_jev(jev, brief, it))
            except Exception as e:  # keep going: one failure shouldn't sink the spike
                row["jev_error"] = repr(e)
        if haiku:
            try:
                row.update(score_haiku(haiku, brief, it))
            except Exception as e:
                row["haiku_error"] = repr(e)
        rows.append(row)
        print(f"  {n}/{len(items)}", file=sys.stderr, end="\r")
    (out / "rows.json").write_text(json.dumps(rows, indent=1, default=str, ensure_ascii=False))

    def group(rs, key):
        return {lab: [r.get(key) for r in rs if r["label_action"] == lab] for lab in ("read", "dismiss", "seen_only")}

    report = {"n": {lab: sum(r["label_action"] == lab for r in rows) for lab in ("read", "dismiss", "seen_only")}}
    for name, key in (("baseline", "baseline"), ("jev", "jev_score"), ("haiku", "haiku_level")):
        for subset, rs in (("all", rows), ("since_10_oct", [r for r in rows if r["new_model"]])):
            g = group(rs, key)
            report[f"{name}_{subset}"] = {
                "auc_useful_vs_not": auc(g["read"], g["dismiss"]),
                "mean": {lab: (round(statistics.mean([v for v in vals if v is not None]), 2)
                               if any(v is not None for v in vals) else None) for lab, vals in g.items()},
            }
    if jev:
        ms = [r["jev_ms"] for r in rows if "jev_ms" in r]
        report["jev_latency_ms_median"] = statistics.median(ms) if ms else None
        report["jev_errors"] = sum("jev_error" in r for r in rows)
        types = {}
        for r in rows:
            if r["label_action"] in ("read", "dismiss") and r.get("jev_type"):
                t = types.setdefault(r["jev_type"], {"read": 0, "dismiss": 0})
                t[r["label_action"]] += 1
        report["jev_type_vs_label"] = types
    if haiku:
        ms = [r["haiku_ms"] for r in rows if "haiku_ms" in r]
        report["haiku_latency_ms_median"] = statistics.median(ms) if ms else None
        report["haiku_errors"] = sum("haiku_error" in r for r in rows)
        tin = sum(r.get("haiku_in", 0) for r in rows); tout = sum(r.get("haiku_out", 0) for r in rows)
        report["haiku_tokens"] = {"in": tin, "out": tout, "usd": round(tin / 1e6 * 1.0 + tout / 1e6 * 5.0, 4)}
    (out / "report.json").write_text(json.dumps(report, indent=1))
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
