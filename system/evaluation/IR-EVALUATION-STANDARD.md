---
name: ir-evaluation-standard
description: Information Retrieval evaluation methodology, metrics, and best practices for RAG systems
metadata:
  type: reference
---

# Information Retrieval Evaluation Standard

**Purpose:** Reference guide for evaluating retrieval quality in RAG systems. Use this when designing eval sets, measuring retrieval, or explaining evaluation methodology in interviews.

**Applies to:** Any system that retrieves documents/sections in response to queries (keyword search, semantic search, hybrid).

---

## What is Information Retrieval?

**Definition:** The discipline of finding relevant documents/information from a large collection in response to a user query.

**Core Problem:**
```
User query: "How do I handle user mistakes in design?"
            ↓
Search 1000 documents
            ↓
Retrieve top 5 results
            ↓
Did we get the RELEVANT documents? Or just documents with matching words?
```

**Why Evaluation Matters:**
- Without measurement, bias is invisible (one success = "it works"; seven failures = you didn't notice)
- Easy to optimize the wrong thing (more results retrieved ≠ better results)
- Evaluation forces honest assessment

---

## Standard IR Metrics

### **Precision@K** (most common for retrieval)

**Question:** Of the top K results, how many are relevant?

**Formula:** (Relevant documents in top K) / K

**What is K?** K is just a number representing how many results you show. **Top K** = the first K results, ranked by relevance.

**Real-world example — Google Search:**
```
Query: "best coffee shops in Seattle"

Google retrieves 10,000 matching pages, but shows:
Top 1: SeattleCoffee Guide (article) ← rank 1
Top 3: Seattle Best Coffee | Starbucks | Local Roasters
Top 10: ← full first page

User behavior:
- Most click in top 3 (precision@3 matters most)
- Few go past top 10 (precision@10 is ceiling)
- Almost nobody looks at page 2

Google's precision@3 is probably 70%+ 
(most top-3 results are actually good coffee shops)
```

**Your project example:**
```
Query: "How do I handle user mistakes?"
Expected: design-of-everyday-things section on error handling
Your retrieval system returns:
Top 1: pm-playbook (not relevant) ✗
Top 2: design-of-everyday-things → ERROR HANDLING section ✓
Top 3: mom-test (not relevant) ✗
Top 4: communication (not relevant) ✗
Top 5: leadership (not relevant) ✗

Precision@1 = 0/1 = 0% (first result was wrong)
Precision@5 = 1/5 = 20% (only 1 of top 5 was right)
```

**When to use:** You want to know "if I show the user top K results, how many will be useful?"

**Typical values:**
- 70%+ = good (user usually finds what they need in top 5)
- 50% = baseline (half the results are useful)
- 30% = poor (most results are noise)

**Why different K values matter:**
- **Precision@1** — mobile/chat interface (show 1 result)
- **Precision@3** — search UI (users skim top 3)
- **Precision@5** — your project (show 5 sections in chat)
- **Precision@10** — web search (full page of results)

### **Recall** (less common for personal KBs, more for large systems)

**Question:** Of all relevant documents, how many did we retrieve?

**Formula:** (Relevant documents retrieved) / (All relevant documents)

**Example:**
```
Query: "strategy"
All relevant documents in KB: 5 files mention strategy
Retrieved in top 5: 3 of them

Recall = 3 / 5 = 60%
```

**When to use:** You want to know "did I miss important documents?" Important for comprehensive search, less important for personal KBs (usually 1-2 correct answers per query).

### **Mean Reciprocal Rank (MRR)**

**Question:** Where was the first relevant result?

**Formula:** Average of (1 / rank of first relevant result) across queries

**Example:**
```
Query 1: First relevant doc at rank 2 → 1/2 = 0.5
Query 2: First relevant doc at rank 1 → 1/1 = 1.0
Query 3: No relevant doc at rank 1-5 → 0

MRR = (0.5 + 1.0 + 0) / 3 = 0.5
```

**When to use:** You want to know "does the system rank the right answer first?" Useful for measuring ranking quality, not just coverage.

### **NDCG (Normalized Discounted Cumulative Gain)**

**Question:** How good is the ranking, considering relevance grades?

**Formula:** Complex (involves relevance grades + position discounting)

**When to use:** Production systems where you have graded relevance (very relevant / somewhat / not). Too complex for your project.

---

## Real-World Comparison: Three Systems at Different Scales

Understanding how retrieval works across systems helps you see where your project fits:

### **Google Search (billions of documents)**
```
Query: "best coffee shops in Seattle"
→ 10,000,000+ matching pages
→ Show top 10 (precision@10 is all that matters)
→ Metric: Precision@10 = 80%+ (most of top 10 are legit coffee shops)
→ Why? Users rarely go past top 10
```

### **LeapSpace (18M scientific papers + personal KB)**
```
Query: "How does CRISPR affect cell viability?"
→ Search across 18M papers + researcher's saved papers
→ Show top 5 (chat interface, ranked by relevance)
→ Metrics: Precision@5, MRR (ranking matters — right paper should be #1)
→ Why? Researchers need high-quality top results + correct ranking
```

### **Your Knowledge Retriever (24-40 notes)**
```
Query: "How do I handle user mistakes?"
→ Search across 20-40 notes
→ Show top 5 (chat interface)
→ Metrics: Precision@5 (is the right note in top 5?)
→ Why? Small KB, but same interface as LeapSpace
```

**Key insight:** The metric you measure depends on scale and use case, but the principle is the same across all three: *Did the user get useful results in the top positions shown?*

---

## Evaluation Methodology for RAG

### **Step 1: Design Test Set**

**Good test set has:**
- **Mix of difficulties:** easy (exact match), medium (concept match), hard (synonymy/phrase meaning)
- **Mix of specificity:** specific queries (test precision) + vague queries (test robustness)
- **Size:** 10-20 queries is enough to spot patterns; 100+ is production-grade

**Example structure:**
```json
{
  "query": "How do I handle user mistakes?",
  "expected_source": "design-of-everyday-things",
  "expected_concept": "error handling or human error",
  "specificity": "specific",
  "difficulty": "hard",
  "reason": "Synonymy: 'mistakes' vs 'errors'"
}
```

### **Step 2: Run Queries**

For each query:
1. Submit to retrieval system
2. Record: which documents were retrieved? In what order?
3. Score: did expected document appear? At what rank?

### **Step 3: Measure**

Calculate metrics:
- **Precision@5:** What % of queries got the right doc in top 5?
- **Precision@1:** What % got it right on the first try?
- **MRR:** On average, how high did it rank?

### **Step 4: Analyze Failures**

For queries that failed:
- **Why did it fail?** (synonymy, phrase meaning, ranking, missing entirely?)
- **What pattern?** (multiple failures of same type?)
- **What signal?** (does this tell you what to fix next?)

### **Step 5: Compare Approaches**

Before → After:
```
Keyword search: 3/10 (30%) precision@5
Semantic search: 8/10 (80%) precision@5
Improvement: +50 points
```

This shows the value of the change.

---

## How to Frame Evaluation in Interviews

### **Don't say:**
> "I tested my system and it works."

**Say instead:**
> "I evaluated retrieval on 10 test queries:
> - Keyword search: 30% precision@5 (3 correct, 7 failed)
> - Failures fell into two patterns: synonymy gaps and phrase meaning
> - Implemented semantic search to address those specific failures
> - Re-measured: 80% precision@5 (8 correct)
> - Clear improvement because both tests used the same queries"

### **Key phrases:**
- "Precision@K" — shows you know the metric
- "MRR" or "ranking quality" — shows you think about ranking, not just coverage
- "Before/after on same test set" — shows disciplined measurement

### **For LeapSpace context:**
> "I use precision@K for small personal KBs (what I built). Production RAG systems add MRR and NDCG to track ranking quality, which matters at scale with hundreds of documents. For researchers evaluating retrieval, you'd also want to measure recall (did I miss relevant papers?) and add human grading for relevance (very relevant vs. somewhat relevant)."

---

## Common Pitfalls

### ❌ **Testing only successful queries**
You'll think the system works 100% of the time.

✓ **Fix:** Test mix of easy and hard queries. You'll see patterns in failures.

### ❌ **Changing test set after seeing results**
If Q6 fails, and you decide Q6 was "bad," you're cheating.

✓ **Fix:** Design test set first. Lock it. Then measure.

### ❌ **Measuring only precision**
You might miss a ranking problem (right doc is #5, not #1).

✓ **Fix:** Measure both precision and MRR. Or at least precision@1 and precision@5.

### ❌ **Running one query and declaring success**
One successful retrieval isn't data; it's anecdote.

✓ **Fix:** Run 10+ queries. Look for patterns.

---

## Reference: Metrics Table

| Metric | What it answers | When to use | Good target |
|---|---|---|---|
| **Precision@1** | Does the first result answer the query? | Early-stage, single-answer queries | 70%+ |
| **Precision@5** | Do the top 5 include the answer? | Standard for retrieval | 60%+ |
| **Recall** | Did I find ALL relevant docs? | Large-scale search, comprehensiveness | 80%+ (if multiple answers exist) |
| **MRR** | How high did I rank the right answer? | Ranking quality matters | 0.7+ (on 0-1 scale) |
| **NDCG** | How good is the ranked list of graded-relevant docs? | Production, graded relevance | 0.8+ |

---

## When to Measure What

**Personal KB (this project) — 24-40 notes:**
```
Query: "What's the best way to organize something?"
Retrieval: Show top 5 in chat
Measure: Precision@5 (are most top 5 results useful?)
Test set: 10-20 queries (enough to spot patterns)
Target: 60%+ precision@5 (user usually finds answer in top 5)
Example: "keyword got 30%, semantic got 80%"
```

**Team KB (50-200 docs):**
```
Example: internal company knowledge base
Measure: Precision@1, Precision@5, MRR (ranking matters)
Test set: 20-50 queries
Add: graded relevance (very helpful / somewhat / not helpful)
Target: 70%+ precision@5, 0.7+ MRR
```

**Production system (LeapSpace, 18M+ papers + researcher KB):**
```
Query: research question from scientist
Retrieval: Show top 5 papers + personal notes
Measure: NDCG (ranking quality), Recall (did we miss relevant papers?)
Test set: 500+ queries
Human grading: sample of results (every result graded by domain expert)
Target: 0.8+ NDCG, 80%+ recall
Why different: researchers need high-quality ranking + comprehensive coverage
```

**In interviews, name your tier:**
> "I measured retrieval on a personal KB (24 notes, 20 test queries, precision@5). Keyword search got 30%; semantic search got 80%. This is the right metric for this scale — at LeapSpace's scale, they'd also measure MRR and NDCG to handle ranking over millions of documents."

---

## Your Project Roadmap

**Phase 3.5 (Done):** Measure keyword search baseline
- Test set: 10 specific + 10 vague queries
- Metric: Precision@5
- Result: Baseline (likely 30-50%)

**Phase 4 (Next):** Implement semantic search
- Re-run same 20 queries on semantic search
- Measure: Precision@5 + MRR
- Compare: "Semantic improved precision by X points"

**Phase 5 (Interview prep):** Document findings
- "Keyword search: 30% precision; semantic search: 80%"
- "Here's why keyword failed (synonymy), and how semantic fixed it"
- "Measured on same test set for apples-to-apples comparison"

---

## Further Reading

**Standard references (if you want to dive deeper):**
- TREC (Text Retrieval Conference): Defines standard evaluation for IR
- Apache Lucene documentation: Query-document ranking
- Elasticsearch guide: Precision/recall in practice
- Papers: "Learning to Rank" (ranking quality research)

**For RAG specifically:**
- LangChain evaluation: How production RAG systems measure retrieval
- LlamaIndex evaluation: Semantic search quality metrics
- Anthropic blog: RAG evaluation best practices
