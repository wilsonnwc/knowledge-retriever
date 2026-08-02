---
name: keyword-search-diagnosis
description: Phase 3.5 evaluation results and root cause analysis (corrected baseline after fixing eval bugs)
metadata:
  type: reference
---

# Keyword Search Evaluation & Diagnosis

**Test Date:** 2026-08-02
**Test Set:** 28 queries (14 specific + 14 vague variants)
**Result:** 82% precision@5 (23 correct, 5 failures)

---

## The Journey: From 18% to 82%

The first evaluation run showed 18% precision@5 — a strikingly bad baseline. Rather than accept that number and jump straight to "keyword search is broken, let's build semantic search," we investigated *why* it was so bad. That investigation uncovered three separate bugs, each of which was masking the true baseline:

| Stage | Precision@5 | What changed |
|---|---|---|
| Initial run | 18% (5/28) | Raw, unexamined result |
| After fixing eval scoring bug | 54% (15/28) | Fixed `run_evaluation.py` matching logic |
| After fixing test data errors | 79% (22/28) | Corrected `expected_source` values in test set |
| After fixing tokenization bug | **82% (23/28)** | Fixed `search_notes()` in `chat.py` |

**This is the real lesson:** an 18% score felt like damning evidence that keyword search doesn't work. It wasn't. Most of that number was measurement error, not retrieval failure. Trusting the first number would have led to the wrong conclusion — "keyword search barely works" — when the truth is "keyword search works quite well (82%) with a handful of specific, explainable gaps."

---

## Bug 1: Eval Script Scoring Logic

**File:** `system/evaluation/run_evaluation.py`

**The bug:**
```python
found_in_top5 = any(expected in f for f in retrieved_files[:5])
```

Many `expected_source` values in the test set listed multiple acceptable answers, e.g. `"the-mom-test or discovery-related"`. This line checked whether that *entire string* — including the literal word " or " — appeared as a substring inside a single filename. No filename could ever contain that text, so any query with a multi-value expected source was **structurally guaranteed to fail**, regardless of what the search actually returned.

**The fix:** Split `expected_source` on `" or "` into a list of candidates, and match each candidate case-insensitively against retrieved filenames.

**Impact:** 16 of the original 23 failures were queries with multi-value expected sources. Fixing this alone took precision@5 from 18% → 54%.

---

## Bug 2: Test Data Errors

**File:** `system/evaluation/test_queries.json`

Several `expected_source` values didn't correspond to any real file:
- `"good-strategy-bad-strategy"` — no such file exists; the content is split across `bad-strategy.md` and `three-parts-of-good-strategy.md` (both excerpts from the same book)
- `"stakeholder-management"` — this is a *folder* name, not a file; no file is literally named that
- `"information-architecture (ai-general)"` — didn't match the actual filename, `"Information architecture is the foundation AI is starving for.md"`
- `"any ai-products folder content"` — descriptive text, not a filename reference at all

These weren't retrieval failures — they were test authoring errors, most of them introduced when queries were written before carefully checking exact filenames against the KB.

**The fix:** Updated each `expected_source` to reference actual filenames, using `" or "` to list multiple acceptable files where the query's answer could reasonably live in more than one place.

**Impact:** Fixing these 10 entries took precision@5 from 54% → 79%.

---

## Bug 3: Tokenization Doesn't Strip Punctuation

**File:** `scripts/chat.py`, function `search_notes()`

**The bug:**
```python
query_words = query.lower().split()
```

A simple whitespace split leaves punctuation attached to words. The query *"What's the difference between strategy and goals?"* produces the token `"goals?"` — with the question mark. Since matching was a substring check (`word in content.lower()`), `"goals?"` never matches plain `"goals"` in file content, even when the file mentions "goals" three times.

**Concrete example (Query 8):** `bad-strategy.md` explicitly discusses "goals" three times but scored only on filler words like "the" and "and" — the one genuinely meaningful query word never counted. Meanwhile, competing files won by coincidentally matching "what's" or "difference."

**The fix:**
```python
query_words = re.findall(r"[a-z0-9']+", query.lower())
```

**Impact:** Fixed Q8 and Q6b outright. Also *revealed* that Q9's earlier "pass" had itself been a fluke — a spurious punctuation-inflated match had pushed a barely-relevant file into the top 5. After the fix, Q9 honestly fails, because the file really isn't a strong match. Net effect: 79% → 82%, with a more trustworthy ranking underneath.

---

## The 5 Remaining Genuine Failures

With all three bugs fixed, these are real gaps in what keyword matching can do:

### Q4 — "What's the best way to organize a knowledge base?"
**Expected:** Information architecture article
**Why it failed:** Query says "organize" (US spelling); the file says "organising" (British spelling) — never a substring match. The query says "knowledge base"; the file discusses "AI," "retrieval," "RAG," "taxonomy" instead. Conceptually a near-perfect match, zero literal keyword overlap.
**Pattern:** Spelling variants + no phrase-level match.

### Q5 — "How do I know what will matter to my stakeholders?"
**Expected:** identifying-key-stakeholders or stakeholder-communication-approach
**Why it failed:** The word "matter(s)" appears in **26 of 27 files** in the KB — because every note ends with a `"> **Why this matters:**"` template line. A word that should be a strong, discriminating signal is instead pure noise, present almost everywhere. The one truly meaningful word left is "stakeholders," which isn't enough signal on its own to outrank files with more generic keyword overlap.
**Pattern:** Note-taking template convention accidentally destroys the discriminating power of a common word. This is specific to *this* KB's authoring style, not a generic keyword-search limitation.

### Q6 — "How should I spend my time as a PM?"
**Expected:** pm-managing-time
**Why it failed:** The file never abbreviates "product manager" to "PM" (always spells it out), and never uses the word "spend" (it says "four hours a day," "quality time working on"). Two independent synonymy gaps stacked on the same query.
**Pattern:** Classic synonymy — abbreviation mismatch + paraphrase mismatch.

### Q9 — "How should teams make decisions together?"
**Expected:** communication or pm-managing-time
**Why it failed:** No file strongly matches "decisions together" as a phrase; the concept is scattered thinly across multiple files without concentrated keyword overlap.
**Pattern:** Phrase-level meaning not captured by individual word matching.

### Q9b — "What makes good teamwork?"
**Expected:** communication or leadership content
**Why it failed:** The Product Management in Practice (Communication) file is clearly *about* teamwork — team clarity, coordination, trust — but never uses the literal word "teamwork" anywhere in the text.
**Pattern:** Synonymy — the concept is present, the word is not.

---

## The Real Pattern (Post Bug-Fix)

Excluding measurement artifacts, the genuine failure pattern is narrower and more specific than originally thought:

1. **Spelling/abbreviation variants** (Q4, Q6) — "organize" vs "organising"; "PM" vs "product manager"
2. **Template-induced noise** (Q5) — a common word polluted by boilerplate present in nearly every file
3. **Concept-present-word-absent** (Q6, Q9, Q9b) — the right idea is in the text, but the literal query words never appear

All three patterns point to the same underlying gap: **keyword search can only find what's spelled out verbatim.** It cannot recognize that "organize" and "organising" mean the same thing, that "PM" is shorthand for "product manager," or that a paragraph about team clarity and coordination is *about* teamwork even without using that word.

---

## Implication: Why Semantic Search

At a corrected 82% precision@5, keyword search is *already good* for this KB — this is an important, evidence-based revision from the original (buggy) 30% figure. But the 5 remaining failures are exactly the kind of gap semantic search is designed to close: recognizing that "organize" ≈ "organising," "PM" ≈ "product manager," and that a passage about team coordination is relevant to a query about "teamwork" even without shared vocabulary.

**Next step:** Implement semantic search (embeddings) and re-measure on the same 28 queries — including the 5 that still fail — to see whether it closes this specific, narrower gap.

---

## Interview Story

> "I built a keyword search baseline and ran it against 28 realistic test queries. The first result was 18% precision@5 — alarmingly low. Instead of taking that at face value, I dug into *why*.
>
> I found three separate bugs: my evaluation script couldn't correctly score queries with multiple acceptable answers, my test data referenced a few non-existent files, and my search function didn't strip punctuation from query words — so 'goals?' never matched 'goals' in the text.
>
> After fixing all three, the honest baseline was 82%, not 18%. That's a very different story: keyword search actually performs well on this corpus. The 5 remaining failures are narrower and more interesting — one is caused by my own note-taking template ('Why this matters' appears in 26 of 27 files, turning a meaningful word into noise); the others are genuine synonymy gaps like 'PM' vs 'product manager' or 'organize' vs 'organising.'
>
> This taught me something important about evaluation: a bad number isn't automatically evidence the thing you're measuring is bad. Sometimes it's evidence your measurement is broken. I now have a precise, narrow reason to build semantic search — closing specific synonymy gaps — rather than a vague one based on a misleading baseline."

This is a stronger interview story than the original: it shows debugging discipline, not just implementation. It also demonstrates that you can catch and correct your own mistakes rather than presenting flawed early results as final conclusions.
