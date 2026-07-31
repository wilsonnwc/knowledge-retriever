# Session Log

A running record of progress and learnings. Update this at the end of every working session before closing VS Code.

---

## How to use this file

At the end of each session, copy the template below and fill it in at the top of the **Sessions** section. Takes 5 minutes. Makes the next session 10x faster to restart.

### Template

```
---
### Session [N] — [Date]

**Phase/step completed:** 
**Where to pick up next:** 

**What worked:**
- 

**What didn't work / got stuck on:**
- 

**Learnings (context architecture or otherwise):**
- 

**Open questions to come back to:**
- 
---
```

---

## Sessions

*(most recent at the top)*

---
### Session 3 — 2026-07-31

**Phase/step completed:** Phase 1 complete (all setup steps). Phase 2 complete (system prompt written). Phase 3 complete (chat.py built and tested).

**Where to pick up next:** The system is live and working. Next steps: (1) add more notes to the knowledge base, (2) improve retrieval with semantic search if needed, (3) refine system prompt based on actual usage patterns.

**What worked:**
- Python dependencies installed without issues
- API key stored safely in .env
- System prompt customised with actual taxonomy — all 10 topics documented with clear skills/modes
- Chat script built with keyword search retrieval and Anthropic API integration
- First test query worked perfectly — found The Mom Test and Lean Startup notes, connected them thematically, surfaced a follow-up question
- Script handles multi-turn conversation history correctly

**What didn't work / got stuck on:**
- Initial model name was outdated (claude-3-5-sonnet-20241022 doesn't exist in current API). Fixed by using claude-opus-4-1-latest.
- Piped input mode exits with EOFError after first response (expected, not a real issue — script is designed for interactive terminal use).

**Learnings:**
- The keyword search is surprisingly effective for small knowledge bases. Top 5 matches by word frequency are relevant.
- Claude generates good "thinking partner" responses when you give it the full note context plus the system prompt with skills defined.
- The "Why this matters" field really does matter for context quality — helps the model understand which items were saved intentionally.
- API deprecation warnings appear but don't block execution.

**Open questions for next session:**
- Want to add semantic search for better retrieval? (Currently keyword-only.)
- Should we add a way to search by specific topic folder?
- Should responses be saved to a log file for reference?
- Ready to start bulk-importing more notes, or add features first?

---
### Session 2 — 2026-06-21

**Phase/step completed:** Phase 0 complete. Phase 1 Steps 1.1–1.3 complete. First real notes added.

**Where to pick up next:** Phase 1, Step 1.4 — set up Python. Open terminal in VS Code inside the `knowledge-retriever` folder and run `pip install anthropic python-dotenv`, then create `requirements.txt`.

**What worked:**
- Taxonomy finalised: 10 topic folders, 4 cross-cutting tags
- All 10 `notes/` subfolders created
- Note format settled: YAML frontmatter + blockquote for "Why this matters"
- `template.md` created in `notes/` — duplicate and delete options to create new notes
- Added `url` as a separate field for article sources (keeps `source` clean for display)
- Three real notes added: `the-mom-test.md`, `lean-start-up.md`, `pm-playbook-shipping-ai-features.md`
- `notes/` and `system/` moved into `knowledge-retriever/`, `plan.md` moved in too — project is now self-contained

**What didn't work / got stuck on:**
- Two notes (Mom Test, PM Playbook) were lost because VS Code hadn't saved them to disk before we renamed/moved them. Had to restore from conversation history.
- Fix: always press **Cmd+S** immediately after creating a new file, before doing anything else

**Learnings:**
- The `type` field is a single value — cannot be a list. Keep one file per source.
- Tags format: all inside one bracket `[tag1, tag2]` — not separate brackets per tag
- `quote` cannot be both a content type and a cross-cutting tag — they clash. Removed it from tags.
- Lazy annotation strategy: don't force "Why this matters" on bulk imports — let it fill in through use. Only required on `own-note` and `quote` types.
- For articles, split source and URL into separate fields so the display label stays clean

**Open questions for next session:**
- None blocking — ready to move to Phase 1.4 (Python setup)
---

---
### Session 1 — 2026-06-16

**Phase/step completed:** Full planning session — read NN/g Context Architecture article, designed and iterated the project plan, set up the system folder and session log, confirmed all content sources are covered.

**Where to pick up next:** Phase 0, Step 0.1 — design your taxonomy on paper (no VS Code needed). Decide your top-level topic folders before touching anything. Then Phase 0.2: confirm which content types you'll use.

**What worked:**
- Understood the core concept: context architecture = IA principles (structure, labelling, findability, memory) applied to AI systems
- Settled on a clean project approach: markdown files in folders as the knowledge base, keyword search first, semantic search later
- Confirmed all three content sources are covered: Kindle, Apple Notes, Instapaper

**What didn't work / got stuck on:**
- N/A — planning session only, no code

**Learnings (context architecture):**
- Context architecture is design work, not engineering work — naming, structure, and relationships are decided before any code is written
- The labelling problem is concrete: `credential-recovery-workflow` vs `reset-password` — system language must match user language or retrieval fails
- More context ≠ better results; models suffer from information overload just like people — structure and prioritisation matter as much as content
- The distinction between context engineering (pipelines, plumbing) and context architecture (structure, meaning, behaviour) — engineers build the infrastructure, architects define what lives on top of it
- Context is never neutral: every naming and structural decision shapes how the system interprets tasks and produces outputs
- Memory needs explicit rules: what to retain, how long, when to surface — without this, systems either forget critical things or surface irrelevant noise

**Open questions for next session:**
- What should my taxonomy look like? Start broad (8–10 folders) and resist the urge to go narrow
- Which of my existing notes are worth adding as the first 10 seed items?
- What's my honest "Why this matters" discipline going to be — will I actually write it for every item?
---
