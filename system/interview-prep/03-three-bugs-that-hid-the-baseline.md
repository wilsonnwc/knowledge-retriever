---
name: three-bugs-that-hid-the-baseline
description: Detailed record of 3 stacked bugs found while debugging a suspiciously low keyword search score (18% -> 82%) — for quick recall before interviews
metadata:
  type: interview-prep
---

# The Three Bugs That Hid the Real Baseline

**Context:** First evaluation run of keyword search showed 18% precision@5 — a shockingly bad number. Instead of accepting it as "keyword search doesn't work," we investigated and found three separate, stacked bugs. The true baseline was 82%.

**Why this is worth remembering:** This is a stronger interview story than any single bug fix — it shows a debugging mindset applied to *evaluation itself*, not just to code. A surprising number should trigger "is my measurement broken?" before "is my system broken?"

---

## The Progression

| Stage | Precision@5 | Fix applied |
|---|---|---|
| Raw first run | 18% (5/28) | none — face-value result |
| + Fix eval scoring bug | 54% (15/28) | `run_evaluation.py` matching logic |
| + Fix test data errors | 79% (22/28) | `test_queries.json` expected values |
| + Fix tokenization bug | **82% (23/28)** | `search_notes()` in `chat.py` |

---

## Bug 1: Eval Script Couldn't Score Multi-Value Answers

**Where:** `system/evaluation/run_evaluation.py`

**The broken code:**
```python
found_in_top5 = any(expected in f for f in retrieved_files[:5])
```

**Why it broke:** Many test queries listed multiple acceptable answers as one string, e.g.:
```json
"expected_source": "the-mom-test or discovery-related"
```
The code checked whether this **entire string — including the literal word " or " —** appeared as a substring inside a single filename. No filename could ever contain the text `" or "` followed by another concept name. So every query written with multiple acceptable answers was **structurally guaranteed to fail**, no matter how good the actual retrieval was.

**The fix:**
```python
expected_options = [e.strip() for e in expected.split(" or ")]

def matches(filename):
    return any(opt.lower() in filename.lower() for opt in expected_options)

found_in_top5 = any(matches(f) for f in retrieved_files[:5])
```
Split on `" or "` into separate candidates, and match each one case-insensitively.

**How many queries this affected:** 16 of the original 23 failures (70%).

**One-line recall:** *"My scoring check treated 'X or Y' as one literal string to search for, instead of splitting it into two acceptable answers."*

---

## Bug 2: Test Data Referenced Things That Didn't Exist

**Where:** `system/evaluation/test_queries.json`

**Three flavors of the same mistake:**

1. **Referenced a folder name, not a file.**
   `"expected_source": "stakeholder-management"` — but no file is literally named `stakeholder-management.md`. That's the *folder* containing `identifying-key-stakeholders.md`, `stakeholder-communication-approach.md`, etc. The scoring check looks at filenames, so this could never match.

2. **Referenced a file that was never created.**
   `"expected_source": "good-strategy-bad-strategy"` — no such file exists. The book "Good Strategy, Bad Strategy" was excerpted into two separate files: `bad-strategy.md` and `three-parts-of-good-strategy.md`. The expected value assumed a consolidated file that was never made.

3. **Used descriptive text instead of a filename.**
   `"expected_source": "any ai-products folder content"` — this is a sentence describing intent, not something that can ever match an actual filename.

**The fix:** Went through every failing query, checked the real filenames in the KB with `find`/`ls`, and rewrote `expected_source` to reference actual files — using `" or "` to list several acceptable answers where more than one file could reasonably satisfy the query.

**How many queries this affected:** 10 entries, closing the gap from 54% → 79%.

**One-line recall:** *"I wrote test expectations before double-checking exact filenames — some referenced folders, some referenced files I never actually created."*

---

## Bug 3: Punctuation Wasn't Stripped From Query Words

**Where:** `scripts/chat.py`, function `search_notes()`

**The broken code:**
```python
query_words = query.lower().split()
```

**Why it broke:** A plain whitespace split leaves punctuation stuck to the last word. The query *"What's the difference between strategy and goals?"* produces the token `"goals?"` (with the question mark attached). Since matching is a substring check (`word in content.lower()`), the literal string `"goals?"` never matches plain `"goals"` in a file's content — even if the file says "goals" three times.

**Concrete before/after (Query 8):**
- `bad-strategy.md` mentions "goals" three separate times but scored using only filler words like "the" and "and" — the one truly meaningful signal word never got credit.
- Meanwhile, unrelated files won by coincidentally matching "what's" or "difference" — common connector words, not the concept the query was actually about.

**The fix:**
```python
query_words = re.findall(r"[a-z0-9']+", query.lower())
```
Regex word extraction instead of a naive split — strips trailing punctuation while still keeping apostrophes inside words like "what's."

**Bonus discovery from this fix:** Query 9 had been passing *before* this fix — but only because a spurious punctuation-inflated match had pushed a barely-relevant file into the top 5. After the fix, Q9 honestly fails, revealing the file really wasn't a strong match. The fix didn't just repair false negatives — it also exposed a false positive that had been hiding.

**How many queries this affected:** Fixed 2 outright (Q8, Q6b); flipped one hidden false positive to an honest failure (Q9). Net effect: 79% → 82%.

**One-line recall:** *"My tokenizer didn't strip punctuation, so 'goals?' never matched 'goals' — a one-character bug that silently discarded the most meaningful word in several queries."*

---

## The Meta-Lesson

None of these three bugs were about keyword search's *inherent* limitations (synonymy, phrase meaning). They were implementation bugs in the measurement harness itself. The lesson that matters most for interviews:

> **A surprisingly bad number is a prompt to investigate your measurement before you investigate your system.**

Trusting the first 18% figure would have produced a misleading story: "keyword search barely works, so we need semantic search." The real, evidence-based story is narrower and more credible: "keyword search actually works quite well (82%) on this corpus; the 5 remaining gaps are specific synonymy issues — 'PM' vs 'product manager,' 'organize' vs 'organising' — that semantic search is well-suited to close."

**How to say this in an interview:**
> "My first evaluation showed 18% precision, which seemed alarmingly bad. Rather than accept that, I debugged the evaluation pipeline itself and found three stacked bugs — a scoring logic error, incorrect test data, and a tokenization bug that stripped meaning from punctuation-adjacent words. Fixing all three revealed the true baseline was 82%. This changed my whole narrative: instead of 'keyword search doesn't work,' it became 'keyword search works well, and here are the five specific, explainable gaps semantic search should close.'"
