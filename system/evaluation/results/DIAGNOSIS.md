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

**What is "precision@5"?** For each test query, the system retrieves its top 5 best-matching notes. Precision@5 asks: of those 28 queries, in how many did the *correct* note actually show up somewhere in that top-5 list? An 82% score means 23 out of 28 queries had the right answer in their top 5; the other 5 queries came back with the wrong notes entirely, or the right note ranked too low to make the cut.

> **Analogy:** Imagine you ask a librarian for a book and they hand you a stack of 5 candidates. Precision@5 just asks "was the actual book you wanted somewhere in that stack?" — not whether it was the very first one on top. It's a deliberately forgiving measure of "did the system get you in the right neighborhood."

The first evaluation run showed 18% precision@5 — a strikingly bad baseline. Rather than accept that number and jump straight to "keyword search is broken, let's build semantic search," we investigated *why* it was so bad. That investigation uncovered three separate bugs, each of which was masking the true baseline:

| Stage | Precision@5 | What changed |
|---|---|---|
| Initial run | 18% (5/28) | Raw, unexamined result |
| After fixing eval scoring bug | 54% (15/28) | Fixed `run_evaluation.py` matching logic |
| After fixing test data errors | 79% (22/28) | Corrected `expected_source` values in test set |
| After fixing tokenization bug | **82% (23/28)** | Fixed `search_notes()` in `chat.py` |

**This is the real lesson:** an 18% score felt like damning evidence that keyword search doesn't work. It wasn't. Most of that number was measurement error, not retrieval failure. Trusting the first number would have led to the wrong conclusion — "keyword search barely works" — when the truth is "keyword search works quite well (82%) with a handful of specific, explainable gaps."

> **Analogy:** This is like a school grading a test with a broken answer key. If the answer key itself has three mistakes, the students don't "fail" — the grading does. You have to fix the answer key before you can honestly judge the students. Here, "the students" is keyword search, and the broken answer key was the eval script, the test data, and the tokenizer, all at once.

> **Why this matters for interviews:** This is the single most reusable story in this whole diagnosis. Any time you evaluate an AI system and the number looks suspiciously bad (or suspiciously good), the first move should be "is my measurement trustworthy?" before "is my system broken?" It shows evaluation maturity — a skill interviewers specifically probe for in AI PM roles.

---

## Bug 1: Eval Script Scoring Logic

**File:** `system/evaluation/run_evaluation.py`

**The bug:**
```python
found_in_top5 = any(expected in f for f in retrieved_files[:5])
```

Many `expected_source` values in the test set listed multiple acceptable answers, e.g. `"the-mom-test or discovery-related"`. This line checked whether that *entire string* — including the literal word " or " — appeared as a substring inside a single filename. No filename could ever contain that text, so any query with a multi-value expected source was **structurally guaranteed to fail**, regardless of what the search actually returned.

> **Plain-English restatement:** The code was checking "does the filename literally contain the text `the-mom-test or discovery-related`?" — but no real file is ever going to be named that. It's like asking a vending machine for "Coke or Pepsi" as if that were the name of a single product on the label. Of course it comes back empty; you asked for something that can't exist as one string.

**The fix:** Split `expected_source` on `" or "` into a list of candidates, and match each candidate case-insensitively against retrieved filenames.

**Impact:** 16 of the original 23 failures were queries with multi-value expected sources. Fixing this alone took precision@5 from 18% → 54%.

> **Why this matters for interviews:** This is a great concrete example of "the bug was in the test harness, not the product." It's worth having ready because it shows you can distinguish between a system failing and a test failing to check the system correctly — two very different problems that produce the same scary red number.

---

## Bug 2: Test Data Errors

**File:** `system/evaluation/test_queries.json`

Several `expected_source` values didn't correspond to any real file:
- `"good-strategy-bad-strategy"` — no such file exists; the content is split across `bad-strategy.md` and `three-parts-of-good-strategy.md` (both excerpts from the same book)
- `"stakeholder-management"` — this is a *folder* name, not a file; no file is literally named that
- `"information-architecture (ai-general)"` — didn't match the actual filename, `"Information architecture is the foundation AI is starving for.md"`
- `"any ai-products folder content"` — descriptive text, not a filename reference at all

These weren't retrieval failures — they were test authoring errors, most of them introduced when queries were written before carefully checking exact filenames against the KB.

> **Analogy:** This is like grading a spelling test where the answer key says the correct spelling of a word is one that doesn't actually exist in the dictionary. The student could spell every real word perfectly and still "lose points" against an answer that was never right to begin with.

**The fix:** Updated each `expected_source` to reference actual filenames, using `" or "` to list multiple acceptable files where the query's answer could reasonably live in more than one place.

**Impact:** Fixing these 10 entries took precision@5 from 54% → 79%.

> **Why this matters for interviews:** Test data quality is itself a design decision, not a footnote — an eval is only as trustworthy as the ground truth it's scored against. Auditing your "answer key" against the real corpus (not just against memory of what you meant to write) is a habit worth naming explicitly in an interview.

---

## Bug 3: Tokenization Doesn't Strip Punctuation

**File:** `scripts/chat.py`, function `search_notes()`

**The bug:**
```python
query_words = query.lower().split()
```

A simple whitespace split leaves punctuation attached to words. The query *"What's the difference between strategy and goals?"* produces the token `"goals?"` — with the question mark. Since matching was a substring check (`word in content.lower()`), `"goals?"` never matches plain `"goals"` in file content, even when the file mentions "goals" three times.

> **Plain-English restatement:** `query.lower().split()` just breaks a sentence apart at spaces — it has no idea that punctuation isn't part of a word. So "goals?" (with the question mark stuck on) and "goals" (in the note text) are treated as two completely different words, the same way `"cat"` and `"catx"` would be. One character of noise was enough to make an exact-match search silently miss the exact word it needed.

**Concrete example (Query 8):** `bad-strategy.md` explicitly discusses "goals" three times but scored only on filler words like "the" and "and" — the one genuinely meaningful query word never counted. Meanwhile, competing files won by coincidentally matching "what's" or "difference."

**The fix:**
```python
query_words = re.findall(r"[a-z0-9']+", query.lower())
```

> **Plain-English restatement:** This new line tells the code "only pull out the actual letters and numbers, and throw away everything else" — so "goals?" becomes "goals" before the search ever runs. It's the difference between reading a word off a page with a smudge on it versus reading the word cleanly.

**Impact:** Fixed Q8 and Q6b outright. Also *revealed* that Q9's earlier "pass" had itself been a fluke — a spurious punctuation-inflated match had pushed a barely-relevant file into the top 5. After the fix, Q9 honestly fails, because the file really isn't a strong match. Net effect: 79% → 82%, with a more trustworthy ranking underneath.

> **Why this matters for interviews:** Notice that fixing this bug *dropped* one query (Q9) from "passing" to "failing." That's a good sign, not a bad one — the earlier pass was a false positive caused by the same punctuation bug working in the opposite direction (accidentally boosting an irrelevant file). A more accurate measurement isn't always a *higher* number; it's whatever number correctly reflects reality, even if that means admitting a previous "win" wasn't real.

---

## The 5 Remaining Genuine Failures

With all three bugs fixed, these are real gaps in what keyword matching can do:

### Q4 — "What's the best way to organize a knowledge base?"
**Expected:** Information architecture article
**Why it failed:** Query says "organize" (US spelling); the file says "organising" (British spelling) — never a substring match. The query says "knowledge base"; the file discusses "AI," "retrieval," "RAG," "taxonomy" instead. Conceptually a near-perfect match, zero literal keyword overlap.
**Pattern:** Spelling variants + no phrase-level match.

> **Plain-English restatement:** "Organize" and "organising" are the same word to a human — one's just American spelling, one's British. But to a substring check, `"organize"` and `"organising"` share no common full word, so the match fails completely. It's the search equivalent of a strict dictionary that refuses to recognize a word if even one letter is different.

### Q5 — "How do I know what will matter to my stakeholders?"
**Expected:** identifying-key-stakeholders or stakeholder-communication-approach
**Why it failed:** The word "matter(s)" appears in **26 of 27 files** in the KB — because every note ends with a `"> **Why this matters:**"` template line. A word that should be a strong, discriminating signal is instead pure noise, present almost everywhere. The one truly meaningful word left is "stakeholders," which isn't enough signal on its own to outrank files with more generic keyword overlap.
**Pattern:** Note-taking template convention accidentally destroys the discriminating power of a common word. This is specific to *this* KB's authoring style, not a generic keyword-search limitation.

> **Analogy:** Imagine every single email in your inbox ended with the same boilerplate sign-off, "Best regards, thanks for your time." If you searched your inbox for "regards," you'd get literally everything back — the word would be useless as a filter, even though it's a real word that "matches." That's exactly what happened to "matters" here: this project's own `"> **Why this matters:**"` template (the same callout style used throughout this documentation!) turned a normally-informative word into background noise.

### Q6 — "How should I spend my time as a PM?"
**Expected:** pm-managing-time
**Why it failed:** The file never abbreviates "product manager" to "PM" (always spells it out), and never uses the word "spend" (it says "four hours a day," "quality time working on"). Two independent synonymy gaps stacked on the same query.
**Pattern:** Classic synonymy — abbreviation mismatch + paraphrase mismatch.

> **Plain-English restatement:** You and the file are talking about the exact same thing, but using different words for it — like asking a coworker "how do you spend your day?" when the file only ever answers "how do you allocate four hours?" A human reader would immediately see these as the same question; a keyword matcher has no such common sense — it just checks whether the literal characters line up.

### Q9 — "How should teams make decisions together?"
**Expected:** communication or pm-managing-time
**Why it failed:** No file strongly matches "decisions together" as a phrase; the concept is scattered thinly across multiple files without concentrated keyword overlap.
**Pattern:** Phrase-level meaning not captured by individual word matching.

> **Plain-English restatement:** Keyword search scores each word separately, not the phrase as a whole — so "decisions" might get a little credit in one file and "together" a little credit in a different file, but no single file racks up enough combined credit to rise to the top. The *idea* of "teams deciding things jointly" is real and present in the KB, just not concentrated in one place using those specific words.

### Q9b — "What makes good teamwork?"
**Expected:** communication or leadership content
**Why it failed:** The Product Management in Practice (Communication) file is clearly *about* teamwork — team clarity, coordination, trust — but never uses the literal word "teamwork" anywhere in the text.
**Pattern:** Synonymy — the concept is present, the word is not.

> **Analogy:** This is the same "cars vs. automobile" problem from the librarian analogy above, playing out for real in this KB. The file talks at length about the *ingredients* of teamwork (clarity, coordination, trust) without ever using the umbrella word "teamwork" itself — like a recipe that lists flour, eggs, and sugar but never says "cake."

---

## The Real Pattern (Post Bug-Fix)

Excluding measurement artifacts, the genuine failure pattern is narrower and more specific than originally thought:

1. **Spelling/abbreviation variants** (Q4, Q6) — "organize" vs "organising"; "PM" vs "product manager"
2. **Template-induced noise** (Q5) — a common word polluted by boilerplate present in nearly every file
3. **Concept-present-word-absent** (Q6, Q9, Q9b) — the right idea is in the text, but the literal query words never appear

All three patterns point to the same underlying gap: **keyword search can only find what's spelled out verbatim.** It cannot recognize that "organize" and "organising" mean the same thing, that "PM" is shorthand for "product manager," or that a paragraph about team clarity and coordination is *about* teamwork even without using that word.

> **Big picture:** Every one of these 5 failures is really the same one bug in disguise — keyword search treats language as a bag of literal characters, not a carrier of meaning. Semantic search (see `04-semantic-search-concepts-briefing.md`) exists specifically to fix this class of gap, by comparing what things *mean* rather than what they literally say.

---

## Implication: Why Semantic Search

At a corrected 82% precision@5, keyword search is *already good* for this KB — this is an important, evidence-based revision from the original (buggy) 30% figure. But the 5 remaining failures are exactly the kind of gap semantic search is designed to close: recognizing that "organize" ≈ "organising," "PM" ≈ "product manager," and that a passage about team coordination is relevant to a query about "teamwork" even without shared vocabulary.

> **Why this matters for interviews:** This is a case study in *targeted* problem-solving rather than reflexive "throw a bigger/newer tool at it." Because the 82% baseline was measured honestly, the case for semantic search here is narrow and evidence-based ("it should close these 5 specific synonymy gaps"), not a vague "embeddings are better" hand-wave. That precision is exactly what a good AI PM brings to a build-vs-upgrade decision.

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
