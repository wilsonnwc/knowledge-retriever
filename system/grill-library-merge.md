# Library merge (R3): grill working notes

**Status:** Stage 1, Specify. **Step 1, Diverge** (started 2026-10-15). Format: the user's grill-me format, run by hand (see `show-ai-lab/system/session-log.md`, Session 5). It runs Diverge → Grill → Converge, then the spec's Outcome and ACs, then the lock.
**Spec (to be written at Converge):** `system/specs/YYYY-MM-DD-library-merge.md`.

## Facts gathered (Claude, 13–15 Oct)
- **Current library:** 28 curated notes (Git markdown + Chroma), median ~285 words, half under 300.
  - Types: article 16, book 6, quote 3, podcast 2.
  - Frontmatter: type, title, source, date, tags, author; `projects` on 10.
- **Today-page articles (Neon):** 280 with full text, median ~1,080 words. ~45 marked Useful so far, about 5 a day.
- **Search today:** Search/Chat and MCP (Claude Desktop) see the notes only.
- **The Jev spike (13 Oct)** found "already know it" is a frequent reason for Not useful. Catching it needs knowledge of the library and reading history.

## Inputs raised before the grill
- **User, 13 Oct:** don't blindly add full-page articles. The library holds whole articles, excerpts, highlights and quotes.
- **User, 15 Oct:** "Build sometimes doesn't reflect my desire just to save the page as it's useful." There's no "keep this" action today. (The wider button discussion is parked until after the library merge.)

## Diverge, round 1
**Q1. What do you want to do with a merged library that you can't do today?** (user, 15 Oct)
- **Keep the "gold" from daily reading for long-term reference.**
  - Among the Useful articles, some are gold on a topic, or practical skills worth keeping. The user wants to search and revisit them whenever they recall a topic, e.g. "best practice on stakeholder management".
  - **Today's pain:** copy-paste the whole article or part of it into the library, then hand-write a markdown file from the template (or with LLM help). Too much friction.
  - **Desired flow:**
    1. read
    2. highlight what I want to remember
    3. tap a button to add it to the library
    4. optionally fill in fields on *why* I want to remember it
    5. the content is copied into the library automatically, with **suggested tags and metadata**
    6. done

**Q2. When you save by hand today, how do you decide between the whole article, an excerpt, or just a quote?** *(open)*

## Parked follow-ups (for the Grill step; not asked yet)
- P1. Highlighting on a phone: select text in the reader, or tap whole paragraphs?
- P2. With nothing highlighted, does "add" save the whole article, or ask?
- P3. Where saved items live: notes in Git (as today) vs the database, and how both stay searchable (the Chroma vs pgvector question).
- P4. The "why I want to remember" field: free text, picked from options, or both? Is it searchable?
- P5. Suggested tags: the existing tags and topic folders only, or new ones allowed? Is the user's approval required (the plan's "propose, don't write")?
- P6. Provenance: link back to the original article and the digest day.
- P7. Do Useful articles that are *not* saved stay searchable in a separate "reading history" (for "have I read about X?" and novelty), or is the library only what's explicitly saved?
- P8. Saving the same article twice (two different highlights).
- P9. Search results: how a saved highlight and its full source article are shown together (citation unit vs retrieval unit).

## Grill-skill eval log ("Are you happy with this grill session?")
-
