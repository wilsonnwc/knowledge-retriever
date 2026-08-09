---
name: split-vs-consolidate-guide
description: Decision framework for splitting multi-topic sources into separate files vs. keeping them consolidated
metadata:
  type: project
---

# Split vs. Consolidate Decision Guide

## The Problem
When importing books or long articles with multiple topics, should we:
1. **Consolidate** — one file per authoritative source, organized by theme
2. **Split** — separate files for each distinct topic/section

> **Analogy:** Think of a book like "Design of Everyday Things" as a single interview you did with an expert. You wouldn't chop the transcript of that interview into 14 separate index cards scattered across different drawers just because the expert talked about several sub-topics — you'd keep the interview together as one document, because that's what lets you say "in my interview with Don Norman, he explained X, then connected it to Y." Splitting the transcript apart destroys the ability to show the *connections* the expert was making.

## The Answer: Default to Consolidate

**Keep one file per authoritative source** unless the source covers genuinely independent use cases.

> **Why this matters:** This isn't just a filing preference — it directly trades off two things that pull in opposite directions: making content *easy for a search algorithm to match precisely* (which favors small, single-topic files) versus making content *easy for a human to cite and trust* (which favors one coherent file per source). The rest of this guide explains why, for this project's actual goal (interview prep, where you need to *cite* sources credibly), the human-facing need wins by default — and how a separate technique (chunking, not file-splitting) solves the machine-facing need without sacrificing that.

---

## Decision Tree

### ✓ Keep as ONE FILE if:
- Single author/source with a unified thesis
- All sections support each other (interconnected narrative)
- User would want to cite the source as a whole ("Design of Everyday Things says...")
- Sections belong together conceptually (all about strategy, all about shipping, all about interviews)
- Interview context: source expertise is cohesive across topics

**Examples:**
- Design of Everyday Things (Don Norman) — unified theory of design across principles, psychology, patterns, and systems
- PM Playbook for Shipping AI Features — all sections needed to understand shipping AI
- The Mom Test — one methodology with multiple techniques
- Product Management in Practice — sections on communication/strategy/leadership belong together

### ✗ Split into MULTIPLE FILES if:
- Source covers truly independent methodologies or frameworks
- Topics would be queried separately and retrieved independently
- No underlying narrative connecting the sections
- Each section is self-contained and useful standalone

**Examples:**
- Only if a source had "Chapter 1: Sales Strategy" AND "Chapter 2: Machine Learning Basics" with no connection

> **Analogy:** This is the rare case where the "interview transcript" is actually *two unrelated interviews stapled together* — say, one half about sales tactics, the other half about a completely unrelated coding tutorial. In that case, keeping them stapled together doesn't preserve any real narrative connection; it just makes both halves harder to find. That's when splitting is the right call — but notice how rare this actually is for a single-author book or article, which almost always has some connecting thread even across chapters.

---

## Why Consolidate Works Better

### For Interview Prep (your use case):
✓ Enables proper citation: "As Don Norman argues in Design of Everyday Things..."
✓ Preserves the author's narrative and argument structure
✓ One "Why this matters" captures the source's value, not per-section
✓ Shows you've deeply engaged with the source, not just cherry-picked quotes

> **Why this matters for interviews:** An interviewer can tell the difference between "I remember a quote about error messages" and "Don Norman's whole argument is that good design anticipates human error — his point about error *messages* is really just one instance of that bigger principle." The second answer only works if you kept the source's throughline intact instead of chopping it into disconnected trivia.

### For Retrieval:
- Keyword search: Multiple smaller files are more precise BUT...
- Semantic search (upcoming): A naive whole-file embedding would dilute retrieval accuracy for multi-topic files — **this is resolved by chunking at the `## Section Header` level at embedding time, not by re-splitting files today.** See `system/semantic-search-chunking-plan.md` for the full reasoning (this is the "parent-child chunking" pattern used in production RAG systems: file = citation unit, section = retrieval unit).
- Future you: When you need to reference the source, one file is easier to find than 14 scattered files

> **Analogy:** This is the same "citation unit vs. retrieval unit" split as a library book: the *book* is what you cite ("as discussed in Design of Everyday Things"), but a librarian searching for a specific fact still flips to the *right page*, not the whole book. Chunking is how the system flips to the right page internally — it doesn't require the library to shred the book into loose pages first.

### For Knowledge Base Quality:
✓ Reflects the actual structure of the source material
✓ Avoids false fragmentation of coherent thinking
✓ Easier to maintain (update once, not 14 times)
✓ Cleaner citation trail

> **Why this matters:** "Easier to maintain" isn't abstract — if you later realize you mis-transcribed a Don Norman quote, one file means one fix. Under the old 14-file structure, the same fix (if the same idea happened to be repeated across files) could mean hunting through five different topic folders to catch every copy.

---

## Practical Steps When Importing

**Before you create files, ask yourself:**

1. **Is this one authoritative source?** (book, article, essay, newsletter post)
   → Yes: keep as one file

2. **Does it have a unified thesis or methodology?**
   → Yes: keep as one file

3. **Would I want to cite this as a whole?**
   → Yes: keep as one file

4. **Are the topics truly disconnected?** (rare)
   → Yes: split into 2-3 files max, grouping by theme

**Internal Organization (for large files):**
- Use `## Section Headers` to group related concepts
- Organize by theme, not by book chapter
- Each section should have its own `> **Why this matters:**` line
- Add one final comprehensive `> **Why this matters (overall):**` at the end

---

## Anti-Pattern Alert

❌ **DON'T DO THIS:**
- One file per quote from the same source
- Spreading quotes from one author across 10 different topic folders
- Creating "five-whys.md" AND "seven-stages-of-action.md" from the same book just because they fit different topics

✓ **DO THIS INSTEAD:**
- One file: "design-of-everyday-things.md" with all concepts organized by theme
- All concepts from one source in one place
- Topic folders still organize your KB, but by real topic, not by fragmentation

> **Analogy:** The anti-pattern is like ripping every highlighted sentence out of a book and filing each one under a different subject tag, then throwing away the book itself. You end up with a pile of quotes with no memory of which book they came from or how the author connected them — technically "organized," but you've destroyed the thing that made the source valuable in the first place.

---

## Exception: When to Split

Split ONLY when:
1. The source covers genuinely independent domains (e.g., biology AND architecture in one article)
2. Different parts would be used separately (e.g., "Case Studies" could be separated from "Theory")
3. File length becomes unmanageable (>150 lines) AND there's no narrative connection

If you do split:
- Group by theme (not by quote)
- Create 2-3 files max, not 10
- Keep the source attribution in all files
- Ensure each file is independently useful

---

## Implementation Checklist

When bulk-importing a book or article:
- [ ] Identify the author/source
- [ ] Determine if it has a unified thesis
- [ ] Check: would I cite this as a whole?
- [ ] If yes: create ONE file, organized by theme
- [ ] Use `##` headers to separate sections
- [ ] Use `> **Why this matters:**` for each theme group
- [ ] Add final summary `> **Why this matters (overall):**` at the end
- [ ] Tag appropriately (job-application if relevant)
- [ ] Commit with a message referencing the source

---

## Case Study: Design of Everyday Things Consolidation

**Mistake:** Created 14 separate files from one book:
- affordances-signifiers.md, conceptual-models.md, error-messages.md, good-enough.md, human-centered-design.md, request-for-confirmation.md (design/)
- cognition-emotion.md, flow-state.md, human-error.md (vibe-coding/)
- five-whys.md, seven-stages-of-action.md (discovery/)
- swiss-cheese-model.md, resilience-engineering.md (leadership/)
- checklists.md (product-organisation/)

**Problem:** 
- One source scattered across 5 topic folders
- Can't cite coherently
- Lost the narrative thread
- Hard to maintain

**Fix:** Consolidated into ONE file: design-of-everyday-things.md
- Organized into 4 themes: Fundamentals, Psychology, Patterns, Systems
- All concepts together, easy to cite
- One "Why this matters" summary
- 24 notes instead of 37

**Lesson:** Default to consolidate. Fragment only when truly justified.

> **Big picture:** The recurring mistake here wasn't "bad organizing" — it was solving a retrieval problem (small files match search queries more precisely) using a filing decision (splitting files), when the actual right tool for that problem is chunking at embedding time, not splitting at file-creation time. Keep the human-facing structure (one file per source) and let the machine-facing structure (chunks) live separately underneath it.
