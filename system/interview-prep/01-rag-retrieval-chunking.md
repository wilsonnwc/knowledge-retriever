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

> **Analogy:** Imagine you filed an entire book under one folder tab labeled "Design of Everyday Things" — great for a human browsing a filing cabinet, since everything about the book lives in one place. But if a librarian only ever reads the *label on the tab* before answering a question, they'll say "we have nothing on error handling," even though it's on page 40 of the very book sitting right there. The book was filed correctly; the *lookup process* just never opened it past the cover.

**Root Cause:** The retrieval pipeline was truncating file previews at 15 lines — essentially just the YAML metadata and intro sentence. For large consolidated files, that meant Claude never saw the actual content.

**What I Did:** I switched from naive line-count truncation to section-aware retrieval. Instead of pulling first 15 lines, I pull the full frontmatter, intro paragraph, and the first complete `## Section` (up to the next section header or ~120 lines). This respects the structural boundaries we'd designed into the files.

> **Plain-English restatement:** Instead of a lazy "just read the first page and stop" rule, the system now says "read the whole first chapter, not just the cover page." A `##` header in a note is like a chapter heading — it marks a natural stopping point where one complete idea ends, so cutting there (instead of at an arbitrary line count) means you never get a half-finished thought.

**Why That Approach:** Three reasons:
1. **Honors intended structure** — We designed files with `##` section headers as semantic boundaries. Using those boundaries for retrieval respects that design.
2. **Preps for semantic search** — Chunking at `##` headers (not arbitrary line counts) is exactly how we'll chunk for embeddings in Phase 5. Building this discipline now means no rework later.
3. **Balances precision and context** — Pulling one full section gives Claude enough content to reason about; stopping before the second section prevents information overload.

> **Why this matters for interviews:** All three reasons boil down to one design principle — *the unit you retrieve should match the unit the human author actually meant as "one idea."* A `##` header is the author saying "this is a new topic now." Retrieving along that line, instead of an arbitrary line count, means the system's behavior lines up with the document's own logic rather than fighting it.

**What I Learned:** Testing revealed what design review didn't catch. I'd spent a session optimizing file structure and taxonomy without running a single query. As soon as I tested, a critical bug surfaced. This taught me the project's own principle: "Never move to the next step without measuring whether the current one works." Structure work feels productive but can be a form of procrastination on evaluation.

> **Analogy:** This is like spending a week reorganizing a kitchen — alphabetizing spices, relabeling drawers — without ever actually cooking a meal in it. The kitchen *looks* better organized, but you don't find out a drawer doesn't open all the way until you try to use it mid-recipe. Design review is admiring the kitchen; testing is cooking in it.

> **Learning:** "Looks well-designed" and "works when used" are two different questions, and the first one is much easier to feel good about — which is exactly why it's tempting to stop there. For an AI PM, this generalizes directly: a prompt or retrieval pipeline can look clean in a design doc and still fail the moment a real query hits it. Ship something testable before polishing the structure around it.

---

## Harder Follow-Up Questions

### Follow-Up 1: "What if sections are 300+ lines long, like in research papers? Is your 120-line cap still right?"

**Your answer:**
"Good catch — it's not. The 120-line cap is a local optimization for my small notes. For research papers, a fixed cap doesn't scale.

The better approach is query-aware retrieval: instead of pulling the first section, I'd rank *all* sections by how many query words they contain, then pull the top 3-5 most relevant sections (up to a token budget). This way, if a researcher queries 'experimental design,' the system finds the Methodology section, not whatever happens to be first.

> **Analogy:** My current approach is like always reading the first chapter of a book no matter what you asked about. Query-aware retrieval is like using the index at the back of the book to jump straight to the pages that mention your topic — you don't read front-to-back, you read what's relevant.

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

> **Why this matters for interviews:** Saying "I built a fix" and saying "I proved the fix works" are two different claims, and only the second one is evidence. It's an easy line to blur — the fix *feels* obviously better because it's more thoughtful. But "more thoughtful" isn't the same as "measured better." This project's own Phase 3.5 story (see the companion doc on the three hidden bugs) is a good real example of why: the first instinct ("keyword search is bad") turned out to be wrong until it was actually measured.

---

## Key Phrases to Use

- **"Section-aware retrieval"** — Shows you think about document structure. Plain version: "I retrieve by the document's own natural chapter breaks, not an arbitrary line count."
- **"Chunking strategy"** — Standard RAG term; signals you know the landscape. Plain version: "How you slice a document up before feeding it to the system."
- **"Citation unit vs. retrieval unit"** — Shows you think about different layers of a system. Plain version: the *whole book* is the right unit for citing a source to a human ("this came from Design of Everyday Things"), but a single *section* of that book is the right unit for finding an answer — they don't have to be the same size.
- **"Semantic boundaries"** — More sophisticated than "sections" — shows structural thinking. Plain version: a break point in the text that lines up with where one *idea* ends and another begins, as opposed to a break point that's just "N lines later" with no regard for meaning.

> **Why this matters for interviews:** Using precise vocabulary ("section-aware retrieval," "citation unit vs. retrieval unit") signals fluency, but only if you can immediately unpack it in plain English when asked "what does that mean?" Interviewers are testing for understanding, not memorized jargon — pairing each term with its plain-English version (as above) is what actually proves you understand it.

---

## What LeapSpace Actually Built (Updated)

**Important context for interviews:** LeapSpace isn't using hybrid header + content density (my initial prediction). They've built:
- **Semantic search with RAG** — using embeddings, not keyword matching
- **Daily-updated KB** of 18M+ research papers
- **Multi-agent reasoning** across papers (Deep Research Mode)
- **Trust Cards** — every AI sentence is cited with explanation

This means they jumped straight to Phase 5 (semantic search), not Phase 1. Why? **Scale + resources.** Elsevier can afford semantic search from day 1; a startup can't.

> **Analogy:** Think of it like transportation choices at different budgets. If you're moving across town by yourself, walking (keyword search) is fine — cheap, simple, gets the job done. If you're a logistics company moving freight nationwide, you build a trucking network from day one (semantic search) — walking was never going to scale to your actual problem. Neither choice is "wrong"; each fits the size of the job.

**Interview angle:** "I predicted they'd start simple, but LeapSpace's constraints are different. They have the engineering team, the data, and the need for precision. So semantic search from day 1 makes sense for them. The lesson: context matters. Choose the approach that fits your constraints."

> **Learning:** A common trap in interviews is presenting your own approach as "the right way" in the abstract. The stronger answer names the *constraint* that made your approach right for you (small personal KB, no engineering team, learning project) and explains why a different constraint (18M-paper corpus, dedicated ML team, precision-critical use case) would justify a different choice. This shows you reason about tradeoffs rather than defending a single tool as universally best.

This shows: you understand both keyword search AND semantic search, and you can reason about when to use each.

## Related Topics

- **Semantic search (Phase 5)** — Chunking strategy evolves when you add embeddings; the same `##`-header logic used here for keyword retrieval becomes the chunking unit for embeddings later (see file 04 for that briefing)
- **Knowledge base organization** — Taxonomy, consolidation vs. fragmentation; i.e., the human-readability side of the same tension this whole doc is about
- **Evaluation discipline** — How to measure whether retrieval actually works, instead of trusting that a fix "feels" better (see file 02)
- **LeapSpace-specific retrieval** — How to handle research papers specifically, where sections can run 300+ lines and a fixed line cap breaks down (see Follow-Up 1 above)
- **RAG in production** — Moving from keyword → semantic search with proper evaluation, i.e. never swapping techniques without a before/after number to justify it

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

---

**Big picture:** The whole story here is one idea in different clothes — retrieval only works if the chunk of text you hand back matches the chunk of *meaning* the author intended, and the only way to know if it actually does that is to test it, not just to design it well on paper.
