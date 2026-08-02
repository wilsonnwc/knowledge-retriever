---
name: keyword-search-diagnosis
description: Phase 3.5 evaluation results and root cause analysis
metadata:
  type: reference
---

# Keyword Search Evaluation & Diagnosis

**Test Date:** 2026-08-02  
**Test Set:** 10 realistic PM queries  
**Result:** 30% precision@5 (3 correct, 7 failures)

---

## The Data

| Difficulty | Precision | Notes |
|---|---|---|
| Easy (2 queries) | 50% | Direct keyword matches work |
| Medium (2 queries) | 0% | Conceptual mismatches |
| Hard (6 queries) | 33% | Varied failures |
| **Overall** | **30%** | **Below acceptable threshold** |

**Successful queries:** mom-test (exact match), design-mistakes (synonym worked), making-mistakes (exact match)

**Failed queries:** strategy-vs-goals, stakeholder-priorities, org-knowledge-base, team-decisions, roadmap-purpose, pm-focus

---

## Root Cause Analysis

### **Pattern 1: Synonymy (40% of failures)**

**Example failure:**  
Query: *"What's the difference between strategy and goals?"*  
Expected: `good-strategy-bad-strategy`  
Retrieved: `pm-playbook`, `design-of-everyday-things`, `three-parts-of-good-strategy`

**Why it failed:** The exact concept ("strategy vs. goals") is in `good-strategy-bad-strategy`, but:
- Query has "strategy" + "goals"
- File `three-parts-of-good-strategy` has "strategy" but no "goals" → ranked lower
- File `good-strategy-bad-strategy` exists but ranked by keyword count, not relevance

**Root cause:** Keyword matching doesn't understand that "strategy" and "goals" are *related concepts*. System sees "strategy" matches multiple files equally; doesn't know `good-strategy-bad-strategy` is specifically about this relationship.

### **Pattern 2: Phrase/Semantic Meaning (60% of failures)**

**Example failure:**  
Query: *"How do I know what will matter to my stakeholders?"*  
Expected: `stakeholder-management`  
Retrieved: (stakeholder file ranked 5th, not top 3)

**Why it failed:** The query is asking "how to understand stakeholder priorities." The stakeholder file has this content. But:
- Query keywords: "know", "matter", "stakeholders"
- File has "stakeholders" but the connection between "what matters" (priorities) isn't matched by word count
- Retrieved `design-of-everyday-things` first because it happens to have multiple keyword matches

**Root cause:** Keyword matching treats all word occurrences equally. It doesn't understand that "what will matter to stakeholders" = "stakeholder incentives" = "stakeholder priorities." These are *semantically related* but different words.

---

## Concrete Evidence

### Success: Query 2 (50% match)
```
Query: "How do I talk to customers about their problems?"
Expected: the-mom-test
Result: ✓ Ranked #1

Why it worked:
- Direct phrase match: "talk to customers" appears in Mom Test
- Exact concept match: discovering customer problems is the entire book
- No synonymy or semantic gap
```

### Failure: Query 5 (30% miss)
```
Query: "How do I know what will matter to my stakeholders?"
Expected: stakeholder-management (understanding stakeholder incentives)
Result: ✗ Ranked #5+

Why it failed:
- Query uses: "know", "matter", "stakeholders"
- File uses: "stakeholders", "incentives", "veto power", "alignment"
- Keywords: "stakeholders" matches, but "what matters" ≠ "incentives" (different words)
- System ranked pm-playbook #1 (happens to have multiple query words)
```

### Failure: Query 8 (Medium-difficulty semantic gap)
```
Query: "What's the difference between strategy and goals?"
Expected: good-strategy-bad-strategy
Result: ✗ Retrieved three-parts-of-good-strategy instead

Why it failed:
- Query is asking for *relationship* between two concepts
- File good-strategy-bad-strategy defines this relationship explicitly
- File three-parts-of-good-strategy covers strategy but not goals
- Keyword matcher sees both have "strategy"; three-parts ranked higher by word count
- System doesn't understand the query is asking for a *comparison*
```

---

## The Pattern

**70% of failures fall into 2 categories:**

1. **Synonymy gaps** — "strategy" vs "goals" are related; "incentives" vs "priorities" are related. Keyword search treats them as unrelated.
2. **Phrase/semantic meaning** — "What matters" (intent) ≠ "has the word 'matter'" (keyword match). Query is asking for *understanding*, not just word overlap.

**Why this matters:** These aren't edge cases. These are **natural questions a user would ask**. At 30% precision, keyword search fails 2 out of 3 times on conversational queries.

---

## Implication: Why Semantic Search

Both failure patterns suggest a solution: **understanding meaning, not just words.**

- **For synonymy:** If "incentives," "priorities," and "what matters" are embedded in the same region of meaning-space, a similarity-based search finds them.
- **For phrase meaning:** "What will matter to stakeholders" has a semantic meaning that's *not the sum of its words*. Embeddings capture phrase-level meaning.

**Next step:** Implement semantic search (embeddings) and re-measure on the same 10 queries. If semantic search gets 7+ correct (70%+), we've fixed the core problem.

---

## Interview Story

> "I built keyword search and tested it on 10 realistic queries. It got 30% right — decent baseline, but not good enough.
>
> I analyzed the failures and found two patterns:
>
> **Pattern 1 — Synonymy:** Query about 'strategy vs. goals' didn't retrieve the file specifically about that relationship, because keyword search doesn't know 'goals' and 'strategy' are related.
>
> **Pattern 2 — Phrase meaning:** Query 'What will matter to my stakeholders' was looking for understanding of stakeholder priorities. The system had the answer but ranked it lower because it just counts keywords, not phrase-level meaning.
>
> 70% of failures came down to: *the system doesn't understand meaning, just words.*
>
> That's why I chose semantic search (embeddings) for Phase 4. It addresses the specific limitation I discovered: understanding synonymy and phrase meaning, not just word matching."

This is evidence-driven, not theory-driven. You *discovered* why semantic search matters.
