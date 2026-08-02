---
name: retrieval-strategies-deep-dive
description: Comprehensive reference on retrieval strategy tradeoffs for research document systems — for detailed review before interviews
metadata:
  type: reference
---

# Retrieval Strategies: Deep Dive Reference

**Purpose:** This document captures the detailed analysis of different retrieval approaches for knowledge bases containing long research documents. Use this to prepare for technical questions about RAG, chunking, and search strategies in interviews (especially LeapSpace interviews).

**Context:** Knowledge Retriever project encountered a critical retrieval problem: consolidated files (good for citation coherence) weren't being retrieved effectively by keyword search. This analysis explores 8+ different strategies for solving multi-chunk retrieval over large documents.

---

## The Core Problem (LeapSpace Context)

Researchers query a knowledge base containing:
- Personal papers (saved research articles)
- Project notes and drafts
- Long-form documents (50+ pages)
- Short-form notes (a few paragraphs)

**Retrieval challenge:** Find the right section of the right document without:
- Retrieving irrelevant sections (false positives waste researcher time)
- Missing relevant sections (false negatives frustrate discovery)
- Treating all sections equally (some are inherently more important)
- Requiring manual labeling at scale

---

## Strategy 1: Query-Word Density

**How it works:** Count matching query words in each section; rank sections by frequency.

**Example:**
```
Query: "How does CRISPR affect cell viability?"
Section A (Intro): "CRISPR technology..." → 1 word match
Section B (Results): "CRISPR treatment showed 60% cell death..." → 3 word matches ✓
```

**Pros:**
- Simple, fast, no dependencies
- Works for any unstructured content
- Scales to very large document sets

**Cons:**
- Common words ("the", "a") match everything → noise
- No synonymy ("CRISPR" ≠ "gene editing")
- False positives (query "Does trust matter?" matches any section mentioning "trust")
- Doesn't scale within long documents (50-page paper has 50+ sections matching)
- No notion of *why* a section is relevant, just word overlap

**When to use:** Tiny knowledge bases (< 50 documents) or first-pass filtering before a smarter ranker.

---

## Strategy 2: Hybrid Query Density + Section Header Relevance

**How it works:** 
1. Score content by query-word density
2. Boost sections whose headers contain query words/concepts
3. Combine scores: `content_score + (header_match_bonus)`

**Example:**
```
Query: "error handling"
Section titled "Error Handling Patterns":
  - Content matches: 4 words
  - Header matches: 2 words ("error" + "handling")
  - Final score: 4 + (2 * 1.5 boost) = 7 ✓ Ranked high

Section titled "Discussion of Results" with matching content:
  - Content matches: 3 words
  - Header matches: 0 words
  - Final score: 3 ✓ Ranked lower
```

**Pros:**
- Section headers are semantic labels; signals researcher intent
- Researchers skim headers first; matches their mental model
- Simple to implement; easy to debug ("why ranked high?" → check header)
- Improves naive keyword search immediately
- Works well for formal papers (which have descriptive headers)

**Cons:**
- Depends on header quality (vague headers like "Background" don't help)
- Headers can mislead (section titled "Results" might contain methodology narrative)
- Concepts can span multiple sections without appearing in headers
- Biases toward well-structured papers; breaks for PDFs, images, informal notes
- Still doesn't handle true synonymy

**When to use:** Medium-sized KBs with structured documents (research papers, tech docs). This is **likely LeapSpace's starting point**.

---

## Strategy 3: TF-IDF Scoring

**How it works:** Score based on **term frequency in section vs. rarity in corpus**.
- Rare terms across corpus = more important
- Common terms = less important

**Example:**
```
Corpus-wide: "neural" appears 500 times, "plasticity" appears 50 times, "the" appears 10,000 times
Query: "neural plasticity"

Section A: "neural" 5x, "plasticity" 3x
→ Score = (5/500)*10 + (3/50)*10 = 0.1 + 0.6 = 0.7

Section B: "the" 20x
→ Score = (20/10000)*10 = 0.02
```

**Pros:**
- Automatically weights important terms over common words
- No manual tuning needed
- Handles term importance at corpus level
- Mathematically grounded (well-studied in IR)

**Cons:**
- Requires preprocessing entire corpus upfront (expensive)
- Still doesn't handle synonymy
- Breaks when corpus is small (researcher with 10 papers = sparse statistics)
- Expensive to update incrementally (new paper = recalculate for all docs)
- Domain-dependent (in biology, "CRISPR" is common; in medicine, rare — same term, different importance)

**When to use:** Large, stable document collections (institutional repositories, published corpora). Too expensive for personal, evolving KBs.

---

## Strategy 4: Section Type Classification

**How it works:** Classify each section (Abstract, Intro, Methodology, Results, Discussion, Conclusion) and route queries intelligently.

**Example:**
```
Query: "What's the main finding?" → Intent: [empirical result]
  → Prioritize: Results, Conclusion sections
  → Also include: Discussion (limitations)
  → De-prioritize: Methodology, Introduction

Query: "How did they do it?" → Intent: [process/methods]
  → Prioritize: Methodology, Methods section
  → Also include: Materials, Experimental design subsections
  → De-prioritize: Abstract, Conclusion
```

**Pros:**
- Matches how researchers read papers (abstract first, then goal-dependent)
- Different queries get different section priorities
- Very effective for formal research papers
- Enables specialized retrieval logic per section type

**Cons:**
- Requires classifying every section (manual labor or ML classifier)
- Only works for formal papers; breaks for researcher notes, blog posts, scanned PDFs
- Different academic fields have different conventions (humanities ≠ STEM)
- Classification mistakes cascade (misclassify methodology → retrieve wrong sections)
- Doesn't handle cross-cutting concepts (e.g., "ontology" appears across multiple section types)
- Brittle: section reorganization breaks logic

**When to use:** Specialized research tool focused on one domain (e.g., biomedical papers). Too rigid for mixed-content knowledge bases.

---

## Strategy 5: Positional Bias

**How it works:** Weight sections by position; early sections (abstract, intro) get higher base scores.

**Example:**
```
Abstract (position 1): 1.5x multiplier
Introduction (position 2): 1.3x multiplier
Methodology (position 5): 1.0x multiplier
Discussion (position 8): 1.0x multiplier
```

**Pros:**
- Empirically, early sections in papers are usually more important
- Cheap to compute; just rank by position
- Aligns with researcher reading patterns (skim abstract first)

**Cons:**
- Arbitrary multipliers (why 1.5x? not 2x?)
- Wrong for targeted queries ("Give me the exact experimental protocol" → want Methodology, not Abstract)
- Over-penalizes late sections that might be crucial (Discussion often contains important synthesis)
- Fragile: researcher reorganizes sections → breaks
- Doesn't work for unstructured notes

**When to use:** Quick heuristic when structure is unknown. Rarely useful in isolation.

---

## Strategy 6: Query Intent Classification

**How it works:** Use NLP to classify *what the researcher is really asking*, then route to appropriate sections.

**Example:**
```
Query: "Can I use their data for my hypothesis?"
→ Intent detected: [Data availability + applicability]
→ Retrieve: Methods (what data), Results (what it shows), Data Availability statements

Query: "Why didn't this approach work?"
→ Intent detected: [Limitation/failure analysis]
→ Retrieve: Discussion (limitations), Results (negative findings), Conclusion
```

**Pros:**
- Deeply aligned with researcher cognition
- Handles paraphrasing ("Can I use their data?" vs "Is their dataset applicable?")
- Enables hyper-personalized retrieval (different researchers ask different types)
- Most useful for iterative research workflows

**Cons:**
- Requires ML/NLP; another component to build and maintain
- Fragile: misclassified intent → completely wrong results
- Intent can be ambiguous (exploratory search has unclear intent)
- Overfits to intent classifier; doesn't adapt to novel query types
- Expensive at scale (classify every query)
- Requires annotated training data (how do you label researcher intent at scale?)

**When to use:** Mature systems after product-market fit. Too complex and risky for early-stage.

---

## Strategy 7: Semantic/Embedding-Based Search

**How it works:** Embed query and all sections; retrieve by cosine similarity in embedding space.

**Example:**
```
Query embedding: "How does gene editing affect cellular function?" → [0.2, -0.5, 0.8, ...]

Section A embedding: [0.19, -0.48, 0.79, ...] → cosine similarity: 0.98 ✓ High
Section B embedding: [0.1, 0.3, 0.2, ...] → cosine similarity: 0.45
```

**Pros:**
- Handles synonymy ("CRISPR" = "gene editing" semantically)
- Phrase-level meaning ("cellular function" ≠ "cell" + "function")
- No manual feature engineering needed
- Naturally multi-document (all sections in one embedding space)
- State-of-the-art retrieval quality

**Cons:**
- Requires embedding API or local model (cost, latency, GPU)
- Embeddings are opaque (hard to debug "why ranked high?")
- Quality entirely dependent on embedding model (model upgrade = behavior change)
- Can't use until Phase 5 (requires semantic search implementation)
- May hallucinate relevance (embedding space can have false-match regions)
- Evaluating semantic search harder than keyword (no simple relevance metrics)

**When to use:** After keyword search foundation is proven. This is Phase 5 of this project.

---

## Strategy 8: Hybrid Multi-Signal Scoring

**How it works:** Combine multiple signals with weighted scoring.

```
final_score = (
    0.40 * query_density_score +
    0.20 * header_relevance_score +
    0.20 * section_type_match +
    0.15 * positional_weight +
    0.05 * section_length_normalization
)
```

**Pros:**
- Captures multiple retrieval signals
- Tunable: adjust weights based on what works
- Doesn't rely on any single signal
- Can be incrementally improved

**Cons:**
- Many hyperparameters; easy to overfit to current KB
- Harder to debug ("why ranked high?" → trace all 5 signals)
- Weights don't transfer across domains
- Requires explicit feature engineering for each signal
- Can give false confidence (high score from multiple weak signals > one strong signal)
- Maintenance burden: each signal has own bugs

**When to use:** After you have evidence that multiple signals help. Start simple; add complexity only when data justifies it.

---

## Comparison Table

| Strategy | Precision | Coverage | Scalability | Interpretability | Complexity |
|----------|-----------|----------|-------------|------------------|-----------|
| Keyword density | Medium | Low | Very High | Very High | Low |
| + Header relevance | High | Medium | High | High | Low |
| TF-IDF | High | Medium | Medium | Medium | Medium |
| Section type routing | Very High | Medium | Low | High | Medium |
| Query intent | Very High | Medium | Low | Low | High |
| Semantic (embeddings) | Very High | High | High | Low | Medium |
| Multi-signal hybrid | High | High | Medium | Low | High |

---

## Interview Question: "What Retrieval Strategy Would You Use?"

**What to say:**

> "It depends on constraints. For a startup with limited engineering:
>
> **Phase 1 (Now):** Start with hybrid header + content density. It's simple, improves on naive keyword search, works for formal documents, and researchers understand headers. You can implement it in a week.
>
> **Phase 2 (Prove value):** Add section-type hinting for formal papers. Manually tag 10-20 exemplar papers; use that to classify others. This targets researcher behavior better.
>
> **Phase 3 (Scale):** Semantic search with embeddings. Build on Phase 1 foundation; rerank semantic results using structural signals (headers, types).
>
> **But — important context:** LeapSpace (Elsevier's research tool) skipped the early phases and went straight to semantic search because they have the resources (18M+ papers, enterprise ML team). The lesson: context matters.
>
> **Key principle:** Start simple, measure what works, add complexity only when data justifies it—unless you have the resources and scale to do it right upfront."

**Real example:** LeapSpace uses deep semantic analysis and RAG parsing of full-text papers. That's Phase 3+ immediately. A startup would start at Phase 1.

---

## Key Takeaway

There's no single "best" strategy — it depends on:
- **Document types** (formal papers vs. unstructured notes)
- **Query patterns** (exploratory vs. targeted)
- **Scale** (10 documents vs. 1 million)
- **Time budget** (ship this sprint vs. next quarter)
- **Team** (data science team vs. single PM)

The progression from keyword → hybrid → semantic is natural and proven across industry.
