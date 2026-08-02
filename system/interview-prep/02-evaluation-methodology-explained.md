---
name: evaluation-methodology-interview-guide
description: Step-by-step explanation of how to measure retrieval quality — what the evaluation script does, why it matters, and how to explain it in interviews
metadata:
  type: interview-prep
---

# Evaluation Methodology: Interview Guide

**Context:** When you built a personal knowledge retriever, you needed to measure if it actually worked. This guide explains the evaluation methodology you implemented and how to talk about it in interviews.

---

## The Problem You're Solving

You have a knowledge retriever that takes queries and returns ranked results (top 5 files). But you don't know if it's working.

**Question:** How do you measure if retrieval is good?

**Naive answer:** "I tested it and it works."  
**Better answer (what you'll learn here):** "I measured precision@5 on 28 test queries. Keyword search got 18%. Here's why it failed, and how I fixed it."

---

## The Four-Step Evaluation Process

### **Step 1: Design a Test Set**

**What:** Create a list of realistic queries with expected answers.

**Example from your project:**
```
Query: "How do I talk to customers about their problems?"
Expected file: the-mom-test
Reason: The Mom Test is a book about customer discovery
Difficulty: easy (direct phrase match)
```

**Why it matters:**
- Tests against real user questions, not made-up ones
- Mix of difficulties (easy/medium/hard) reveals patterns
- Mix of specificity (specific/vague) tests robustness
- 28 queries is enough to spot patterns; 1 query is anecdote

**Your test set:**
- 28 queries total (14 specific + 14 vague variants)
- Mix of difficulties: easy (3), medium (9), hard (16)
- Each has: query text, expected_source, expected_concept, specificity, difficulty, reason

**Interview framing:**
> "I designed 28 test queries mixing easy/medium/hard and specific/vague variants. This catches both edge cases and typical user behavior. Easy queries (like 'How do I talk to customers?') test if the system works at all. Hard queries (like 'How do I know what will matter to stakeholders?') test synonymy and phrase meaning."

---

### **Step 2: Run Queries Through Retrieval System**

**What:** For each test query, run it through your search function and record what comes back.

**Code:**
```python
# For each query in test set
for q in queries:
    query_text = q["query"]  # "How do I talk to customers..."
    expected = q["expected_source"]  # "the-mom-test"
    
    # Call your actual search function
    context = search_notes(query_text)
    
    # Extract which files were returned
    retrieved_files = parse_results(context)
    # Result: ["the-mom-test", "pm-playbook-shipping-ai-features", "design-of-everyday-things"]
```

**What's happening:**
1. You take a query from your test set
2. You pass it to your actual keyword search function (not a mock)
3. The search returns ranked results (top file first, then 2nd, 3rd, etc.)
4. You record: which files were returned and in what order?

**Why it matters:**
- You're testing the *real system*, not a simulation
- The results are deterministic (same query = same results every time)
- You can compare before/after (keyword search vs. semantic search)

**Interview framing:**
> "I ran each test query through my actual keyword search function and recorded the top 5 files it returned in order. This gave me real data on how the system performs on realistic questions."

---

### **Step 3: Score Each Query**

**What:** For each query, check: "Did the expected file appear in the top 5 retrieved?"

**Code:**
```python
# Example: Query 2
retrieved_files = ["the-mom-test", "pm-playbook", "design-of-everyday-things"]
expected = "the-mom-test"

# Check: is expected file in top 5?
found_in_top5 = "the-mom-test" in retrieved_files[:5]  # TRUE
found_rank = 1  # It was rank 1

# Result: CORRECT ✓
```

**Another example: Query 6**
```python
retrieved_files = ["design-of-everyday-things", "pm-playbook", "the-mom-test"]
expected = "pm-managing-time"

# Check: is expected file in top 5?
found_in_top5 = "pm-managing-time" in retrieved_files[:5]  # FALSE

# Result: INCORRECT ✗
```

**The key metric: Precision@5**
- **Question:** Of the top 5 results, how many are correct?
- **Formula:** (Number of correct results in top 5) / (Total queries)
- **Your result:** 5 correct out of 28 = 18% Precision@5

**Why top 5?**
- Your chat interface shows 5 results
- Users rarely look past top 5
- This is what matters for your UX

**Interview framing:**
> "I measured Precision@5 — the percent of queries where the right answer appeared in the top 5 results. This matches my interface (I show 5 results) and user behavior (people don't scroll past 5)."

---

### **Step 4: Analyze Results by Difficulty**

**What:** Break down performance by query difficulty to spot patterns.

**Your results:**
```
Easy queries (3 total):
  - Q1: "What makes good strategy vs bad strategy?" ✗
  - Q2: "How do I talk to customers..." ✓
  - Q8b: "Explain strategy" ✗
  → 1/3 passed (33%)

Medium queries (9 total):
  - Q6: "How should I spend my time as a PM?" ✗
  - Q11: "How should I run A/B tests for AI features?" ✓
  - (7 more...)
  → 2/9 passed (22%)

Hard queries (16 total):
  - Q3: "How should I handle user mistakes?" ✓
  - Q4: "What's the best way to organize a KB?" ✗
  - (14 more...)
  → 2/16 passed (12%)

Overall: 5/28 (18%)
```

**What this tells you:**
- Harder queries fail more often (12% vs 33%)
- This is *expected* — harder queries involve synonymy and phrase meaning
- But even easy queries fail sometimes (1/3) — this is a red flag
- Keyword search doesn't scale well

**Interview framing:**
> "I broke down results by difficulty. Easy queries got 33%, but hard queries only 12%. This tells me keyword search has fundamental limitations — it doesn't understand phrase meaning or synonymy, which is essential for hard questions."

---

## Concrete Example: Query 5

Let me walk through one failing query in detail:

**Query:** "How do I know what will matter to my stakeholders?"  
**Expected file:** stakeholder-management files  
**Difficulty:** Hard

**What happened:**

1. **The query text:**
   - Words: "know", "matter", "will", "stakeholders"

2. **What retrieval returned (top 3):**
   - `pm-playbook-shipping-ai-features` (rank 1)
   - `design-of-everyday-things` (rank 2)
   - `Product Management in Practice (Communication)` (rank 3)
   - ❌ Stakeholder file is much lower (rank 5+)

3. **Why it failed:**
   - Query is asking: "How do I understand stakeholder priorities?"
   - Your KB has content on this in `stakeholder-management` files
   - But keyword search sees:
     - Query word "stakeholders" matches many files
     - It doesn't understand that "what will matter" = "incentives" = "priorities"
     - It just counts keyword matches
   - So it ranks by word frequency, not meaning
   - Stakeholder file loses to other files that happen to have more query words

4. **What this reveals:**
   - Keyword search has a **phrase meaning problem**
   - It doesn't understand that "what will matter to stakeholders" has a semantic meaning beyond matching words
   - This is exactly why you need semantic search

**Interview framing:**
> "Query 5 asked 'How do I know what will matter to my stakeholders?' I expected the stakeholder-management file, but keyword search returned design and AI files instead. This reveals the core limitation: keyword search doesn't understand phrase-level meaning. 'What will matter' doesn't match 'stakeholder incentives' even though they mean the same thing. This is a pattern in 60% of my failures."

---

## How to Explain This in an Interview

### **Don't say:**
> "I built a system and tested it. It got 18% precision. That's the baseline."

### **Say instead:**
> "I measured retrieval quality systematically. Here's my process:
> 
> **Step 1: Design test set** — 28 queries mixing easy/hard and specific/vague to catch patterns
> 
> **Step 2: Run real queries** — passed each through my actual keyword search function (not a mock)
> 
> **Step 3: Score** — Precision@5: Did the expected file appear in top 5? Result: 5/28 (18%)
> 
> **Step 4: Analyze by difficulty** — Easy: 33%, Medium: 22%, Hard: 12%
> 
> The pattern? Keyword search fails on phrase meaning and synonymy. That's why I chose semantic search for Phase 4."

### **Key phrases to use:**
- "Precision@5" — shows you know the metric
- "Top 5 results" — connects to your UI
- "By difficulty" — shows you think about patterns
- "Phrase meaning" — shows you understand the technical problem
- "Real queries" — shows you tested the actual system, not a mock

### **If they ask "Why measure this way?":**
> "Precision@5 matches my use case: I show 5 results, and users rarely scroll past them. Other metrics like Recall (did I find ALL relevant docs?) matter more for comprehensive search like Google Scholar. But for a chat interface, top-K precision is what users experience."

---

## The Evaluation Script (What It Does)

If they ask about implementation, here's what your `run_evaluation.py` script does:

```python
# 1. Load 28 test queries
for each query in test_queries.json:
    
    # 2. Run retrieval
    retrieved_files = search_notes(query_text)
    
    # 3. Score
    if expected_file in retrieved_files[:5]:
        score = 1  # Correct
    else:
        score = 0  # Incorrect
    
    # 4. Calculate metrics
    precision_at_5 = sum(scores) / len(queries)
    precision_at_5_by_difficulty = group_by(difficulty).calculate()

# 5. Output results
print(precision_at_5)  # 18%
print(by_difficulty)  # easy: 33%, medium: 22%, hard: 12%
```

**Interview version:**
> "The script is straightforward: for each test query, I call my search function, check if the expected file ranked in top 5, then calculate the percentage. I break it down by difficulty to spot patterns in what types of queries fail."

---

## Key Takeaways for Interviews

1. **Evaluation is methodical, not anecdotal**
   - Design test set first
   - Run real queries
   - Measure quantitatively
   - Analyze patterns

2. **Precision@5 is the right metric for your project**
   - Matches your interface (5 results)
   - Matches user behavior (don't scroll past 5)
   - Different from other systems (Google uses Precision@10)

3. **The baseline matters**
   - Keyword search: 18%
   - This is *data*, not opinion
   - Justifies semantic search investment

4. **Analysis reveals root cause**
   - Keyword search fails on phrase meaning
   - This is predictable, not random
   - Leads to targeted solution (embeddings)

5. **You can talk about tradeoffs**
   - Why not semantic search from day 1? Resource constraints
   - Why not measure Recall? Small KB (20-40 notes), usually one right answer
   - Why not measure NDCG? Need graded relevance (manual work)

---

## Design Choices vs. Fundamental Limitations

**Important distinction for interviews:**

When you discovered keyword search got 18% precision, you need to distinguish:

**What's a fundamental limitation of keyword search (the method)?**
- Doesn't understand synonymy ("incentives" ≠ "priorities" in meaning)
- Doesn't understand phrase meaning ("what will matter" ≠ word matching)
- Doesn't understand query intent (user wants BOTH good and bad strategies, not either/or)

**What's a design choice (how you implemented it)?**
- We searched content only; we didn't use metadata (the `source:` field, tags, etc.)
- We ranked by keyword count; we didn't weight by document quality/source

**Why this matters:**
Your implementation is "pure keyword search" (baseline). A more complete keyword search would include metadata signals, like:
- Google Search: queries title, headers, URL, metadata, content
- Elasticsearch: allows weighted field search
- Email: search by sender, subject, date, content

**Interview framing:**
> "I implemented pure keyword search as a baseline — just content matching, no metadata. This kept it simple and gave me a fair baseline to measure against. During evaluation, I discovered it doesn't use the `source:` field (which groups excerpts from the same book). That's not a limitation of keyword search as a method; it's a design choice I made for simplicity. A production system would weight metadata as an additional signal."

**This shows:**
- You understand what you measured (pure keyword search)
- You know how to make it better (add metadata signals)
- You deliberately chose simplicity over completeness
- You can distinguish method limitations from implementation choices

**For Phase 4:**
When you add semantic search, you could also add metadata boosting (hybrid: semantic similarity + source signal). This would show you understand layering signals for better retrieval.

---

## Next Steps

After explaining evaluation methodology, they'll ask: "So what did you do to fix it?"

Answer: "Phase 4: Implement semantic search with embeddings, re-run the same 28 queries, measure Precision@5 again, compare before/after."

This shows:
- You understand the problem (from evaluation data)
- You chose a targeted solution (addresses synonymy + phrase meaning)
- You'll measure improvement rigorously (same test set)
- You think about learning loops (measure → fix → measure)
