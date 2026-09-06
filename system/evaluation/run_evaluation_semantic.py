#!/usr/bin/env python3
"""
Evaluation of semantic search retrieval quality — the counterpart to
run_evaluation.py (keyword/BM25 baseline) that didn't exist until now.

Session 10 originally measured semantic search at 96% precision@5 against
this same test set, but that run wasn't saved as a reusable script — only
the keyword baseline (run_evaluation.py) was. That gap surfaced concretely
when a fix to what embed.py embeds (title/author, so name-based queries
like "what about Teresa Torres" have real signal to match on) needed
verifying against the locked 28-query set, and there was nothing to run.
search_notes_semantic() returns the same (context, top_path) shape as
search_notes(), so this is a near-identical copy of run_evaluation.py with
the retrieval call swapped — see that file for the fuller comments on the
scoring/tripwire logic shared by both.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))

from retrieval_service import search_notes_semantic

NOTES_DIR = Path(__file__).parent.parent.parent / "notes"


def validate_expected_sources(queries, notes_dir):
    real_filenames = [
        p.stem.lower() for p in notes_dir.rglob("*.md")
        if p.name != "template.md" and ".trash" not in p.relative_to(notes_dir).parts
    ]

    warnings = []
    for q in queries:
        options = [o.strip() for o in q["expected_source"].split(" or ")]
        for opt in options:
            if not any(opt.lower() in fname for fname in real_filenames):
                warnings.append(f"  Q{q['id']}: expected_source option {opt!r} matches no real note file")

    print("\n" + "="*70)
    print("EXPECTED_SOURCE STALENESS CHECK")
    print("="*70)
    if warnings:
        print(f"⚠ {len(warnings)} option(s) match no real file — may be stale, verify before trusting scores below:\n")
        for w in warnings:
            print(w)
    else:
        print("✓ Every expected_source option resolves to a real note file.")

    return warnings


def evaluate():
    test_file = Path(__file__).parent / "test_queries.json"
    with open(test_file) as f:
        data = json.load(f)

    queries = data["test_queries"]
    results = []

    validate_expected_sources(queries, NOTES_DIR)

    print("\n" + "="*70)
    print("SEMANTIC SEARCH EVALUATION")
    print("="*70)

    for q in queries:
        query_id = q["id"]
        query_text = q["query"]
        expected = q["expected_source"]
        difficulty = q["difficulty"]

        context, _ = search_notes_semantic(query_text)

        retrieved_files = []
        for line in context.split("\n"):
            if line.startswith("==="):
                parts = line.replace("===", "").strip().split("/")
                if len(parts) >= 2:
                    filename = parts[-1].replace(".md", "")
                    retrieved_files.append(filename)

        expected_options = [e.strip() for e in expected.split(" or ")]

        def matches(filename):
            return any(opt.lower() in filename.lower() for opt in expected_options)

        found_in_top5 = any(matches(f) for f in retrieved_files[:5])
        found_rank = None
        if found_in_top5:
            for rank, f in enumerate(retrieved_files[:5]):
                if matches(f):
                    found_rank = rank + 1
                    break

        result = {
            "query_id": query_id,
            "query": query_text,
            "expected": expected,
            "retrieved": retrieved_files[:5],
            "found_in_top5": found_in_top5,
            "rank": found_rank,
            "difficulty": difficulty
        }
        results.append(result)

        status = "✓" if found_in_top5 else "✗"
        rank_str = f"(rank {found_rank})" if found_rank else "(not found)"
        print(f"\n{status} Query {query_id} [{difficulty}]: {query_text}")
        print(f"   Expected: {expected}")
        print(f"   Retrieved: {retrieved_files[:3]}")
        print(f"   Result: {rank_str}")

    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)

    total = len(results)
    found = sum(1 for r in results if r["found_in_top5"])
    precision_at_5 = found / total

    by_difficulty = {}
    for r in results:
        diff = r["difficulty"]
        if diff not in by_difficulty:
            by_difficulty[diff] = {"total": 0, "found": 0}
        by_difficulty[diff]["total"] += 1
        if r["found_in_top5"]:
            by_difficulty[diff]["found"] += 1

    print(f"\nOverall Precision@5: {found}/{total} ({precision_at_5:.0%})")
    print("\nBy Difficulty:")
    for diff in ["easy", "medium", "hard"]:
        if diff in by_difficulty:
            stats = by_difficulty[diff]
            pct = stats["found"] / stats["total"] * 100
            print(f"  {diff}: {stats['found']}/{stats['total']} ({pct:.0f}%)")

    failures = [r for r in results if not r["found_in_top5"]]
    if failures:
        print(f"\nFailures ({len(failures)}):")
        for f in failures:
            print(f"  - Q{f['query_id']}: {f['query']}")
            print(f"    Expected: {f['expected']}, Got: {f['retrieved']}")

    results_file = Path(__file__).parent / "semantic_results.json"
    with open(results_file, "w") as f:
        json.dump({
            "test_set_size": total,
            "precision_at_5": precision_at_5,
            "queries_correct": found,
            "by_difficulty": by_difficulty,
            "results": results
        }, f, indent=2)

    print(f"\n✓ Results saved to: {results_file}")
    print("="*70 + "\n")

if __name__ == "__main__":
    evaluate()
