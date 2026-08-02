---
name: rag-retrieval-chunking
description: RAG retrieval and chunking tradeoffs — interview prep from knowledge-retriever project
metadata:
  type: reference
---

# Topic: RAG Retrieval & Chunking Tradeoffs

## Likely First Question

**"Tell me about a time you had to make a tradeoff between system coherence and AI retrievability. How did you think through it?"**

Or: **"Walk me through how you'd design retrieval for a knowledge base containing long research documents."**

Or: **"What did you learn about chunking when you built your RAG system?"**

---

## Your Answer (Based on Knowledge-Retriever Project)

**[2-3 minute answer]**

I built a personal knowledge base using RAG principles, and I ran directly into a classic tradeoff: how to organize knowledge for humans vs. how to organize it for AI retrieval.

**The Problem:** I was consolidating research articles and books into single files for coherence — so I could cite "Design of Everyday Things" as one unified source, not 14 scattered quotes. This made sense for human reading and citation. But when I tested the retrieval system, Claude said "I don't have content on error handling" even though the Design of Everyday Things file had an entire section on it.

**Root Cause:** The retrieval pipeline was truncating file previews at 15 lines — essentially just the YAML metadata and intro sentence. For large consolidated files, that meant Claude never saw the actual content.

**What I Did:** I switched from naive line-count truncation to section-aware retrieval. Instead of pulling first 15 lines, I pull the full frontmatter, intro paragraph, and the first complete `## Section` (up to the next section header or ~120 lines). This respects the structural boundaries we'd designed into the files.

**Why That Approach:** Three reasons:
1. **Honors intended structure** — We designed files with `##` section headers as semantic boundaries. Using those boundaries for retrieval respects that design.
2. **Preps for semantic search** — Chunking at `##` headers (not arbitrary line counts) is exactly how we'll chunk for embeddings in Phase 5. Building this discipline now means no rework later.
3. **Balances precision and context** — Pulling one full section gives Claude enough content to reason about; stopping before the second section prevents information overload.

**What I Learned:** Testing revealed what design review didn't catch. I'd spent a session optimizing file structure and taxonomy without running a single query. As soon as I tested, a critical bug surfaced. This taught me the project's own principle: "Never move to the next step without measuring whether the current one works." Structure work feels productive but can be a form of procrastination on evaluation.

---

## Harder Follow-Up Questions

### Follow-Up 1: "What if sections are 300+ lines long, like in research papers? Is your 120-line cap still right?"

**Your answer:**
"Good catch — it's not. The 120-line cap is a local optimization for my small notes. For research papers, a fixed cap doesn't scale.

The better approach is query-aware retrieval: instead of pulling the first section, I'd rank *all* sections by how many query words they contain, then pull the top 3-5 most relevant sections (up to a token budget). This way, if a researcher queries 'experimental design,' the system finds the Methodology section, not whatever happens to be first.

I haven't implemented that yet because my knowledge base is small enough that the current approach works. But I know it's a limitation, and I'd add it before deploying to real researchers with large document sets."

### Follow-Up 2: "How would you evaluate whether your retrieval strategy actually works?"

**Your answer:**
"This is what I *didn't* do yet, which is a gap I should acknowledge.

Right approach: define what 'works' means first. For researchers, that might be:
- **Precision:** Did every retrieved section contain relevant content? (False positives waste time)
- **Coverage:** If the relevant section exists, did we retrieve it? (False negatives frustrate discovery)
- **Ranking:** Did we rank the most relevant section first?

I'd measure this by:
1. Creating a test set: 10-15 realistic researcher queries with manually-marked correct sections
2. Running retrieval and recording which sections were retrieved and in what order
3. Measuring precision/recall against the test set
4. Before/after: comparing my new section-aware approach against naive keyword search

I built the fix but didn't measure the improvement yet. That's next — can't claim the fix worked until I've measured it."

---

## Key Phrases to Use

- **"Section-aware retrieval"** — Shows you think about document structure
- **"Chunking strategy"** — Standard RAG term; signals you know the landscape
- **"Citation unit vs. retrieval unit"** — Shows you think about different layers of a system
- **"Semantic boundaries"** — More sophisticated than "sections" — shows structural thinking

---

## Related Topics

- **Semantic search (Phase 5)** — Chunking strategy evolves when you add embeddings
- **Knowledge base organization** — Taxonomy, consolidation vs. fragmentation
- **Evaluation discipline** — How to measure whether retrieval actually works
- **LeapSpace-specific retrieval** — How to handle research papers specifically

---

## Reference Materials

- `system/retrieval-strategies-reference.md` — Deep dive on 8 different retrieval strategies
- `system/semantic-search-chunking-plan.md` — Why section-aware chunking prepares for embeddings
- `scripts/chat.py` — The actual implementation (lines 36-65, the `search_notes()` function)
- Session 5 commit: "Fix retrieval preview to respect section boundaries"

---

## What NOT to Say

❌ "I just picked 120 lines randomly"  
✓ Instead: "I chose section boundaries because they're semantic units in the document"

❌ "Keyword search is obviously bad compared to semantic search"  
✓ Instead: "Keyword search is fast and interpretable; semantic search is coming in Phase 5, but I'm proving value with keywords first"

❌ "I tested it once and it works"  
✓ Instead: "I tested it on 4 realistic queries; the system now retrieves content. But I haven't formally measured precision/recall yet"

---

## Interview Narrative Flow

**If asked about RAG:** Start here.  
**If asked about tradeoffs:** Emphasize "citation unit vs. retrieval unit" — shows sophisticated thinking.  
**If asked about evaluation:** Honestly say "I built it but haven't measured it yet. Here's how I *would* measure it..."  
**If asked about scale:** "My approach works for my KB but needs refinement for 10,000+ documents. Here's what I'd change..."
