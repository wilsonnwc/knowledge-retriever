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

## The Answer: Default to Consolidate

**Keep one file per authoritative source** unless the source covers genuinely independent use cases.

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

---

## Why Consolidate Works Better

### For Interview Prep (your use case):
✓ Enables proper citation: "As Don Norman argues in Design of Everyday Things..."
✓ Preserves the author's narrative and argument structure
✓ One "Why this matters" captures the source's value, not per-section
✓ Shows you've deeply engaged with the source, not just cherry-picked quotes

### For Retrieval:
- Keyword search: Multiple smaller files are more precise BUT...
- Semantic search (upcoming): A naive whole-file embedding would dilute retrieval accuracy for multi-topic files — **this is resolved by chunking at the `## Section Header` level at embedding time, not by re-splitting files today.** See `system/semantic-search-chunking-plan.md` for the full reasoning (this is the "parent-child chunking" pattern used in production RAG systems: file = citation unit, section = retrieval unit).
- Future you: When you need to reference the source, one file is easier to find than 14 scattered files

### For Knowledge Base Quality:
✓ Reflects the actual structure of the source material
✓ Avoids false fragmentation of coherent thinking
✓ Easier to maintain (update once, not 14 times)
✓ Cleaner citation trail

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
