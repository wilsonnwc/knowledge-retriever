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
- **IMMEDIATE NEXT:** Commit Session 28's changes (`notes/template.md`, `backend/notes_store.py`, `system/evaluation/run_evaluation.py`, `system/evaluation/test_queries.json`, this file, `system/session-log.md`) — then finish Phase 0 by extracting the service layer (`notes_store`/`embed`/`skills_store`/`events_store`). After Phase 0: Phase 1 (MCP server, read-only, stdio) per `system/learning-os-plan.md` Section G. The pre-existing UI backlog (paste-formatting-assist, URL ingest, Search/Chat still mock) remains parked behind the Learning OS build sequence, not abandoned.
- **Next after that:** Wire the React frontend to the real Flask endpoints (Notes list/detail/tags first, then Import's Confirm step) — the plan doc's Session 4/step 4. Three open UX questions from the user (2026-08-12, still not answered — see session-log Session 19): (1) "Go to article" opens Edit mode, not a read view — fix directly, or first define Read vs. Preview vs. Edit as distinct named UI states? (2) How should the sources elaboration text actually be generated, and should it get eval discipline applied like other AI-generated pieces of this project? (3) Does generating it cost Anthropic API usage, or does it ride on the Claude Pro subscription? From Session 20: history currently only supports fully reopening the *most recent* completed import — older completed imports appear in the list but aren't individually reopenable yet. Deferred: interview-defense drill; 5 "Why this matters" TODOs on Kindle imports; keyword baseline re-run; Layer 3's other two slices (categorization/staleness).

## Roadmap (updated 2026-08-05, after re-reading full job ad's layer structure)

1. **Finish semantic search** — chunking strategy decision → embeddings → Chroma → re-run 28-query test set → compare precision@5 vs. 82% keyword baseline. **Complete: 96% precision@5.**
2. **Project-scoped organization ("project spaces," Layer 2)** — a "project" concept alongside the existing topic taxonomy. This is the most direct match to the actual squad this role would join (LeapSpace's "project spaces" — see `system/job-ad-reference.md`'s "Four-Layer Stack" section). **Complete.**
3. **Evaluation-as-practice writeup** — reframe the existing 18%→82% debugging work as ongoing evaluation *practice* (define → commission → act on results), matching the ad's "commission the evaluations, read the results, turn them into prioritised improvements" language. Mostly narrative/documentation work on what's already built, not new build work — can slot in anytime.
4. **Small Layer 3 taste ("living knowledge base")** — one small, fully-defensible mechanic (e.g. auto-suggest related existing notes when a new one is added to a project), deliberately scoped small enough to explain and defend under a follow-up question rather than a shallow agentic demo. **Complete** (Sessions 13–14) — covers only the "grown from every finding" slice; "structured" and "current" remain untouched.
5. **Layer 4 stretch ("goal-oriented research")** — an iterative research-loop prototype against a stated goal. Explicitly a stretch step, beyond this role's actual scope, built anyway for personal learning value. **Complete** (Sessions 15–16) — three bugs found and fixed, then confirmed clean on re-run, plus a depth/relevance caveat tag and temperature tuning for run-to-run consistency.
6. **Lightweight UI** — a simple web front-end (not just CLI/Terminal), scoped end-to-end at the user's request: chat, search, `--research-goal`, AND article import + tag/project management — everything, not just the query features. Added 2026-08-07. Also framed as useful interview evidence (a working, demoable interface, not just backend logic). **Not started — build-order still undecided.** Options discussed: design the navigation/page shell first and wire in real features after, vs. build feature-by-feature (UI + wiring together each time); user wants to describe a third alternative next session. Design decisions still to make: framework choice (e.g. Streamlit vs. Flask/FastAPI + HTML — Streamlit is usually fastest for a solo Python-backed tool like this) and whether import/tag-editing (genuinely new CRUD code, not yet built in any form) gets its own phase separate from the query features (which just wrap already-working functions).

> **Why sequencing matters here:** Item 2 depends on item 1 the way you'd wait to paint a room until after you've decided where the walls go — a "project" boundary changes how notes get grouped and searched, so building it before retrieval was stable would have meant redoing it once the approach changed underneath it.

**Explicitly out of scope:** building a Notion/Obsidian connector. The role partners with (doesn't own) upload/storage, and the ad's tool-fluency requirement is about being a *user* with informed opinions, not an integration builder. If tool fluency is wanted, that's a "go use Notion/Obsidian and form opinions" activity, not a build task.

> **Why this matters:** It's tempting to build every tool mentioned in a job ad to "prove" fluency, but that would misread the ad — it asks for informed opinions from using tools like Notion/Obsidian, not for shipping an integration with them. Building one anyway would be solving a problem the role doesn't actually own (see `system/job-ad-reference.md` for the "owns vs. partners with" breakdown).

**Future roadmap item — ingestion agent (2026-08-04, not yet started):** Since this project is meant for genuine ongoing personal use (not just an interview artifact), the highest-leverage long-term fix for chunking reliability is upfront, not downstream: an AI-assisted ingestion step that normalizes a new note's structure (adds clear `##` headers, or flags "this note has no clear structure, here's a suggested split") *before* it's saved, rather than asking the chunker to infer structure after the fact from messy text. This is deliberately sequenced after the chunker fallback (see `system/chunking-robustness-learnings.md`) — the fallback protects against whatever imperfect content already exists or arrives from elsewhere, while the ingestion agent reduces how often imperfect content gets created in the first place. Both matter for real use; fallback was prioritized first because it's the closer analog to LeapSpace's actual constraint (no control over source content structure).

> **Analogy:** The chunker fallback is like a spell-checker catching a typo after you've already written the sentence — it's a safety net for messy input you don't control. The ingestion agent is like a form that won't let you submit a messy sentence in the first place — it fixes the problem at the source. LeapSpace can't control how researchers write their source documents (fallback is the realistic analog), but for this project's own notes, catching structure problems at save-time is the better long-term fix — hence why it's sequenced second, as a "nice to have once the safety net already works."

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

## Environment Setup (new sessions)

- **Python 3** — run with `python3 scripts/chat.py` from project root
- **`.env`** — must exist locally (not in git). Contains `ANTHROPIC_API_KEY=...`
- **Packages** — install with: `pip install anthropic python-dotenv`

## Key Design Principles

- Never move to the next step without measuring whether the current one actually works
- No skipping evaluation — retrieval quality must be scored and measurable, not just qualitative
- One step at a time — do not write the whole system upfront
- When there is a design choice (chunking strategy, embedding model, retrieval approach), explain trade-offs and ask before proceeding
- Keep it simple — real enough to discuss in an interview, not production quality
- If something fails, diagnose the root cause — do not just patch it

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
