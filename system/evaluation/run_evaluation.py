#!/usr/bin/env python3
"""
Fast evaluation of keyword search retrieval quality.
Run against test_queries.json, scores precision@5.
"""

import json
import sys
from pathlib import Path

# Add scripts dir to path so we can import chat functions
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))

from chat import search_notes

NOTES_DIR = Path(__file__).parent.parent.parent / "notes"


def validate_expected_sources(queries, notes_dir):
    """
    Tripwire, not auto-fix: check every expected_source option against
    real note filenames on disk, before trusting any score below. Catches
    a stale reference (a note renamed/merged/deleted after a query was
    written — exactly what happened after the Session 22 consolidation)
    the moment someone next runs the eval, instead of it silently
    rotting until a suspiciously low score forces a manual dig-in. See
    system/session-log.md Session 27/28 for the fuller reasoning on why
    this is a tripwire rather than a full path-stable-id migration.
    """
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
    """Run evaluation on test queries."""

    # Load test queries
    test_file = Path(__file__).parent / "test_queries.json"
    with open(test_file) as f:
        data = json.load(f)

    queries = data["test_queries"]
    results = []

    validate_expected_sources(queries, NOTES_DIR)

    print("\n" + "="*70)
    print("KEYWORD SEARCH EVALUATION")
    print("="*70)

    for q in queries:
        query_id = q["id"]
        query_text = q["query"]
        expected = q["expected_source"]
        difficulty = q["difficulty"]

        # Run retrieval
        context, _ = search_notes(query_text)

        # Parse results: extract file paths from context
        retrieved_files = []
        for line in context.split("\n"):
            if line.startswith("==="):
                # Extract filename from "=== notes/folder/filename.md ==="
                parts = line.replace("===", "").strip().split("/")
                if len(parts) >= 2:
                    filename = parts[-1].replace(".md", "")
                    retrieved_files.append(filename)

        # expected_source can list multiple acceptable answers separated by " or "
        # (e.g. "the-mom-test or discovery-related"). Split into candidates and
        # match case-insensitively so "communication" matches "...(Communication)".
        expected_options = [e.strip() for e in expected.split(" or ")]

        def matches(filename):
            return any(opt.lower() in filename.lower() for opt in expected_options)

        # Score: did any expected option appear in top 5?
        found_in_top5 = any(matches(f) for f in retrieved_files[:5])
        found_rank = None
        if found_in_top5:
            for rank, f in enumerate(retrieved_files[:5]):
                if matches(f):
                    found_rank = rank + 1
                    break

        # Record
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

        # Print
        status = "✓" if found_in_top5 else "✗"
        rank_str = f"(rank {found_rank})" if found_rank else "(not found)"
        print(f"\n{status} Query {query_id} [{difficulty}]: {query_text}")
        print(f"   Expected: {expected}")
        print(f"   Retrieved: {retrieved_files[:3]}")
        print(f"   Result: {rank_str}")

    # Summary
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

    # Failures
    failures = [r for r in results if not r["found_in_top5"]]
    if failures:
        print(f"\nFailures ({len(failures)}):")
        for f in failures:
            print(f"  - Q{f['query_id']}: {f['query']}")
            print(f"    Expected: {f['expected']}, Got: {f['retrieved']}")

    # Save results
    results_file = Path(__file__).parent / "keyword_results.json"
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
