# Knowledge Retriever — Project Context

## Git workflow

Always commit and push directly to `main`. Do not create feature branches. This is a solo personal project.

## On every new session: read context first

Before doing anything else, read `system/session-log.md` (most recent entry only).
Then greet the user with:
- Current status of the project
- Recommended next step
- One open question from the last session log if relevant

Do not ask the user to explain the project. Lead with context, then ask how they want to proceed.

---

## Build workflow: spec-driven development (every build, from 2026-10-08)

The rule is **global** (every project). It lives in `system/global-claude/rules.md`:
- Section 1 covers spec-driven development: sizing, the stages, coaching, change control and the retro.
- Section 2 covers agents in the build pipeline.

On a laptop, `system/global-claude/install.sh` imports it into `~/.claude/CLAUDE.md`.

**If those global rules aren't already in your context** (e.g. a cloud session), read `system/global-claude/rules.md` before starting any build. Also read `system/global-claude/agent-pipeline.md` at Plan on a Full build.

Specifics for this project:
- **Specs** live in `system/specs/YYYY-MM-DD-<slug>.md`, copied from `system/global-claude/spec-template.md`. Index each one in `system/specs/README.md`, which is the portfolio.
- **First example:** `system/phase2a-spec.md` (Session 43) predates the framework. It's indexed but stays where it is.
- **Cross-references:** session log entries and Current Status point to the spec rather than repeating it.

---

## Where to Find Learnings & Deeper Analysis

- **Cross-project learnings (short, interview-ready bullets):** `../learnings.md` (project root's parent directory) — see the "Knowledge Retriever" section. This is the fastest way to recall what was learned without re-reading full write-ups.
- **Deeper technical write-ups (this project only):** `system/interview-prep/*.md` — one file per topic, written to be read cold before an interview. Includes the full story of the 18%→82% keyword search debugging journey (`03-three-bugs-that-hid-the-baseline.md`).
- **Raw evaluation data and full diagnosis:** `system/evaluation/DIAGNOSIS.md` — the complete technical detail behind any evaluation number quoted elsewhere (test set, script, root causes).
- **Session-by-session history:** `system/session-log.md`.

When starting a new session or resuming after a break, check `learnings.md` first for a quick recall, then go to `system/interview-prep/` or `system/evaluation/DIAGNOSIS.md` if more depth is needed.

---

## What This Is

A RAG system over personal saved articles, notes, and reading.
Goal: ask natural language questions and get relevant passages back from a personal knowledge base.
Built as a hands-on learning project to develop RAG experience for a PM job interview.

## Current Status

- **Phase 1–3:** Complete. 28 real notes indexed across 10 topic folders.
- **Phase 3.5:** Complete. Keyword search evaluated against 28 test queries — corrected baseline is **82% precision@5** (see "Where to Find Learnings" below for why the first raw result was 18%, and what that taught us).
- **Phase 4:** Complete. Semantic search (OpenAI `text-embedding-3-small` + Chroma) built and evaluated on the same locked 28-query set — **96% precision@5** vs. 82% keyword baseline. See `system/session-log.md` Session 10.
  > **Plain-English translation:** "Precision@5" means "of the top 5 results a search returns, what fraction were actually relevant?" A perfect 100% would mean every single one of the top 5 results was a good match. Semantic search landing near-perfect (96%) versus keyword search's 82% is the concrete evidence that matching by *meaning* beats matching by *literal words* for this note collection.
- **Phase 5 (Project Spaces):** Complete. `projects:` frontmatter field (many-to-many), `system/projects.md` registry, `--new-project`/`--archive-project` lifecycle, `--project` filter on both search functions. See `system/session-log.md` Session 12. Currently one real active project (`leapspace-interview-prep`) — not artificially expanded to more, per the decision not to force test data that doesn't reflect real use.
- **Phase 6 (Layer 3 taste — related notes, write-time + read-time):** Complete. `--suggest-related <note-path>` compares a note against every embedded note, ranks by best-matching-chunk-per-note, groups results by shared project. Write-time: wired as an ask-first step in the bulk-import workflow, offered only when the new note has a `projects:` tag (Session 13). Read-time: `chat()` now asks "Check for notes related to '<top note>'?" after every answer and runs the same function on demand (Session 14). Deliberately covers only one slice of "living knowledge base" (finding-to-finding connections) — not staleness detection or categorization. Session 13 found and fixed a real distance-metric bug (Chroma defaults to L2 distance, not cosine). Session 14 found and fixed a real retrieval-truncation bug in keyword search, live, from a real test question.
- **Retrieval:** `search_notes_semantic()` is the only search function wired into `chat()` (Session 14) — semantic search structurally can't have the truncation bug keyword search had, since `embed.py` already chunks by `##` section at embed-time. `search_notes()` (keyword) is intentionally kept, untouched, as the measured baseline `run_evaluation.py` compares against (82% vs. 96% precision@5) — retired from live use, not deleted.
- **Interface:** CLI chat via `scripts/chat.py`. Needs its own virtual environment (`.venv/`, created Session 14) activated before running — see `system/session-log.md` Session 14 for why (this had no isolated environment until a work-laptop `ModuleNotFoundError` surfaced the gap).
- **Phase 7 (Layer 4 taste — goal-oriented research):** Complete and confirmed working end-to-end (Session 16). `--research-goal "<goal>"` runs a goal-scoping step then a multi-round covered/open gap-finding loop, saved to `system/goals/<slug>.md` (gitignored — regenerated test output, not source). Explicitly a personal-learning build beyond this role's actual scope (the job ad names Layer 4 as the company's later-stage destination, not this squad's near-term work). Three real bugs found via live testing and fixed in Session 15 (impossible coverage counts, uncited-but-counted "covered" claims, duplicated/miscounted open items); Session 16 confirmed the fixes hold on a clean re-run, then added two more real refinements: a `[caveat: ...]` tag for covered items whose source is thin/generic (not AI-specific), and `temperature=0` on the covered/open classification step (was defaulting to 1, causing run-to-run variance in item counts/wording) while leaving goal-scoping at default temperature (exploratory step, benefits from variety).
- **Phase 7 eval infrastructure (Session 17, continued):** Discovered and fixed architectural mismatch: test cases assumed pre-specified items, but feature generates its own items from goal + notes. Completely redesigned eval strategy from "LLM-as-judge item accuracy" to "structural validation of output properties" (coverage arithmetic, duplicates, citation integrity, source validity, caveat presence). Rewrote `research_goal()` to return structured dict (not markdown string). Added deduplication to eliminate duplicate items. All 5 test cases now passing (100% — rg_001 through rg_005 fully passing). Acceptance bar: 100% (structural properties must always hold). Saved 3 comprehensive UX design articles for eval checklist design (Microsoft Human-AI Interaction Guidelines, AIUXDesign Error Recovery Patterns, Google PAIR Calibrated Trust framework).
- **Session 18: UX/Error Recovery Eval Checklist (Complete, ready for testing):** Extracted candidate checklist items from the three UX frameworks. PM locked down must-haves (upfront clarity, real-time progress, user-friendly errors, user agency) and should-haves (stop ability, clear summary, follow-up actions). Created `system/research-goal-ux-testing-checklist.md` (14-item hybrid eval template: rule-based structural checks + manual 1–5 UX quality ratings across 4 phases: ESTABLISH → EVOLVE → RECOVER → COMPLETION). Created `system/research-goal-test-candidates.md` (3 test goals: stakeholder communication, design judgment, AI PM skills/frameworks). UX spec locked: every-step streaming, immediate fallback notifications, LLM-powered error recovery suggestions, upfront expectation-setting, follow-up sequence (New goal → Modify goal → Online search). Ready for manual testing next session.
- **Phase 8 (Lightweight UI, roadmap item 6) — in progress:** React frontend restructured in Session 20 to a Claude Desktop-style layout (persistent left sidebar, unified Search+Import landing window with a mode toggle) — still mock-data only in the UI itself. Flask backend: Session 21 implemented all 6 planned endpoints for real (`POST /api/import`, `POST /api/import/confirm`, `GET/PATCH /api/notes`, `GET /api/topics`, `GET /api/tags` — see `system/ui-build-plan.md`), replacing the earlier stubs. Live-tested end-to-end against real notes data. Search/Chat still has no backend endpoint at all (deliberately deferred — blocked on the sources-elaboration design question below). **Frontend and backend are not yet connected** — the React app still calls only mock data, even though the real endpoints now work standalone. See `system/session-log.md` Session 21.
- **Session 22 (2026-08-24) — complete:** Notes list/detail/edit form wired to the real Flask backend for the first time (previously mock-data only). User QA'd it hands-on and found 8 real gaps (see `system/session-log.md` Session 22 for the full list). Fully closed out the data-model group: consolidated 6 files into the right places per this project's own pre-existing `system/project-management/split-vs-consolidate-guide.md` policy (which had silently regressed), added a `product-management-basics` taxonomy topic, fixed source attributions with real citations, and shipped the full Source/Author/URL schema change — new optional `author` field end-to-end, `source` broadened to cover books/podcasts/publications/URLs, `url` removed as a separate field (folded into `source` text for the 13 notes that had both, so no links were lost). Normalized all dates to `YYYY-MM-DD`. Fixed a notes-table layout bug so the full table (now 6 columns) fits without horizontal scrolling. **Current real note count: 26.**
- **Session 23 (2026-08-25) — complete:** Built delete/trash/restore for notes (soft-delete to `notes/.trash/`, instant free embedding cleanup, lazy 7-day auto-purge on backend startup, a Trash view with Restore). Fully wired the Import wizard to the real backend — it was more broken than known (Upload never read real files, Frontmatter had stale mock data + no Author field, Confirm guessed the save path, Success's "Go to Notes" button had no click handler at all). Now: real file/paste reading, real Claude-suggested frontmatter via `/api/import`, real topics/tags, real save via `/api/import/confirm`, newly-imported notes appear at the top of the Notes list. Found and fixed an unrelated environment bug along the way: `chromadb==0.4.0` calls `np.NaN` (removed in NumPy 2.0) — pinned `numpy<2.0`.
- **Session 24 (2026-08-25) — complete:** Built the dedicated Notes read view — full content (not truncated), real markdown rendering (headers, `**bold**`, real `<ul>`/`<ol>` lists) via a new shared `MarkdownLite` component also reused in the Import wizard's preview. Panel is 50%-width (never covers the Title column), clicking a different row swaps the panel's content directly instead of closing it first. Fixed a real cross-component CSS collision along the way: the Import wizard's Confirm screen used the same global class name (`content-preview`) as the Notes panel with its own hardcoded `max-height: 200px`, silently overriding the panel's sizing — renamed to `confirm-content-preview`. Also fixed: duplicate Source display, Tags heading capitalization/size mismatch, and a URL-bracket color bug (greedy regex swallowing trailing punctuation into the link).
- **Session 25 (2026-08-26/27) — design only, no code:** Planned the evolution of this project into a **learning operating system** — `ai-chief-of-staff`'s daily intake ranked against knowledge state + skill gaps instead of a static topic hierarchy, with a main orchestrator agent, an MCP server, and continuous eval (top-down invariants + bottom-up error analysis). Full plan with every decision and trade-off: **`system/learning-os-plan.md`** (readable 3-column version: https://claude.ai/code/artifact/67345e9a-61a6-4b96-82b1-bb27b3dadf65).
- **Session 26 (2026-08-28) — design only, no code:** Resolved all four blocking decisions from Session 25 (hosting: Render + Neon; eval harness: shared process/separate scorecards; naming: "Knowledge Library"; email/Today-page UX: retrieve-first with fallback). Added the `Agent`-suffix naming convention project-wide. Phase 0 fully unblocked.
- **Session 27 (2026-08-30) — Phase 0 in progress:** Started the "repair eval debt" half of Phase 0. Found and fixed three real bugs in `search_notes()` (keyword baseline): `.trash` notes were still being searched/embedded, whole-file match counting structurally favored long consolidated files over short focused ones (fixed by scoring per-section via the existing chunker), and there was no IDF weighting (a hand-rolled stopword list was only a partial fix — replaced the scorer entirely with `rank_bm25`/BM25, the standard algorithm, after web research confirmed IDF is current best practice over stopword lists). Precision@5: 54% (broken baseline) → 75% (21/28), with 7 failures diagnosed (2 genuine synonymy limits, 5 stale test labels — fix identified, pending go-ahead).
- **Session 28 (2026-08-31) — Phase 0 "repair eval debt" complete:** Applied the 5 pending label fixes → **93% precision@5 (26/28)**, beating the original 82% ceiling; only the 2 known synonymy gaps (Q4, Q6) remain. Resolved the note-identity design question first (filename vs. stable ID) by concretely sizing a full migration via codebase grep (~76 matches; Chroma's own chunk IDs are path-derived, not just metadata; the React frontend actually parses path structure, not just an opaque pass-through) — concluded a full migration isn't justified yet at ~30 notes, took the cheap middle path instead: added an optional `id:` frontmatter field (`notes/template.md`, `backend/notes_store.py`'s `_generate_note_id()`) stamped at creation and unused until a future citation system needs it, plus an automated staleness tripwire (`validate_expected_sources()` in `run_evaluation.py`) that checks every `expected_source` against real files before every eval run. The tripwire immediately found 10 more stale-but-harmless references the manual pass had missed (each was the unused half of an "X or Y" pair, invisible to the precision score) — fixed all 10, tripwire now clean. **Phase 0's "repair eval debt" deliverable is done.**
- **Session 29 (2026-08-31) — sequencing decision + all 3 Session 19 UX questions resolved, no code yet:** User flagged that the pre-existing UI backlog (Search/Chat still 100% mock) had been silently deprioritized behind the Learning OS plan without ever explicitly deciding that — fair catch, it drifted rather than being decided. Investigating the service-layer extraction surfaced why Search/Chat has been stuck mock this whole time: Flask has never imported anything from `chat.py` — `search_notes`, `search_notes_semantic`, `suggest_related`, `research_goal` only exist in the CLI, unreachable from the web app. **Decided sequencing:** (1) extract the service layer — unblocks *both* the old UI backlog and the new MCP server identically, not a Learning-OS-only step; (2) wire Search/Chat to the real thing next, closing the UI backlog and getting daily-use value, before (3) building the MCP server (Learning OS Phase 1).
  - **Session 19 Q1 resolved — "Go to article" opens the real Read view, not Edit, not a third renderer.** `ArticleModal.jsx` currently has its own separate mock-only markdown renderer, duplicating the real `MarkdownLite` component + read-view pattern already built for Notes in Session 24. Fix: reuse that component/pattern; delete the duplicate renderer. Three named states going forward: Preview (`NotesDetailPanel`, click-a-row), Read (Session 24's full view), Edit (`EditNoteModal`).
  - **Session 19 Q2 resolved — sources elaboration is templated, not LLM-generated, for now.** Chose Option C from the candidates discussed: `"{N} results across {topic(s)}, matched on: {query terms that actually hit, filler words dropped for display only — separate from BM25's scoring, which correctly keeps them}"`. Zero new API cost, zero new eval surface needed (it's arithmetic over already-known match data, not a new AI output). Revisit LLM-generated later if the templated version feels too mechanical in real use.
  - **Session 19 Q3 resolved (was already knowable, just never confirmed) — this project bills the Anthropic API directly** (`ANTHROPIC_API_KEY` in `.env`), unrelated to any Claude Pro subscription. Moot for the elaboration text now that Q2 went templated (zero cost); still true for actual search/chat LLM calls generally.
- **Session 30 (2026-09-01) — service-layer extraction + a real 3-week-old data-staleness bug found and fixed:** Extracted just the three functions Search/Chat needs — `search_notes`, `search_notes_semantic`, `suggest_related` — out of `scripts/chat.py` into new `scripts/retrieval_service.py`, so Flask can import them too (chose the narrow scope, not the plan doc's full `skills_store`/`events_store` shape — nothing calls those yet). Left `research_goal`/`scope_goal` in `chat.py`: they call `print()`/`input()` for interactive terminal use and would hang a web request as written; a separate task for whenever the MCP server needs them. Verified zero behavior change: locked eval re-run at 93% (26/28), identical to Session 28. **Found and fixed a real bug (not caused by this extraction — proven by testing the original code first):** a 2026-08-09 "reorganize system/ for clarity" commit moved runtime data to `system/_data/` and updated `chat.py`'s Chroma path to match, but never updated `scripts/embed.py`, which kept writing every embedding to the old `system/chroma_db/` path. `.gitignore` had the same stale-path bug. Net effect: semantic search had been silently serving a frozen pre-08-09 snapshot of your notes for **three weeks**, missing every edit since (including the Session 22 consolidation) — invisible until an unrelated `chromadb` version mismatch on the abandoned snapshot finally threw a hard error instead of quietly returning stale-but-plausible results. Fixed: aligned `embed.py` to the real path, fixed `.gitignore` (also caught the same bug on `system/goals/`), untracked both from git, rebuilt fresh (74 chunks, all 26 current notes). Verified end to end: `search_notes_semantic()` now correctly returns `pm-managing-time.md` for a time-management query; `suggest_related()` returns sensible neighbors.
- **Session 30b (2026-09-01) — prevented the Chroma path bug from recurring:** User asked directly whether anything now stops the same silent-staleness bug from happening again — it didn't, the earlier fix only patched today's instance. Two fixes, closing two different failure modes: (1) **structural** — `scripts/config.py` now holds `CHROMA_DIR`/`NOTES_DIR`/etc. as the single definition; `embed.py`, `retrieval_service.py`, `chat.py` all import from it (verified same object, not just equal values), so the two-files-disagree mechanism that caused the original bug can't recur. (2) **staleness tripwire** — `check_index_freshness()` in `retrieval_service.py`, same pattern as the eval's `validate_expected_sources()`, compares notes on disk against what's embedded in Chroma and warns on either direction of drift (unembedded note, or orphaned embedding). Wired into `chat.py`'s CLI startup. Proved it actually works (not just "looks right"): added a real unembedded test note, confirmed the exact expected warning, removed it, confirmed clean. Covers the code-mismatch risk (#1) and the "forgot to re-embed after editing a note" risk (#2) — the two didn't overlap, so both were needed. Eval re-confirmed unchanged at 93%.
- **Session 31 (2026-09-01) — Search/Chat wired to real search, UI backlog closed:** `POST /api/search` (new `backend/routes/search_routes.py`) runs real semantic search + a real Claude answer, replacing the frontend's hardcoded mock. Refactored `search_notes_semantic()` onto a new structured `semantic_search_matches()` so Flask and the CLI share one retrieval call rather than duplicating the Chroma query. `sourcesSummary`/`sourcesElaboration` built as templated arithmetic (Session 19 Q2), not a second LLM call. Session 19 Q1 implemented: "Go to article" now opens the real `NotesDetailPanel` Read view; `ArticleModal.jsx` and the now-orphaned `mockConversations.js` deleted. Wired `MarkdownLite` into the chat bubble (the real answers contain markdown the old plain-text bubble would have shown broken). Verified via curl end-to-end (real answer, correct sources, working note click-through, 400 on empty query) and a clean production build — **not yet visually verified in a browser**, since the Chrome extension wasn't connected in this environment; Flask (`:5050`) and the React dev server (`:3000`) were left running for a manual walkthrough.
- **Session 32 (2026-09-01) — manual testing found and fixed 3 real issues:** (1) Chat thread wasn't scrollable with real long answers — `.chat-main` was missing `min-height: 0`, a classic nested-flexbox bug invisible with the old short mock text. (2) The "results seem irrelevant" report turned out to be that same scroll bug hiding the answer text, not a retrieval bug. (3) Two real feature requests, both implemented: genuine Claude streaming (not a client-side animation — `POST /api/search` now returns SSE `delta`/`done` events; frontend hand-parses SSE via `fetch` + `ReadableStream`, since `EventSource` can't do POST bodies) so text starts appearing in under a second instead of after the full generation; and the thread no longer auto-scrolls to the bottom once an answer finishes — it scrolls to the *top* of the new answer exactly once, when the first token arrives, then holds position as more streams in.
- **User-confirmed working (2026-09-01):** streaming and the scroll-to-top fix both verified in a real browser by the user — "quite nice." Search/Chat UI backlog is genuinely closed now, not just believed-done from curl tests.
- **Session 32/33 (2026-09-01) — decided the Projects/Goals sidebar gap and its sequencing:** User noticed "Projects" and "Goals" sit disabled ("Coming soon") in the sidebar and asked where that's picked up. Found: `system/ui-build-plan.md` originally phased this as **Phase 1B ("next sprint")**, right after the now-complete Import UI (Phase 1A) — but it silently fell out of the active sequence when the Learning OS pivot (Session 25/26) redirected priority, and was never explicitly re-addressed by Session 29's later re-sequencing (service layer → Search/Chat → MCP). Same "drifted, not decided" pattern Session 29 caught for Search/Chat itself.
  - **Decided order: Projects UI → MCP server → Goals UI (deferred).** Projects sized as small and low-risk: `load_projects`/`new_project`/`archive_project` in `chat.py` are already pure functions with no CLI-blocking behavior, same shape of job as the Search/Chat wiring (light adaptation of `print`/`sys.exit` CLI-errors into JSON errors, same pattern `notes_store.py`'s functions already went through). Goals UI deferred: `research_goal`'s `scope_goal()` step blocks on `input()` mid-run for interactive goal-narrowing — the same CLI-coupling problem already found and deliberately deferred during Search/Chat wiring, and it's a real *design* question (how does multi-turn narrowing work over discrete HTTP requests, not a blocking terminal prompt), not just plumbing. Also lower interview-prep priority — CLAUDE.md itself already frames `research_goal` as "a personal-learning stretch, beyond this role's actual scope" (Layer 4), a weaker case than MCP's confirmed skill-gap relevance.
  - MCP server stays the agreed next *major* milestone either way — Projects UI doesn't block or change that, it's just cheap enough to slot in first.
- **Session 34 (2026-09-05) — Projects UI built end to end, complete:** Full CRUD (list/create/rename/archive) via new `backend/projects_store.py` (single source of truth for both Flask and the refactored CLI) + `backend/routes/projects_routes.py`; note-to-project tagging added to the Edit Note modal and Import wizard (`notes_store.update_note()` gained `projects` handling mirroring `tags`; new `ProjectPicker` component mirrors `TagPicker` minus inline creation, since a project needs a real registry entry); a project filter added to Search/Chat (`semantic_search_matches(query, project=...)` already supported it — just threaded through). Sidebar's "📁 Projects" button enabled, replacing the "Coming soon" placeholder. Built in one continuous pass after locking acceptance criteria upfront via a structured Q&A (a deliberate working-style change this session — see Session 34's own log entry), rather than checking in after every sub-decision.
  - **Rename is new capability beyond what the CLI ever had.** Chose to cascade-rewrite every tagged note's `projects:` frontmatter rather than introduce stable project IDs — the tradeoff was raised explicitly (see "Future roadmap item — stable project IDs" below), not decided silently. Verified the cascade against real data: renamed the actual `leapspace-interview-prep` project, confirmed only the one frontmatter line changed in a real tagged note, renamed back, confirmed `git diff` on `notes/` came back completely empty.
  - Found and fixed a real bug via inspection, not a runtime failure: `jsonify({"status": "success", **project})` let a project's own `status` (active/archived) silently overwrite the response wrapper's "success" marker, since both used the same key. Fixed by nesting the project data instead of spreading it.
  - Full lifecycle verified end to end: created a project via the API, imported a real note tagged to it through the actual confirm endpoint, confirmed the note count incremented, removed the tag via PATCH, confirmed the count dropped to zero, cleaned up, confirmed zero residual diff on `notes/` and the registry.
- **Session 35 (2026-09-06) — Projects UI's first real QA pass, 5 issues found and fixed:** (1) Naming: reconsidered mid-conversation after user pushback — names are stored/displayed exactly as typed (spaces, casing preserved), only `,`/`:` rejected (the only characters that actually break parsing), duplicates checked case-insensitively. The hyphen convention first proposed was inherited from topics (a folder-name constraint) without checking whether it actually applied to projects — it didn't. (2) Active/Archived now render as two visually separate grouped tables. (3) **Mobile optimization, scope expanded mid-build per explicit user direction** from "fix the half-screen overflow" to real iPhone-12-width support: root-caused the reported overlap to a shared `.notes-table th` bug (missing text truncation, predates this session) fixed once for Notes/Trash/Projects together; all three tables now convert to a stacked-card layout below 480px via `data-label` attributes + one shared CSS block; sidebar becomes an off-canvas slide-in panel below 768px instead of permanently eating ~40% of a phone screen. New standing design principle added: every future UI change gets checked at a mobile width. (4) Projects field added to the read-only note panel (was only on the Edit form). (5) Filtered notes-by-project: a third filter dropdown on Notes + a "View Notes →" link per Projects row.
- **Session 36 (2026-09-06) — mobile QA round 2, 6 more real issues found and fixed:** User's dedicated mobile QA pass on Session 35's work (with screenshots) found: (1) the fixed hamburger toggle covered the Edit Note modal and note-detail panel's headers — a z-index ordering bug (toggle at 1100, both overlays below it at 1000-1001), fixed by raising both overlays to 1200; (2) "+ Import New" overlapping "Notes" on the header row — fixed by stacking the header vertically on mobile; (3) the new "All Projects" filter dropdown was invisible — `.filter-group` had no wrap behavior, silently pushing the third filter off-screen, fixed by stacking filters vertically on mobile; (4) "New Project" label didn't read as a sub-heading — reused the existing Active/Archived group-heading style; (5) uneven action-button sizing (View Notes / Rename / Archive) — root cause was text wrapping inside one button while siblings stayed single-line; fixed via a shorter label plus a shared `.row-actions` container so whole buttons wrap together (or stack full-width on mobile) instead of text breaking unevenly; (6) the chat input didn't stay pinned to the bottom on mobile, and a new answer pushed it further down instead of the thread scrolling beneath a fixed input — root cause was `.main-chat` using `height: auto` on mobile (pre-dating Session 35) instead of a real viewport height, so `.chat-thread`'s `flex: 1` had nothing to fill; fixed with `calc(100dvh - 56px)`, restoring the same pin mechanism already working on desktop.
- **Session 37 (2026-09-06) — chat input pinning fix revised after it didn't work:** Session 36's fix (giving `.main-chat` a real `calc(100dvh-56px)` height) was verified to compile and to be served correctly to the browser, but visibly didn't pin the input — user's screenshots showed it not visible at all without scrolling past a full response, worse than expected. Root cause not fully confirmed (likely a `dvh`-in-`calc()` quirk in the test browser, unverified). Switched technique instead of re-guessing: `.chat-input-area-wrapper` is now `position: fixed` on mobile, which pins relative to the viewport regardless of any ancestor's height computation — the standard technique real mobile chat UIs use, not a one-off workaround. `.chat-thread` gained `padding-bottom` so the last message isn't hidden behind it. Kept the `.main-chat` height fix too (still needed for the thread to scroll internally). User re-verifying now.
- **User-confirmed working (2026-09-06):** the `position: fixed` chat input fix works. Three follow-up visual polish tweaks applied from a screenshot of the working bar: a shadow for elevation/separation from scrolling content, tightened spacing between the project-scope dropdown and the input box, and a shortened placeholder that was wrapping and clipping at mobile width.
- **Session 38 (2026-09-06) — first full Chrome-driven QA pass across the whole app, 7+1 real issues found and fixed:** (1) **Retrieval bug, root-caused and fixed:** author names were never part of the embedded text (`embed.py` treated them like dates/tags, metadata-only) — a query like "what about Teresa Torres" only worked when a note's body happened to restate the author's name in prose (true for Marty Cagan, false for Teresa Torres's "Continuous Discovery Habits"). Fixed by prepending title/author to the text sent to OpenAI for embedding, while keeping the *displayed* citation text as the clean chunk body (a self-inflicted regression — the prefix was initially leaking into search-result citations — caught and fixed in the same session by splitting `embedding_inputs` from `documents`). Verified via a controlled A/B (stash the fix, re-embed, re-run eval, compare) that the post-fix 93% precision@5 (26/28) has the same two pre-existing failures as pre-fix — no regression, and the Teresa Torres query now correctly retrieves her note. (2) Import wizard's AI-suggested frontmatter no longer duplicates Title into Source when there's no real external source (the prompt literally said "otherwise reuse the title" — now says "otherwise reply NONE" plus a code-level guard). (3) `MarkdownLite` (shared by Notes/Import-preview/Chat) gained blockquote support (`> **Why this matters:**` was showing as literal text); `SnippetCard` (search source citations) gained inline bold+blockquote-marker handling, since it previously did zero markdown parsing at all. (4) Chat-bubble headings no longer inherit full document-H1 size (were ~32px, overpowering the 16px body text and the user's own question bubble) — scaled to 17–20px. (5) Deleting a note now shows a success toast. (6) Fixed a real `historyItems` bug: an "in-progress import" placeholder stayed visible even after reaching the `'success'` state, showing as a confusing duplicate alongside the real completed entry. (7) `notes_store.slugify()` now replaces stripped punctuation with a separator instead of deleting it outright, so `1:1` correctly becomes `1-1` in filenames instead of `11`. (8) **Added mid-session:** replaced the native `window.confirm()` delete prompt (which froze the Chrome automation tab mid-QA — a real, reproducible failure mode) with an in-app styled confirmation modal, reusing the existing `.modal-overlay` pattern; this surfaced and fixed a latent z-index bug (`.modal-overlay` at 1000 was below the Edit modal's 1200, so it and the pre-existing "New Topic" modal would have rendered invisibly behind it — raised to 1300). Built a new reusable `system/evaluation/run_evaluation_semantic.py` along the way, since no automated eval for semantic search's precision@5 existed at all — `run_evaluation.py` only ever scored the keyword baseline. Also discovered this Chrome automation session has a hard ~555px window-width floor, above the project's 480px mobile-breakpoint — Sessions 35–37's specific mobile-card-layout fixes couldn't be independently re-verified this way (only user-verified on a real device, which stands). Two smaller findings deferred at the time, since fixed in Session 39: `MarkdownLite` didn't handle single-asterisk `*italic*` (shown as literal asterisks), and `SnippetCard` didn't parse `##` header lines in citation excerpts.
- **Session 39 (2026-09-13) — closed the two markdown-rendering gaps deferred from Session 38:** `MarkdownLite`'s shared `renderInline` gained `*italic*` support (was bold-only) via a combined `/\*\*(.+?)\*\*|\*(.+?)\*/g` regex that tries `**bold**` first at each position. Root-caused the literal `##` in `SnippetCard` citation excerpts to `chunking.py` keeping a section's `## Title` boundary line as the first line of `Chunk.text` — `SnippetCard` only ran the inline-only renderer, not the block-level heading parser, so the raw `#` characters showed through. Added `stripInlineHeaderMarkers()` to convert an inline `##` line to bold text instead, matching the existing blockquote-marker pattern. Verified with a standalone Node script rather than a live build (this environment has no `node_modules`/`react-scripts`).
- **Session 40 (2026-09-13) — MCP server (Learning OS Phase 1) built and working, first real dependency-upgrade decision made along the way:** Building the MCP server surfaced a genuine blocker before any server code was written: the official `mcp` Python SDK requires `pydantic>=2.12`, but `backend/requirements.txt`'s `chromadb==0.4.0` pin (from the Session 23 NumPy fix) pulls in `pydantic 1.x` — the two cannot coexist in one Python process, and the MCP server has to `import` `retrieval_service.py` (which imports `chromadb`) in the same process as `mcp`. Resolved by upgrading to current chromadb (1.5.9): smoke-tested the exact API calls `retrieval_service.py`/`embed.py` use (`PersistentClient`, `get_or_create_collection`, `.upsert()`, `.query()`, `.get(where=..., include=["embeddings"])`, result dict shape) against the new version before proposing it — all unchanged — then dropped the `chromadb==0.4.0`/`numpy<2.0` pins (no longer needed; that NumPy bug was specific to old chromadb's internals) and added `mcp` to `requirements.txt`. Per this project's own architecture decision that Chroma is a rebuildable cache, this requires a fresh `python3 scripts/embed.py` run and a re-run of both eval scripts on the user's own machine to confirm no precision regression — not yet done, since this remote environment has no `OPENAI_API_KEY` or real Chroma index to verify against. Built `mcp_server.py` at the project root as a third adapter alongside the CLI and Flask (per `system/learning-os-plan.md` Section B: calls `notes_store`/`retrieval_service` directly, not via HTTP), exposing 5 read-only tools over stdio: `search_notes` (wraps `semantic_search_matches`), `get_note`, `suggest_related`, plus `list_notes`/`list_topics` as browsing helpers (added beyond the plan doc's original tool list, at the user's choice, so a client can discover note_ids/topics without already knowing them). Deliberately excluded `research_goal` (blocks on `input()`) and `list_skill_gaps` (needs a `skills_store` that doesn't exist yet) — both flagged as later work in the plan doc already. **A real SDK-version gotcha found and fixed:** this `mcp` release (2.x) renamed `FastMCP` to `MCPServer` and, less obviously, treats a plain raised exception inside a tool as an *unexpected crash* (message discarded, generic error only) rather than a clean client-facing error — found by testing the real stdio protocol end-to-end (not just calling the Python functions directly) and seeing `get_note`'s deliberate `ValueError` swallowed into a generic message. Fixed by raising the SDK's own `ToolError` instead, confirmed via a real client session that the specific message now reaches the caller. Also fixed a latent env-loading bug before it could bite: `retrieval_service.py`'s bare `load_dotenv()` searches from the *current working directory*, which is fine for `python3 scripts/chat.py` from the project root but not guaranteed when an MCP client like Claude Desktop launches this as a subprocess with its own working directory — `mcp_server.py` now loads `.env` explicitly from its own file location first. **What's still needed on the user's own machine before this is fully trustworthy:** `pip install -r requirements.txt -r backend/requirements.txt`, `python3 scripts/embed.py` (rebuild the index against the new chromadb), re-run both eval scripts to confirm 93%/precision-@5-equivalent numbers hold, then configure Claude Desktop's `claude_desktop_config.json` to launch `mcp_server.py` with the project's `.venv` interpreter.
- **Session 41 (2026-09-26) — chromadb upgrade verification closed out, was a false alarm:** Resumed after a 13-day gap and found uncommitted local state from the same day as Session 40 — a disposable browser-test note had been left in the corpus during a re-run of both evals, never committed. Traced a resulting keyword-eval drop (92.86%→89.29%) to BM25's corpus-wide statistics shifting from that one extra unrelated document, not a real regression. Deleted the test note (which also removed the empty `notes/vibe-coding/` taxonomy folder — restored it + its `.gitkeep`), re-ran both evals clean: **keyword 93% (26/28) and semantic 93% (26/28), both identical to the pre-upgrade baseline.** The chromadb 1.5.9 upgrade is now fully verified against real eval numbers, not just structurally checked.
- **MCP server confirmed working in Claude Desktop (2026-09-26, Session 41):** `mcpServers.knowledge-retriever` was added to Claude Desktop's config (backed up first, merged as JSON so no other settings changed). The user confirmed the tools appear and return real notes. **Learning OS Phase 1 is complete.**
- **Session 42 (2026-09-27): Phase 2 scoped and reframed.**
  - Metrics: an action on ≥ 70% of calendar days (weekends included); ≥ 5 cards actioned per day, or all cards if fewer are shown.
  - Build: Neon event log from day one; a new view in the React app; cards from the real ai-chief-of-staff digest.
  - **Goal reframed by the user:** the page becomes where all newsletter content is read (email bodies plus article text). So the digest pipeline saves full content to Neon first, and the email becomes a notification. The existing email keeps running meanwhile.
  - Phase 2 is build-and-verify; metrics count from hosting day. Gmail sync is out of scope for now.
  - Fixed ai-chief-of-staff's midnight-rollover bug that lost 6 days a month.
  - Article-retrieval baseline: 41% of links ok, with failures concentrated in two senders' tracking links. See `system/session-log.md` Session 42.
- **Session 42, continued: retrieval spike run 1, and Neon tables live.**
  - **Spike run 1:** true recovery of blocked articles was about 15%, all from resolving redirects. Retry and the headless browser recovered nothing real. The report's 30% was inflated by robot-check and paywall pages passing a 500-character bar.
  - **Blockers found:** mostly where the request comes from (GitHub's data-centre servers), plus genuine paywalls.
  - **Decisions:**
    - Drop the headless browser.
    - Blocked or paywalled items show the newsletter's blurb plus an "open original" button, counted separately in coverage.
    - Spike run 2 tests T5 (The Neuron's public web issues, publishers' own feeds) with a stricter success check.
  - **Neon (London):** `items` and append-only `events` tables created via `db/migrate.py` from `db/migrations/001_init.sql`.
  - **Button rules:** Undo is supported (an `undo` event points at the event it cancels), and a card can take several decisions over time.
- **Spike run 2:** 22% of blocked real articles were recovered with free techniques from GitHub's servers. The Neuron's web version is blocked there too. Linked-article coverage is capped at roughly 55–60% under the current constraints (free, no Mac, no paid reader); email bodies are 100%. See the session log, Session 42.
- **Session 43 (2026-10-04): Phase 2a spec locked, no code.** Everything lives in `system/phase2a-spec.md`.
  - Release A: digest upgrade (retrieval techniques, junk-judge filter, repeat-email fix, empty-day notice).
  - Release B: Neon store-first, the Today page, and Render hosting with a password login, all in one autonomous loop.
  - GitHub re-test: The Batch 0% → 72%. The Neuron stays email-body-only.
- **Session 44 (2026-10-04 → 10-05): Phase 2a autonomous loop.**
  - **Release A** (AICoS digest upgrade) is built and dry-run: coverage 37% → 76%. **Live since 2026-10-05** (AICoS `16cd408`); first v2 night is 5 Oct.
    - Before switching: added the self-promo junk rule (Pause 1 P2), and fixed a night-one repeat bug by seeding v2's processed-email list from v1's last digest.
  - **Release B:**
    - B1 (login + Neon API), B2 (Today page) and B4 (Vercel hosting) are done. Live at https://knowledge-retriever-today.vercel.app.
    - B3 (Neon ingestion) is built and pushed behind `NEON_STORE` (AICoS `a12fab6`). The user moved switch-on to **6 Oct**, if v2's first night is clean. The GitHub pre-flight smoke test passed.
    - Today page refined through two mobile reviews (5 Oct):
      - the reader shows Markdown with links, with a plain-text fallback
      - auto-hiding bars and the phone's own back swipe
      - Completed / Later / Skip / Build as colour toggles
      - Skip reasons as multi-select pills
    - Junk eval loop: "Not junk" taps → `labels_corrections.csv` → `run_eval.py --split corrections`.
  - **Session 45 (2026-10-05):** see `system/session-log.md`.
- **Session 46 (2026-10-07 → 08): Phase 2a complete.**
  - B3's first live night was checked clean.
  - First real-use feedback acted on: readable titles for "LINK"-style links; "Everything else" grouped by newsletter, oldest email first (migration 004); 4 sender addresses added after silent address changes.
  - Pause 2 closed by the user. **Next: Phase 4** (skill map + Later queue + resurfacing): acceptance criteria first.
  - **Pick up from** `system/phase2a-progress.md` → "NEXT SESSION START HERE".
- **Session 46 (2026-10-08): working method changed to spec-driven development for every build.** Made global the same day: `system/global-claude/` holds the rules (spec-driven development, plus guidance on agents across the build/release pipeline), the spec template and an installer for `~/.claude/CLAUDE.md`. Specs go in `system/specs/`. The next build is the first one under the formal framework.
- **IMMEDIATE NEXT (superseded by the line above; kept for history):**
  1. The user labels ~150 links as junk or real. Claude prepares the label file.
  2. The user does the Render signup and adds the `NEON_DATABASE_URL` GitHub secret, following Claude's steps.
  3. Kick off the autonomous loop: Release A, then Release B. Pause points are in the spec.
  - Small deferred items still open:
    - Freshness tripwire not yet surfaced via Flask.
    - Snippet sentence-highlighting.
    - Stable project IDs.
- **Next after that:** Wire the React frontend to the real Flask endpoints (Notes list/detail/tags first, then Import's Confirm step) — the plan doc's Session 4/step 4. Three open UX questions from the user (2026-08-12, still not answered — see session-log Session 19): (1) "Go to article" opens Edit mode, not a read view — fix directly, or first define Read vs. Preview vs. Edit as distinct named UI states? (2) How should the sources elaboration text actually be generated, and should it get eval discipline applied like other AI-generated pieces of this project? (3) Does generating it cost Anthropic API usage, or does it ride on the Claude Pro subscription? From Session 20: history currently only supports fully reopening the *most recent* completed import — older completed imports appear in the list but aren't individually reopenable yet. Deferred: interview-defense drill; 5 "Why this matters" TODOs on Kindle imports; keyword baseline re-run; Layer 3's other two slices (categorization/staleness).

## Roadmap (updated 2026-08-05, after re-reading full job ad's layer structure)

1. **Finish semantic search** — chunking strategy decision → embeddings → Chroma → re-run 28-query test set → compare precision@5 vs. 82% keyword baseline. **Complete: 96% precision@5.**
2. **Project-scoped organization ("project spaces," Layer 2)** — a "project" concept alongside the existing topic taxonomy. This is the most direct match to the actual squad this role would join (LeapSpace's "project spaces" — see `system/job-ad-reference.md`'s "Four-Layer Stack" section). **Complete.**
3. **Evaluation-as-practice writeup** — reframe the existing 18%→82% debugging work as ongoing evaluation *practice* (define → commission → act on results), matching the ad's "commission the evaluations, read the results, turn them into prioritised improvements" language. Mostly narrative/documentation work on what's already built, not new build work — can slot in anytime.
4. **Small Layer 3 taste ("living knowledge base")** — one small, fully-defensible mechanic (e.g. auto-suggest related existing notes when a new one is added to a project), deliberately scoped small enough to explain and defend under a follow-up question rather than a shallow agentic demo. **Complete** (Sessions 13–14) — covers only the "grown from every finding" slice; "structured" and "current" remain untouched.
5. **Layer 4 stretch ("goal-oriented research")** — an iterative research-loop prototype against a stated goal. Explicitly a stretch step, beyond this role's actual scope, built anyway for personal learning value. **Complete** (Sessions 15–16) — three bugs found and fixed, then confirmed clean on re-run, plus a depth/relevance caveat tag and temperature tuning for run-to-run consistency.
6. **Lightweight UI** — a simple web front-end (not just CLI/Terminal), scoped end-to-end at the user's request: chat, search, `--research-goal`, AND article import + tag/project management — everything, not just the query features. Added 2026-08-07. Also framed as useful interview evidence (a working, demoable interface, not just backend logic). **Mostly complete as of Session 34 (2026-09-05):** Flask + React, chosen over Streamlit early on. Notes CRUD, Trash, Import wizard, Search/Chat (with real streaming and project scoping), and Projects (list/create/rename/archive, note tagging) are all built and wired to real data. Only `--research-goal`'s UI remains — deliberately deferred (Session 33) since it blocks on interactive terminal input mid-run, a real redesign question rather than plumbing, and named in this project's own docs as a lower-priority "personal-learning stretch" relative to the MCP server.

> **Why sequencing matters here:** Item 2 depends on item 1 the way you'd wait to paint a room until after you've decided where the walls go — a "project" boundary changes how notes get grouped and searched, so building it before retrieval was stable would have meant redoing it once the approach changed underneath it.

**Explicitly out of scope:** building a Notion/Obsidian connector. The role partners with (doesn't own) upload/storage, and the ad's tool-fluency requirement is about being a *user* with informed opinions, not an integration builder. If tool fluency is wanted, that's a "go use Notion/Obsidian and form opinions" activity, not a build task.

> **Why this matters:** It's tempting to build every tool mentioned in a job ad to "prove" fluency, but that would misread the ad — it asks for informed opinions from using tools like Notion/Obsidian, not for shipping an integration with them. Building one anyway would be solving a problem the role doesn't actually own (see `system/job-ad-reference.md` for the "owns vs. partners with" breakdown).

**Future roadmap item — ingestion agent (2026-08-04, not yet started):** Since this project is meant for genuine ongoing personal use (not just an interview artifact), the highest-leverage long-term fix for chunking reliability is upfront, not downstream: an AI-assisted ingestion step that normalizes a new note's structure (adds clear `##` headers, or flags "this note has no clear structure, here's a suggested split") *before* it's saved, rather than asking the chunker to infer structure after the fact from messy text. This is deliberately sequenced after the chunker fallback (see `system/chunking-robustness-learnings.md`) — the fallback protects against whatever imperfect content already exists or arrives from elsewhere, while the ingestion agent reduces how often imperfect content gets created in the first place. Both matter for real use; fallback was prioritized first because it's the closer analog to LeapSpace's actual constraint (no control over source content structure).

> **Analogy:** The chunker fallback is like a spell-checker catching a typo after you've already written the sentence — it's a safety net for messy input you don't control. The ingestion agent is like a form that won't let you submit a messy sentence in the first place — it fixes the problem at the source. LeapSpace can't control how researchers write their source documents (fallback is the realistic analog), but for this project's own notes, catching structure problems at save-time is the better long-term fix — hence why it's sequenced second, as a "nice to have once the safety net already works."

**Future roadmap item — stable project IDs (2026-09-05, not started, deliberately deferred):** Projects are currently identified by name directly in note frontmatter (`projects: [leapspace-interview-prep]`) — a rename cascades and rewrites every note referencing the old name (Session 33/34's Projects UI build). Considered and rejected switching to opaque project IDs now (name stays free to change without touching any note) — real cost today (registry format change, note frontmatter format change to an unreadable token, a translation layer in every place that reads/writes `projects:`) for a payoff that only matters once renames are frequent relative to how many notes reference a project. With one real active project, that payoff doesn't exist yet. Same shape of call as Session 28's decision against stable note IDs — revisit if project count and rename frequency actually grow enough to justify it, not preemptively.

See `system/job-ad-reference.md` for the full reasoning behind this roadmap.

## End Goal

- 50+ real articles indexed and queryable
- Semantic (embedding-based) retrieval working
- At least one failure diagnosed and fixed
- Honest evaluation: scored, measurable retrieval quality — not just "it seems to work"
- A working project-scoped organization concept, tied to the actual role's squad ownership area
- A log of what was tried, what broke, and what changed — ready to discuss in a PM interview

## Project Structure

```
knowledge-retriever/
├── notes/                        ← knowledge base (markdown files, organised by topic)
│   ├── ai-general/
│   ├── ai-products/
│   ├── communication/
│   ├── design/
│   ├── discovery/
│   ├── leadership/
│   ├── product-organisation/
│   ├── product-strategy/
│   ├── stakeholder-management/
│   ├── vibe-coding/
│   └── template.md               ← copy this to create a new note
├── scripts/
│   └── chat.py                   ← main CLI chat interface
├── prompts/
│   └── system.txt                ← Claude system prompt
├── system/
│   ├── session-log.md            ← progress and learnings log (append each session)
│   ├── specs/                    ← one spec per build (spec-driven development) + README.md index
│   ├── global-claude/            ← GLOBAL rules for all projects (rules.md, spec-template.md, agent-pipeline.md, install.sh)
│   ├── project-context.md        ← full session briefing document
│   ├── taxonomy.md               ← controlled vocabulary and note format rules
│   ├── evaluation/                ← test set, eval script, results, and root-cause diagnosis
│   │   ├── test_queries.json      ← 28 test queries (specific + vague pairs)
│   │   ├── run_evaluation.py      ← scores precision@5 against search_notes()
│   │   ├── keyword_results.json   ← latest run's raw output
│   │   └── DIAGNOSIS.md           ← full technical write-up of the 82% baseline and remaining failures
│   └── interview-prep/            ← condensed, interview-ready explanations — read these before an interview
│       ├── 01-rag-retrieval-chunking.md
│       ├── 02-evaluation-methodology-explained.md
│       └── 03-three-bugs-that-hid-the-baseline.md
├── .env                          ← API key (NOT in git)
├── .gitignore
└── requirements.txt
```

## Tech Stack

| Component | Tool | Why |
|---|---|---|
| Notes format | Markdown with YAML frontmatter | Simple, portable, human-readable |
| Retrieval (keyword) | Keyword search | Lightweight baseline; still available as `search_notes()` |
| Retrieval (semantic) | Chroma + OpenAI `text-embedding-3-small` | The stronger retrieval method per evaluation; `search_notes_semantic()` |
| AI responses | Claude API (claude-opus-4-1-latest) | Thinking partner responses over retrieved context |
| Env variables | python-dotenv | Loads API key from `.env` |
| MCP server | Python `mcp` SDK, stdio transport | Third adapter (alongside the CLI and Flask) exposing read-only notes/retrieval tools to MCP clients like Claude Desktop — `mcp_server.py` |

## Taxonomy (do not change without asking)

**Topic folders:** product-strategy, design, discovery, stakeholder-management, vibe-coding, ai-products, ai-general, product-organisation, communication, leadership, product-management-basics

**Cross-cutting tags:** favourite, foundational-knowledge, revisit, job-application

**Content types:** quote, own-note, book, article, podcast, video

Never create a `notes/` subfolder not on the taxonomy list. Add to taxonomy first, then create the folder.

## Note Format

Each note is a markdown file with YAML frontmatter:
```
---
title:         # optional — distinct display name; only needed when it shares a source with another note
author:        # optional — who wrote/said it
source:        # optional — book, podcast, publication, URL, or video this came from
type: article  # quote | own-note | book | article | podcast | video
topic:         # must match a taxonomy folder name
tags: []       # cross-cutting tags only
date:
---

[Main content]

> **Why this matters:** [one sentence on why you saved this]
```

## How to Run

```bash
# From the project root
python3 scripts/chat.py
```

Requires `.env` with `ANTHROPIC_API_KEY=...`

### MCP server (Claude Desktop / other MCP clients)

```bash
# From the project root, with .venv activated
python3 mcp_server.py
```

To use it from Claude Desktop, add it to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "knowledge-retriever": {
      "command": "/absolute/path/to/knowledge-retriever/.venv/bin/python3",
      "args": ["/absolute/path/to/knowledge-retriever/mcp_server.py"]
    }
  }
}
```

Use the `.venv`'s own Python interpreter (not a bare `python3`) so the right package versions are picked up regardless of Claude Desktop's own working directory. `mcp_server.py` loads `.env` from its own file location explicitly, so `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` are found even though Claude Desktop launches it with an unrelated working directory.

Read-only by design: `search_notes`, `get_note`, `suggest_related`, `list_notes`, `list_topics`. No tool creates or edits notes — that always goes through the human-approved import flow.

### Today page — desktop (local)

The fallback if the hosted page ever needs fixing: the same page and the same Neon data, on your laptop.

```bash
# Terminal 1 — API (from the project root, .venv activated)
cd backend && python3 app.py            # http://localhost:5050

# Terminal 2 — page
cd frontend && npm start                # opens http://localhost:3000 → sidebar → 📰 Today
```

- Log in with the password in `.env` (`APP_PASSWORD`). The login lasts 30 days.
- Remove `APP_PASSWORD` from `.env` to switch login off locally. Never do this on the host: there, the app refuses to start without a password.
- Run the Today API tests with `python3 -m pytest backend/tests`. They create throwaway Neon schemas and drop them afterwards. React tests: `cd frontend && npm test`.

### Today page — hosted (Vercel)

**Live at https://knowledge-retriever-today.vercel.app** (password: `APP_PASSWORD` in `.env`). Vercel project: `knowledge-retriever-today`.

- `vercel.json` defines two Vercel Services in one project on one domain:
  - `frontend/` — the React build, served from Vercel's CDN.
  - `backend/` — the Flask API (`backend/today_app.py`: Today + login only), which gets `/api/*`.
- Functions run in London (`lhr1`), next to Neon.
- `backend/requirements.txt` is deliberately slim because it is what Vercel installs. Heavy local-only packages live in the root `requirements.txt`.
- Secrets (`DATABASE_URL`, `APP_PASSWORD`, `SECRET_KEY`) are Vercel project environment variables, never in the repo (the repo is public).
- Every push to `main` redeploys.
- Why Vercel and not Render: see `system/learning-os-plan.md`, "Hosting provider revised (2026-10-05)".

## Environment Setup (new sessions)

- **Python 3** — run with `python3 scripts/chat.py` from project root
- **`.env`** — must exist locally (not in git). Contains:
  - `ANTHROPIC_API_KEY=...`
  - `OPENAI_API_KEY=...`
  - `DATABASE_URL=postgresql://...` (Neon; the same string on both laptops)
  - `APP_PASSWORD` + `SECRET_KEY` (Today page login; copy both to the other laptop)
  - `VERCEL_TOKEN` (deploys)
  - `RENDER_API_KEY` (unused since the move to Vercel)
- **Database schema:** run `python3 db/migrate.py` after pulling. It applies any new `db/migrations/*.sql` file exactly once, and is safe to re-run.
- **Packages** — install with: `pip install anthropic python-dotenv`

## Key Design Principles

- Never move to the next step without measuring whether the current one actually works
- No skipping evaluation — retrieval quality must be scored and measurable, not just qualitative
- One step at a time — do not write the whole system upfront
- Spec before code: every build follows the "Build workflow: spec-driven development" section above. Specs stay lean; one step at a time still applies, so a spec covers one build, not the whole system
- When there is a design choice (chunking strategy, embedding model, retrieval approach), explain trade-offs and ask before proceeding
- Keep it simple — real enough to discuss in an interview, not production quality
- If something fails, diagnose the root cause — do not just patch it
- **Every new UI view or major UI change must work down to a mobile width (~390px, iPhone-12-sized), not just desktop** — added 2026-09-06 after Projects' first real QA pass found a pre-existing table-overflow bug that a mobile-first check would have caught immediately. Concretely: resize the browser narrow (or use dev tools' device toolbar) as part of testing any UI change, not only at full desktop width. Wide/dense content (tables especially) should degrade to a stacked/card layout below ~480px rather than truncating into unreadable slivers — see `NotesView.css`'s `@media (max-width: 480px)` block for the established pattern (reused by every table via `data-label` attributes on each `<td>`, so it isn't reimplemented per view). Navigation (the sidebar) collapses to an off-canvas panel below 768px rather than permanently consuming screen space on a narrow viewport.

## Documentation Autopilot (Claude does this without being asked)

Do not wait for the user to say "update the session log" or "add this to learnings." Update automatically, inline, at these trigger points:

| Trigger | Update |
|---|---|
| A phase/step is completed or a significant bug is found+fixed | Append a new entry to `system/session-log.md` (see format below) |
| A surprising, non-obvious, or interview-worthy insight comes up | Append a compressed bullet to `../learnings.md` under the Knowledge Retriever section (match the existing bullet length/format there — do not paste full write-ups) |
| A finding is deep/technical enough to need a full write-up | Create or update a file in `system/interview-prep/` |
| A test set, baseline number, or key project fact changes | Update `CLAUDE.md`'s "Current Status" section so it never goes stale |

After making these updates, mention it briefly in the same response ("Updated the session log and learnings file") — do not ask permission first. Documentation updates are record-keeping, not decisions; only pause to ask when there's an actual design tradeoff (chunking strategy, model choice, etc. — see Key Design Principles above).

**Session log entry format** (append to `system/session-log.md`, most recent at top):

```
---
### Session [N] — [Date]

**Phase/step completed:**
**Where to pick up next:**

**What worked:**
-

**What didn't work / got stuck on:**
-

**Learnings:**
-

**Open questions to come back to:**
-
---
```
