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

- **Search by meaning, or AI search, over everything saved** (quotes, excerpts, articles).
- **Project or job-ad preparation:** paste a job ad; get the relevant saved content mapped to each requirement.
- **Future phase (parked, not now):** merge the user's Claude Code learnings (`learnings.md`, `skills-learned.md`) into the library: "show me what I've done in {topic}", "everything related to this job ad".
- *Existing building blocks (fact check):* semantic search over notes (Search/Chat and MCP); `research_goal` (CLI only, in `scripts/chat.py`); `suggest_related` (service layer and MCP).

**Claude's ideas offered (Diverge, not recommendations):**
1. "Already saved something like this" marker on Today cards (novelty)
2. merge into an existing note at save time instead of duplicating
3. resurface saved gold weekly
4. quiz me from my highlights (teach-back)
5. topic brief on demand (`research_goal` on web and phone)
6. interview evidence pack: job-ad requirements × read / saved / built (with the skill map)
7. library hygiene: aged items and near-duplicates

*User reactions (15 Oct):* most don't excite them. **Only 4, "quiz me", is worth further discussion, later.** The others are dropped.

**Q2. When you save by hand today, how do you decide between the whole article, an excerpt, or just a quote?** (user, 15 Oct)
- **Too long:** save part of it only.
- **Only part of it is worth remembering:** save that part only.
- **Golden article, or a comprehensive insight or opinion on a topic:** save the whole.
- **Not new knowledge, but a really cool take worth reusing:** save just the quote.
- *Reading:* three save units (whole / excerpt / quote), chosen by value density and length. This matches the existing `type:` frontmatter (article / quote).

**Diverge complete (15 Oct).**

## Grill plan (frontier order)
- **Round 1 (done 17 Oct):** G1 library vs reading history (P7) · G2 how a save unit is chosen (P1, P2)
- **Round 1b (follow-ups):** G3 reading history, separate from the library? · G4 several highlights → one note or several; how quotes are told apart
- **Round 2:** storage, Git notes vs the database (P3; technical, so a recommendation up front) · tags (P5) · the "why" field (P4) · provenance (P6)
- **Round 3:** duplicates (P8) · how search results show saved parts vs the full source (P9) · is job-ad preparation in v1 or later?
- **Round 4, Converge:** v1 scope and non-goals, outcome and metric, ACs → spec → lock


## Grill round 1 answers (user, 17 Oct)
- **G1. What goes into the library: explicit Save only.** "Saving every article I marked Useful would be overkill." Save is a deliberate action, possibly a sub-option of Build/Learn; the button arrangement is settled in the parked button discussion after this grill.
- **G2. Highlight while reading, choose at Save.**
  - Highlight sentences or paragraphs while reading; you may not know yet what's worth keeping.
  - The **Save** button sits at the bottom of the article. It asks: **whole article, or only the highlighted paragraphs and sentences?**
  - **Every saved note links back to the original article.**

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
