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

- **Cross-project learnings (short, interview-ready bullets):** `/Users/wilsonnwc/Tech/AI/learnings.md` — see the "Knowledge Retriever" section. This is the fastest way to recall what was learned without re-reading full write-ups.
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

- **Phase 1–3:** Complete. ~26 real notes indexed across 10 topic folders.
- **Phase 3.5:** Complete. Keyword search evaluated against 28 test queries — corrected baseline is **82% precision@5** (see "Where to Find Learnings" below for why the first raw result was 18%, and what that taught us).
- **Phase 4:** Complete. Semantic search (OpenAI `text-embedding-3-small` + Chroma) built and evaluated on the same locked 28-query set — **96% precision@5** vs. 82% keyword baseline. See `system/session-log.md` Session 10.
  > **Plain-English translation:** "Precision@5" means "of the top 5 results a search returns, what fraction were actually relevant?" A perfect 100% would mean every single one of the top 5 results was a good match. Semantic search landing near-perfect (96%) versus keyword search's 82% is the concrete evidence that matching by *meaning* beats matching by *literal words* for this note collection.
- **Retrieval:** Both keyword (`search_notes()`) and semantic (`search_notes_semantic()`) search implemented in `scripts/chat.py`; semantic is the stronger of the two per evaluation
- **Interface:** CLI chat via `scripts/chat.py`
- **Next:** Project-scoped organization (Roadmap item 2 below)

## Roadmap (updated 2026-08-03, after re-reading full job ad)

1. **Finish semantic search** — chunking strategy decision → embeddings → Chroma → re-run 28-query test set → compare precision@5 vs. 82% keyword baseline. **Complete: 96% precision@5.**
2. **Project-scoped organization** — explore a "project" concept alongside the existing topic taxonomy. This is the most direct match to the actual squad this role would join (LeapSpace's "project spaces" — see `system/job-ad-reference.md`). Sequenced after semantic search because it depends on the retrieval approach being stable first (a "project" boundary likely affects chunk metadata/scoping).
3. **Evaluation-as-practice writeup** — reframe the existing 18%→82% debugging work as ongoing evaluation *practice* (define → commission → act on results), matching the ad's "commission the evaluations, read the results, turn them into prioritised improvements" language. Mostly narrative/documentation work on what's already built, not new build work — can slot in anytime.

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

**Topic folders:** product-strategy, design, discovery, stakeholder-management, vibe-coding, ai-products, ai-general, product-organisation, communication, leadership

**Cross-cutting tags:** favourite, foundational-knowledge, revisit, job-application

**Content types:** quote, own-note, book, article, podcast, video

Never create a `notes/` subfolder not on the taxonomy list. Add to taxonomy first, then create the folder.

## Note Format

Each note is a markdown file with YAML frontmatter:
```
---
title:
source:
url:
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
| A surprising, non-obvious, or interview-worthy insight comes up | Append a compressed bullet to `/Users/wilsonnwc/Tech/AI/learnings.md` under the Knowledge Retriever section (match the existing bullet length/format there — do not paste full write-ups) |
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
