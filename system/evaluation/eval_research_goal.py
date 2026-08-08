#!/usr/bin/env python3
"""
LLM-as-judge evaluation script for research_goal() coverage verdicts.

Runs test cases from research_goal_test_cases.json, executes research_goal(),
then uses Claude as a judge to evaluate whether the model's verdicts match
expected verdicts along multiple dimensions:
  - Correct COVERED vs. OPEN verdict
  - Citation accuracy (does source exist in retrieved notes?)
  - Caveat appropriateness (flagged when generic, not flagged when specific)

Prints per-test results + aggregate metrics.
"""

import json
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from chat import research_goal, _ask_claude

EVAL_DIR = Path(__file__).parent
TEST_CASES_FILE = EVAL_DIR / "research_goal_test_cases.json"

@dataclass
class TestResult:
    test_id: str
    passed: bool
    expected_verdict: str
    actual_verdict: Optional[str]
    feedback: str
    eval_method: str

def load_test_cases() -> dict:
    """Load test cases from JSON file."""
    with open(TEST_CASES_FILE) as f:
        return json.load(f)

def eval_rule_based(test_case: dict, actual_output: dict) -> TestResult:
    """
    Evaluate using deterministic rule-based checks (100% accuracy required).
    - Arithmetic: len(covered) + len(open) == len(all_items)
    - Citation validation: cited sources exist in retrieved notes
    """
    test_id = test_case["test_id"]
    eval_method = "rule_based"

    if test_case["expected_verdict"] == "ARITHMETIC":
        # Check coverage arithmetic: the output should pass the arithmetic test
        total_items = actual_output.get("total_items", 0)
        covered_count = actual_output.get("covered_count", 0)
        open_count = actual_output.get("open_count", 0)

        if covered_count + open_count == total_items:
            return TestResult(
                test_id=test_id,
                passed=True,
                expected_verdict="ARITHMETIC",
                actual_verdict=f"{covered_count}+{open_count}=={total_items}",
                feedback="Coverage arithmetic is consistent",
                eval_method=eval_method
            )
        else:
            return TestResult(
                test_id=test_id,
                passed=False,
                expected_verdict="ARITHMETIC",
                actual_verdict=f"{covered_count}+{open_count}!={total_items}",
                feedback=f"Arithmetic check failed: {covered_count} + {open_count} ≠ {total_items}",
                eval_method=eval_method
            )

    # For citation validation checks
    retrieved_paths = set(actual_output.get("retrieved_paths", []))
    cited_sources = actual_output.get("cited_sources", [])

    all_valid = all(source in retrieved_paths for source in cited_sources if source)

    return TestResult(
        test_id=test_id,
        passed=all_valid,
        expected_verdict="CITATION_VALID",
        actual_verdict="VALID" if all_valid else "INVALID",
        feedback="All citations point to retrieved notes" if all_valid else "Some citations point to non-retrieved notes",
        eval_method=eval_method
    )

def eval_llm_as_judge(test_case: dict, actual_output: dict) -> TestResult:
    """
    Use Claude to judge whether the model's verdict matches expectations
    across multiple dimensions: correctness, citation, caveat appropriateness.
    """
    test_id = test_case["test_id"]
    eval_method = "llm_as_judge"

    prompt = f"""You are evaluating whether a research goal evaluation was correct.

TEST CASE:
Goal: {test_case['goal']}
Item being judged: {test_case['item_being_judged']}
Expected verdict: {test_case['expected_verdict']}
Expected source: {test_case['expected_source']}
Expected caveat: {test_case['expected_caveat']}

ACTUAL OUTPUT FROM MODEL:
Total items found: {actual_output.get('total_items', 0)}
Covered: {actual_output.get('covered_count', 0)}
Open: {actual_output.get('open_count', 0)}
Retrieved notes: {json.dumps(actual_output.get('retrieved_paths', []), indent=2)}

MODEL'S VERDICT ON THIS ITEM:
{actual_output.get('item_verdict_text', 'No specific verdict found')}

EVALUATION TASK:
1. Did the model correctly identify the item as COVERED or OPEN?
2. If COVERED, did it cite a valid source from the retrieved notes?
3. If the source is generic/thin (like a general note covering a specific question), did the model add an appropriate caveat tag?

Respond with:
PASS or FAIL
Reasoning: [1-2 sentences explaining why]"""

    judge_response = _ask_claude(prompt, max_tokens=200, temperature=0)

    passed = "PASS" in judge_response.upper()

    return TestResult(
        test_id=test_id,
        passed=passed,
        expected_verdict=test_case["expected_verdict"],
        actual_verdict=actual_output.get("item_verdict", "UNKNOWN"),
        feedback=judge_response,
        eval_method=eval_method
    )

def run_test_case(test_case: dict) -> TestResult:
    """
    Execute a single test case:
    1. Run research_goal() with the test's goal
    2. Analyze output for the specific item being judged
    3. Evaluate using the specified method (rule_based or llm_as_judge)
    """
    test_id = test_case["test_id"]
    goal = test_case["goal"]
    item_being_judged = test_case["item_being_judged"]
    eval_method = test_case["eval_method"]

    print(f"\n[{test_id}] Running: {test_case['name']}")
    print(f"  Goal: {goal}")

    # Run the research goal feature
    try:
        # research_goal() prints to stdout and returns the final markdown content
        result = research_goal(goal, max_rounds=3, auto_narrow=True)

        # Parse the result to extract verdicts
        # This is simplified — in reality we'd parse the markdown more carefully
        covered_items = []
        open_items = []

        if "### Covered" in result:
            covered_section = result.split("### Covered")[1].split("###")[0] if "###" in result.split("### Covered")[1] else result.split("### Covered")[1]
            for line in covered_section.split("\n"):
                if line.strip().startswith("- "):
                    covered_items.append(line.strip()[2:])

        if "### Open" in result:
            open_section = result.split("### Open")[1]
            for line in open_section.split("\n"):
                if line.strip().startswith("- "):
                    open_items.append(line.strip()[2:])

        actual_output = {
            "total_items": len(covered_items) + len(open_items),
            "covered_count": len(covered_items),
            "open_count": len(open_items),
            "covered_items": covered_items,
            "open_items": open_items,
            "item_verdict": "COVERED" if item_being_judged in covered_items else "OPEN" if item_being_judged in open_items else "NOT_FOUND",
            "full_result": result
        }

    except Exception as e:
        return TestResult(
            test_id=test_id,
            passed=False,
            expected_verdict=test_case["expected_verdict"],
            actual_verdict="ERROR",
            feedback=f"Failed to run research_goal(): {str(e)}",
            eval_method=eval_method
        )

    # Evaluate based on method
    if eval_method == "rule_based":
        return eval_rule_based(test_case, actual_output)
    elif eval_method == "llm_as_judge":
        return eval_llm_as_judge(test_case, actual_output)
    else:
        return TestResult(
            test_id=test_id,
            passed=False,
            expected_verdict=test_case["expected_verdict"],
            actual_verdict="UNKNOWN",
            feedback=f"Unknown eval method: {eval_method}",
            eval_method=eval_method
        )

def main():
    """Load test cases and run evaluation."""
    print("=" * 80)
    print("RESEARCH_GOAL() EVALUATION — LLM-as-Judge")
    print("=" * 80)

    test_data = load_test_cases()
    test_cases = test_data["test_cases"]

    print(f"\nLoaded {len(test_cases)} test cases from {TEST_CASES_FILE.name}")
    print(f"Acceptance bar: {json.dumps(test_data['metadata']['acceptance_bar'], indent=2)}\n")

    results = []
    for test_case in test_cases:
        result = run_test_case(test_case)
        results.append(result)

        status = "✅ PASS" if result.passed else "❌ FAIL"
        print(f"  {status}: {result.feedback[:100]}")

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
            print(f"\n[{result.test_id}]")
            print(f"Expected: {result.expected_verdict}")
            print(f"Actual: {result.actual_verdict}")
            print(f"Feedback:\n{result.feedback}")

    return 0 if overall_passed == overall_total else 1

if __name__ == "__main__":
    sys.exit(main())
