#!/usr/bin/env python3
"""
Evaluation script for research_goal() — validates structural properties of output.

Instead of trying to judge pre-specified items (which the feature doesn't support),
this script validates that research_goal() produces well-formed output:
- Coverage arithmetic holds (covered + open == total)
- No duplicates or overlaps
- All sources are valid file paths
- Caveats are used correctly (present when appropriate, absent when not)

Runs test cases from research_goal_test_cases.json and reports pass/fail for each.
"""

import json
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from chat import research_goal

EVAL_DIR = Path(__file__).parent
PROJECT_ROOT = EVAL_DIR.parent.parent
NOTES_DIR = PROJECT_ROOT / "notes"
TEST_CASES_FILE = EVAL_DIR / "research_goal_test_cases.json"

@dataclass
class TestResult:
    test_id: str
    test_name: str
    passed: bool
    feedback: str
    eval_method: str

def load_test_cases() -> dict:
    """Load test cases from JSON file."""
    with open(TEST_CASES_FILE) as f:
        return json.load(f)

def check_coverage_arithmetic(output: dict) -> tuple[bool, str]:
    """Check: covered_count + open_count == total_count"""
    covered_count = output["coverage_count"]
    open_count = len(output["open_items"])
    total_count = output["total_count"]

    if covered_count + open_count == total_count:
        return True, f"✓ Arithmetic holds: {covered_count} + {open_count} == {total_count}"
    else:
        return False, f"✗ Arithmetic failed: {covered_count} + {open_count} != {total_count}"

def check_no_duplicates(output: dict) -> tuple[bool, str]:
    """Check: no item in both covered and open, no duplicates in open"""
    covered_items = set(output["covered_items"].keys())
    open_items = output["open_items"]

    # Check overlap
    overlap = covered_items & set(open_items)
    if overlap:
        return False, f"✗ Items in both covered and open: {overlap}"

    # Check duplicates in open
    if len(set(open_items)) != len(open_items):
        dupes = [item for item in set(open_items) if open_items.count(item) > 1]
        return False, f"✗ Duplicate items in open: {dupes}"

    return True, "✓ No duplicates or overlaps"

def check_no_uncited_covered(output: dict) -> tuple[bool, str]:
    """Check: all covered items have non-empty sources"""
    uncited = []
    for item, (source, caveat) in output["covered_items"].items():
        if not source or source.strip() == "":
            uncited.append(item)

    if uncited:
        return False, f"✗ Covered items without valid sources: {uncited[:3]}..."
    else:
        return True, f"✓ All {len(output['covered_items'])} covered items have valid sources"

def check_all_sources_valid(output: dict) -> tuple[bool, str]:
    """Check: all cited sources point to existing note files"""
    invalid = []
    for item, (source, caveat) in output["covered_items"].items():
        if not source:
            continue
        # Extract the file path from source (format: "path/to/file.md")
        source_path = NOTES_DIR / source
        if not source_path.exists():
            invalid.append(source)

    if invalid:
        return False, f"✗ Sources pointing to non-existent files: {invalid[:3]}..."
    else:
        return True, f"✓ All sources are valid file paths"

def check_caveat_usage(output: dict) -> tuple[bool, str]:
    """
    Structural check: items with generic/off-topic sources should have caveats.
    This is heuristic — we check for patterns rather than trying to judge intent.
    """
    generic_categories = ["discovery"]  # notes/discovery/* files are often general PM
    ai_specific_categories = ["ai-products", "ai-general"]

    findings = []
    for item, (source, caveat) in output["covered_items"].items():
        if not source:
            continue

        is_generic = any(cat in source for cat in generic_categories)
        is_ai_specific = any(cat in source for cat in ai_specific_categories)

        # Heuristic: generic sources for an AI goal should have caveats
        # This is a weak check, but better than nothing for structural validation
        if is_generic and not caveat:
            findings.append(f"  • {item} (source: {source}) — generic source, no caveat")

    if findings:
        # This is a warning, not a hard fail, since we can't know intent
        feedback = f"⚠ Potential missing caveats ({len(findings)} items):\n" + "\n".join(findings[:3])
        return False, feedback
    else:
        return True, "✓ Caveat usage appears correct (heuristic check)"

def run_test_case(test_case: dict) -> TestResult:
    """
    Execute a single test case:
    1. Run research_goal() with the test's goal
    2. Validate output using structural checks
    """
    test_id = test_case["test_id"]
    goal = test_case["goal"]
    eval_method = test_case["eval_method"]
    test_name = test_case["name"]

    print(f"\n[{test_id}] {test_name}")
    print(f"  Goal: {goal}")

    try:
        output = research_goal(goal, max_rounds=3, auto_narrow=True)

        # Run appropriate structural checks based on eval_method
        if eval_method == "rule_based":
            if "arithmetic" in test_id.lower():
                passed, feedback = check_coverage_arithmetic(output)
            elif "duplicate" in test_id.lower():
                passed, feedback = check_no_duplicates(output)
            elif "uncited" in test_id.lower():
                passed, feedback = check_no_uncited_covered(output)
            elif "source" in test_id.lower():
                passed, feedback = check_all_sources_valid(output)
            else:
                passed, feedback = False, "Unknown rule-based test"

        elif eval_method == "structural":
            if "caveat" in test_id.lower():
                passed, feedback = check_caveat_usage(output)
            else:
                passed, feedback = False, "Unknown structural test"
        else:
            passed, feedback = False, f"Unknown eval method: {eval_method}"

    except Exception as e:
        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=False,
            feedback=f"ERROR running research_goal(): {str(e)}",
            eval_method=eval_method
        )

    return TestResult(
        test_id=test_id,
        test_name=test_name,
        passed=passed,
        feedback=feedback,
        eval_method=eval_method
    )

def main():
    """Load test cases and run evaluation."""
    print("=" * 80)
    print("RESEARCH_GOAL() EVALUATION — Structural Validation")
    print("=" * 80)

    test_data = load_test_cases()
    test_cases = test_data["test_cases"]

    print(f"\nLoaded {len(test_cases)} test cases from {TEST_CASES_FILE.name}")
    print(f"Test strategy: {test_data['metadata']['eval_philosophy']}\n")

    results = []
    for test_case in test_cases:
        result = run_test_case(test_case)
        results.append(result)

        status = "✅ PASS" if result.passed else "❌ FAIL"
        print(f"  {status}: {result.feedback}")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    by_method = {}
    for result in results:
        method = result.eval_method
        if method not in by_method:
            by_method[method] = {"passed": 0, "total": 0}
        by_method[method]["total"] += 1
        if result.passed:
            by_method[method]["passed"] += 1

    for method, stats in by_method.items():
        pct = (stats["passed"] / stats["total"] * 100) if stats["total"] > 0 else 0
        print(f"{method}: {stats['passed']}/{stats['total']} ({pct:.0f}%)")

    overall_passed = sum(r.passed for r in results)
    overall_total = len(results)
    overall_pct = (overall_passed / overall_total * 100) if overall_total > 0 else 0

    print(f"\nOVERALL: {overall_passed}/{overall_total} ({overall_pct:.0f}%)")

    # Detailed results for failed cases
    failed = [r for r in results if not r.passed]
    if failed:
        print("\n" + "=" * 80)
        print("FAILED CASES (detailed feedback)")
        print("=" * 80)
        for result in failed:
            print(f"\n[{result.test_id}] {result.test_name}")
            print(f"Feedback:\n{result.feedback}")

    return 0 if overall_passed == overall_total else 1

if __name__ == "__main__":
    sys.exit(main())
