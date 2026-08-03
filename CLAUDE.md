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
- **Retrieval:** Keyword-only search (no semantic/embedding search yet)
- **Interface:** CLI chat via `scripts/chat.py`
- **Next:** Implement semantic search (embeddings), re-run the same 28 test queries, compare precision@5 before/after

## Roadmap (updated 2026-08-03, after re-reading full job ad)

1. **Finish semantic search** — chunking strategy decision → embeddings → Chroma → re-run 28-query test set → compare precision@5 vs. 82% keyword baseline (current phase)
2. **Project-scoped organization** — explore a "project" concept alongside the existing topic taxonomy. This is the most direct match to the actual squad this role would join (LeapSpace's "project spaces" — see `system/job-ad-reference.md`). Sequenced after semantic search because it depends on the retrieval approach being stable first (a "project" boundary likely affects chunk metadata/scoping).
3. **Evaluation-as-practice writeup** — reframe the existing 18%→82% debugging work as ongoing evaluation *practice* (define → commission → act on results), matching the ad's "commission the evaluations, read the results, turn them into prioritised improvements" language. Mostly narrative/documentation work on what's already built, not new build work — can slot in anytime.

**Explicitly out of scope:** building a Notion/Obsidian connector. The role partners with (doesn't own) upload/storage, and the ad's tool-fluency requirement is about being a *user* with informed opinions, not an integration builder. If tool fluency is wanted, that's a "go use Notion/Obsidian and form opinions" activity, not a build task.

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
| Retrieval (current) | Keyword search | Lightweight, works for small knowledge bases |
| Retrieval (next) | Chroma + embeddings | Semantic search — the core RAG concept |
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
