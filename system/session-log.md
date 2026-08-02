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
### Session 6 — 2026-08-02 (continued from Session 5)

**Phase/step completed:** Phase 3.5 — evaluated keyword search baseline. Expanded test set to 28 queries (14 specific + 14 vague pairs). Ran evaluation, found and fixed 3 stacked bugs (eval scoring logic, test data errors, tokenization), corrected the baseline from a raw 18% to a trustworthy 82% precision@5. Wrote full diagnosis of the 5 remaining genuine failures. Test set is now locked ahead of Phase 4.

**Where to pick up next:** Phase 4 — implement semantic search (embeddings), re-run the same locked 28-query test set, compare precision@5 before/after.

**What worked:**
- Walking backwards through the eval process one step at a time (review test set → run → analyze → diagnose) instead of batch-producing results caught problems that would have been missed otherwise
- Treating a suspiciously bad number (18%) as a prompt to debug the measurement itself, not just the system — this uncovered 3 real bugs, not retrieval failures
- Grepping actual file content to verify expected_source values against ground truth, instead of trusting what was written when the test set was first drafted

**What didn't work / got stuck on:**
- Eval script's match check treated `"X or Y"` expected_source values as one literal substring — could never match any filename (affected 16/23 original failures)
- Several `expected_source` values referenced folder names (`stakeholder-management`, `product-strategy`) or files that didn't exist (`good-strategy-bad-strategy`) instead of real filenames
- `search_notes()` tokenizer didn't strip punctuation — `"goals?"` never matched `"goals"` in content, silently discarding the most meaningful word in several queries
- A few dead placeholder options (leftover folder names, `"any"`) remained in the test set after the first cleanup pass and needed a second audit to catch

**Learnings:**
- **A bad eval number is a prompt to debug the measurement, not just the system.** 18% looked like proof keyword search didn't work; the true, bug-free baseline was 82%. Trusting the first number would have produced the wrong conclusion.
- **Design choice vs. method limitation is worth distinguishing precisely.** Keyword search *can* use metadata (Google, Elasticsearch, email search all do) — this implementation just didn't, as a deliberate simplicity choice for a clean baseline.
- **Test set correctness is itself a design decision.** `expected_source` values must reference real filenames (not folders, not imagined files), and fixing them only after seeing failures needs to be done transparently (grounded in file content, not adjusted to make numbers look better) and the set explicitly locked before the next comparison.
- Full bug-by-bug detail lives in `system/interview-prep/03-three-bugs-that-hid-the-baseline.md`; compressed cross-project version in `/Users/wilsonnwc/Tech/AI/learnings.md`.

**Open questions to come back to:**
- Phase 4: does semantic search close the 5 remaining gaps (Q4, Q5, Q6, Q9, Q9b) — all synonymy/phrasing gaps in nature?
- Should MRR be added as a second metric alongside precision@5 before comparing keyword vs. semantic, since ranking position (not just top-5 presence) matters for some of the near-miss queries (e.g. Q10 found at rank 5)?
- Worth doing a personal teach-back (explaining the 3 bugs unprompted, without notes) before using this as an interview story — deferred until closer to actual interview prep.

---
### Session 5 — 2026-08-02 (continued from Session 4)

**Phase/step completed:** Consolidated Design of Everyday Things into single file; defined precise tagging rules; planned semantic search chunking strategy; fixed critical retrieval bug; tested system end-to-end.

**Where to pick up next:** Knowledge base is now live and functional with 24 consolidated notes. Ready for: (1) ongoing bulk imports using new agent instructions, (2) semantic search implementation (Phase 5), (3) evaluation/measurement against the LeapSpace job requirements.

**What worked:**
- Section-aware retrieval fix works — consolidated files now surface their actual content, not just YAML frontmatter
- Haiku model is fast and capable enough for this use case
- System synthesizes well across multiple notes (e.g., combining Mom Test + Product Sense insights)
- Testing revealed a critical bug (good timing before deployment)
- Job ad context (LeapSpace) directly maps to this project's RAG challenges

**What didn't work / got stuck on:**
- Initial 15-line preview truncation was breaking retrieval for large consolidated files — caught by testing, not by design review
- Model name in script was outdated (claude-opus-4-1-latest doesn't exist)

**Learnings:**
- **Testing catches what design doesn't.** Spent entire session optimizing file structure and taxonomy *without* running a single query. As soon as we tested, a critical bug surfaced (truncated previews). This is exactly the trap the project's own principle warns against: "evaluation must be measured and scored, not qualitative."
- **The chunking strategy works bidirectionally.** Section-aware retrieval for keyword search is exactly the prep work semantic search needs. We're not building two separate systems; the section discipline serves both.
- **Tagging precision prevents drift.** Moving from vague definitions ("foundational = important stuff") to testable rules ("foundational = what a senior PM aspiring to principal should know and execute daily") makes multi-session consistency possible.
- **Job context sharpens decisions.** LeapSpace's job requirements (RAG, chunking, researcher knowledge bases, evaluation of AI reasoning) directly validated which problems in this project matter most. The retrieval bug we just fixed is the exact class of problem LeapSpace solves.

**Open questions to come back to:**
- When implementing semantic search (Phase 5), should we chunk exactly at `##` boundaries, or with overlap? (overlapping chunks provide continuity but increase embedding volume)
- What's the target retrieval quality for this system — precision (few false positives), recall (find all relevant content), or a balance? Needs measurement before/after semantic search.
- Should we add response logging to track which queries work well and which fail? (This data would be valuable for Phase 5 evaluation)

---
### Session 4 — 2026-08-02

**Phase/step completed:** Phase 4 — Bulk knowledge base population. Added 34 notes from key PM/design books and frameworks. Knowledge base now at 37 total notes.

**Where to pick up next:** Test the chat system with expanded knowledge base, then upgrade to semantic search with Chroma + embeddings for better retrieval (the planned next phase).

**What worked:**
- Batching notes (10–13 at a time) is vastly more efficient than one-by-one
- Lazy annotation strategy confirmed: don't force "Why this matters" upfront; let it fill in through use
- Clear taxonomy structure makes it easy to organize diverse content
- Sourcing is flexible — can handle exact sources or "unknown" and update later
- Claude can quickly organize unstructured quotes into structured notes with frontmatter

**What didn't work / got stuck on:**
- None — straightforward session

**Learnings:**
- Batch operations compound time savings dramatically. 34 notes in one session vs. 34 sessions.
- Note quality doesn't suffer from speed; frontmatter discipline (YAML structure) enforces consistency automatically
- Source tracking can be lazy too — users naturally remember or find sources later when notes matter
- The keyword search system is ready to test; no need to wait for semantic search to validate the concept

**Open questions to come back to:**
- When you test the chat, which queries surface the most relevant notes? Which miss?
- Should we implement topic-folder filtering in the chat interface?
- What's the exact failure mode of keyword search vs. semantic search? (Will inform whether the upgrade is needed)
- Shall we refactor the chat.py to add response logging?

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
