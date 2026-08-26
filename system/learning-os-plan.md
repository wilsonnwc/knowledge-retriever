---
name: learning-os-plan
description: End-to-end plan for evolving knowledge-retriever into a multi-agent learning operating system, fed by ai-chief-of-staff
metadata:
  type: project
  status: draft-for-review
  drafted: 2026-08-27
---

# Learning OS — End-to-End Plan

**Status:** Draft for review (2026-08-27). Not started.

**Readable version (3-column, with "Plain English only" and "Decisions only" toggles):**
https://claude.ai/code/artifact/67345e9a-61a6-4b96-82b1-bb27b3dadf65

**One-line goal:** Spend less time each day, have more *suitable* knowledge surfaced, and turn each item into either something read now or something built to close a named skill gap.

Three columns throughout:
- **The Plan** — technical, precise
- **In plain English** — no jargon
- **Decision & trade-off** — what we chose, what we rejected, why

---

## A. What we're building

| The Plan | In plain English | Decision & trade-off |
|---|---|---|
| **The reframe.** Intake becomes subordinate to a skill-gap model. Ranking is a function of knowledge state + active project gaps, not a static category hierarchy. | Today your digest ranks by fixed topic priority (product management first, AI second…). It has no idea what you already know or what you're trying to learn. We flip it: start from your skill gaps, judge every article against those. The reading list becomes a by-product of your learning plan. | **Extend knowledge-retriever into the hub**, don't start a sixth project. Trade-off: its identity shifts from "RAG demo" to "learning OS," which changes the interview story — but avoids fragmenting five projects further. |
| **Outcome target.** Reduce daily triage time; raise precision of surfaced items; every item resolves to (a) immediate read or (b) a scoped build task closing a named gap. | Less time daily. Fewer, better items. Each one ends in one of two places: read it now, or build something to actually learn it. | — |
| **Already flagged.** `skills-to-learn.md` line 40: *"Wire ai-chief-of-staff's daily pipeline in as a real living-memory data source. Flagged, not started."* | You'd already identified this integration months ago. This plan is finally executing it, not inventing it. | — |

---

## B. Architecture

| The Plan | In plain English | Decision & trade-off |
|---|---|---|
| **Service layer.** Extract `notes_store` / `embed` / `skills_store` / `events_store` as a shared core. Flask routes and the MCP server become thin adapters over it. Neither adapter calls the other. | One set of core functions that do the real work — find a note, save a note, list skill gaps. Two different doors into them: the website, and a door AI assistants can use. Both doors open into the same room, so they can never disagree. | **MCP tools call the service layer directly, not via HTTP to Flask.** Rejected proxying: it creates two sources of truth and doubles the failure surface. Bonus: makes the storage decision cheap to change later, since it's isolated in one place. |
| **MCP server.** Expose read tools (`search_notes`, `get_note`, `suggest_related`, `research_goal`, `list_skill_gaps`). stdio transport first; remote HTTP once hosted. | MCP is a standard plug that lets AI assistants use your tools. Building one means Claude — and your own agents — can search your notes directly. Start with the version running on your Mac. | **MCP now, not later.** Costs ~a day more than a private connection, but closes a confirmed skill gap (named in the ICIS role) and is genuinely the better architecture. Immediate win: ask Claude Desktop about your notes, weeks before hosting exists. |
| **Propose, don't write.** Agent writes land in a review queue (`propose_note`); human approval promotes into the corpus. | AI never writes into your knowledge base directly. It drafts; you approve. Same principle as the import wizard's confirm step. | **Propose over direct save.** Trade-off: one extra click per note. Chosen because silent corruption of the knowledge base would poison everything downstream that depends on it. |
| **Notes storage: git.** Markdown files persisted via git-as-storage. Server commits and pushes; both laptops sync through the existing workflow. | Your notes stay as plain text files stored in GitHub. When the website saves one, it commits it — so your laptop gets it with a normal `git pull`. Free, fully versioned, any change undoable. | **Git over a paid disk.** Trade-off: saves take ~2 seconds instead of instant, and edit conflicts are possible (low risk, single user). Chosen because *you edit notes locally in an IDE* — a server disk would silently become a third, diverging copy with no sync between it and your two laptops. |
| **Vector index: rebuildable cache.** Chroma treated as derived state, not durable storage. On loss, re-embed from notes. | The search index is generated *from* your notes, so it can always be rebuilt — you did exactly that three times in one session. If the server loses it, it regenerates in seconds for a fraction of a penny. | **Cache, not database.** Means it needs no expensive protected storage. Revisit only if the corpus reaches thousands of notes. |
| **Event log: managed Postgres** (Neon/Supabase free tier). Append-only. Store events, not aggregates. | Every action you take — read, save, dismiss — recorded as a dated event in a proper database. We keep raw events rather than summaries so we can answer questions later that we haven't thought of yet. | **Managed Postgres over self-managed disk.** Trade-off: one more service to set up. Chosen because this is the single dataset that *cannot be recreated*, and a managed service gives you backups for free. |
| **Hosting: staged.** Stage 1 hosts the triage surface only. Stage 2 brings notes + search online. | Put it on the internet in two steps. First just the daily "what should I read" page — that's what you need on your phone. Full note browsing comes later. | **Stage it.** Trade-off: two deployments instead of one. Chosen because stage 1 doesn't need the notes-storage problem solved, so it ships far sooner. |
| **Auth: Cloudflare Access** in front of the app. No auth code in Flask. | A login gate sitting in front of your site, run by Cloudflare, free, using your Google account. You write no login code at all. | **Non-negotiable prerequisite.** The current API has *no authentication* — `DELETE /api/notes/{id}` is wide open. Publishing as-is would let anyone read, edit, and delete your notes and burn your API budget. |

---

## C. The agent system

| The Plan | In plain English | Decision & trade-off |
|---|---|---|
| **Main orchestrator.** An agent whose *tools are the sub-agents*. Decides which to invoke per item and per run. Constrained, enumerable action space. | One "manager" AI that looks at each incoming article and decides which specialists to consult — and can skip ones not worth the cost. It can only pick from a fixed list of moves. | **Constrained action space over free-form planning.** Trade-off: less flexible. Chosen because every decision stays loggable and testable, which keeps the evaluation story intact. An unconstrained planner would wreck it. |
| **Why an orchestrator is warranted.** Input heterogeneity: full article, paywalled stub, essay newsletter, job ad, changelog — each warrants different handling. | A fixed assembly line would run every specialist on every item and waste most of the work. A 40-word stub doesn't need deep analysis; a job ad should go to gap-detection, not note-drafting. | Justified by real input variety, not fashion. A fixed pipeline would be the simpler and legitimate choice if inputs were uniform — they aren't. |
| **Scoring sub-agents.** Novelty (semantic distance from existing notes), Gap (does it close an open item from `research_goal`?), Authority (source credibility, weighted by authors already trusted in your base). | Three specialists, each judging one thing. Is this new *to me*? Does it close a gap I actually have? Is the source one I trust? | Each makes a **checkable claim**, which is what makes agent-level evaluation possible. |
| **Verifier: a gate, not a scorer.** Checks other agents' claims (do the cited notes exist? do they cover what's claimed?). Hard veto. | A fact-checker whose only job is checking the other AIs' homework. If a claim doesn't hold up, the item is dropped regardless of its scores. | **Gate over score.** This is agent-checking-agent — a genuinely distinct pattern, and the mitigation for the highest hallucination risk in the system. |
| **Conflict resolution: policy + gate + escalation.** (1) Documented precedence rules, (2) Verifier veto, (3) escalate to a stronger model only when bids diverge past a threshold. | When specialists disagree, they don't argue. Three mechanisms: written rules about who wins when; a fact-checker with a veto; and if they're genuinely split, hand it to a smarter, more expensive model with all the evidence. | **Chosen over agent debate.** Trade-off: less flashy. Debate is expensive, slow, and *very hard to evaluate*. A written policy encodes your product judgement in something you can read, version, and test. Knowing when not to reach for the fashionable pattern is the stronger signal. |
| **Attention budget.** Editor operates under a hard time budget and may return fewer than N items — including zero. | You say "I have 15 minutes." It fills that and no more. If nothing clears the bar, it says so rather than padding. | **Explicit permission to under-deliver.** Your Aug 23 digest padded a Top 3 with an item whose own justification admitted it didn't fit. Trade-off: some days return nothing, which can feel like failure — it isn't. |
| **Cost cascade.** Cheap model batch-scores all candidates; expensive model only arbitrates the shortlist and handles escalations. | Use the cheap fast AI for the first pass on everything, and only pay for the expensive one on the handful that matter. | **Cascade over uniform model use.** Keeps cost near today's levels (roughly +30%) despite many more agents. Without it, N agents × M articles × a big model gets expensive fast. |
| **Downstream agents.** Note-drafter (fills your exact schema), Build-task planner (decides read-closeable vs build-closeable vs opportunity-only). | Two more specialists at the end: one drafts the note for you to approve, one decides whether this gap is closed by reading, by building, or only by a real-world opportunity. | The read/build/opportunity split is **your own distinction**, taken from the "commercial spokesperson" entry in your skills list. |

---

## D. Evaluation

| The Plan | In plain English | Decision & trade-off |
|---|---|---|
| **Two-tier eval.** Agent-level (each agent's claim is checkable) plus system-level (time-to-value, gap-closure rate). They can disagree. | Test each specialist on its own, *and* test whether the whole thing actually helps you. Both matter — and when they disagree, that's the interesting finding. | The disagreement case is the senior-level story: every component can score well while the system output is bad, or one broken agent can hide behind the others. |
| **Top-down eval: invariants.** Citation integrity, coverage arithmetic, schema validity. Cheap structural checks, every run. | Rules you write in advance that must always hold — "every source it cites must actually exist." Fast, cheap, run every single time. | Reuses the structural-validation approach you invented in Session 17 for `research_goal`. |
| **Bottom-up eval: error analysis.** Open coding of real traces → axial coding into failure modes → prioritise by frequency × severity → one **binary** judge per mode. | Read a pile of real output, jot down what's wrong in your own words, cluster those notes into recurring problems, then turn each problem into a single yes/no automatic checker. | **Free-text dismiss reasons at launch, not pre-set categories.** Trade-off: slightly slower to click. Chosen because pre-set categories would just encode *my* guesses about your failure modes — the categories must be discovered from your real data. |
| **Judge validation.** Measure agreement (precision/recall) against a human-labelled sample before promoting a judge into CI. | An automatic checker you haven't verified is just another guess you've started trusting. Test it against your own judgement first. | The step almost everyone skips. Roughly half the time, disagreement reveals *your criterion was vague* — not that the checker was wrong. |
| **Champion/challenger.** New or changed agents run in shadow against the incumbent; promoted only on measured improvement against a locked set. | A new AI component runs silently alongside the current one. You compare. It takes over only if it actually wins. | **Shadow mode is the permanent deployment mechanism**, not a one-off experiment. Means you never have a "we'll evaluate it later" moment. |
| **Restraint eval.** Negative test cases where the correct output is fewer items, or none. | Test that it correctly says "nothing worth your time today." Almost every eval set tests finding things and never tests declining. | Aimed squarely at a failure you have documented evidence of. |
| **Labels: implicit primary.** Triage actions are the labels. Explicit 1–5 scoring becomes a monthly calibration sample (~15 items). | Your normal clicks *are* the scoring — no separate daily rating chore. Once a month, a short proper scoring session checks the clicks still reflect what you value. | **Implicit-primary over daily explicit.** Chosen because daily manual scoring is exactly the time cost this product is meant to remove — and you told me the command-line version isn't usable in practice. |
| **Cadence.** Structural checks every run; binary judges weekly; error analysis + eval-set validity review monthly. | Cheap checks constantly, moderate checks weekly, deep review monthly. | **Tiered because evaluation costs money too.** Running LLM judges on everything daily would be a real expense. |
| **Single-annotator mitigation.** Re-annotate the same ~20 traces two weeks apart; measure self-agreement. | You're the only judge, so there's no second opinion. Instead, rate the same 20 items twice, two weeks apart. If you disagree with yourself often, your criteria are unclear — and no automatic checker can fix that. | Being able to say this in an interview is a strong signal. |
| **Eval debt (live).** 20 of 28 locked queries in `test_queries.json` reference files renamed/deleted by the Session 22 consolidation. | Your existing search test is currently broken — it points at files that no longer exist under those names. | **Promoted from "deferred" to prerequisite.** The Novelty agent's value rests entirely on retrieval quality; you can't trust an agent whose foundation is unmeasured. |

---

## E. The daily experience

| The Plan | In plain English | Decision & trade-off |
|---|---|---|
| **Today page.** Mobile-first card stack. Four actions: Read now / Later / Build / Dismiss (+ free text). Every action emits an event. | One page, a stack of cards, four buttons. That's the entire daily interaction. | **Four verbs, fixed. "Build" is first-class**, not an afterthought — that's the read-to-do bridge you asked for. Mobile-first because commute triage is the real use case; the current 6-column table is desktop-only. |
| **Filtered-out transparency.** Show excluded items with reasons. | It also shows what it decided *not* to show you, and why. | Builds trust and lets you catch mistakes — maps onto the Google PAIR calibrated-trust material already in your notes. |
| **Later queue with resurfacing.** Items tagged by skill; resurface when that skill becomes active. | "Later" isn't a graveyard. Items are tagged to a skill, and when you start work touching that skill, they come back. | **Resurface on skill-activation, not time-based reminders.** This is the thing every read-later app fails at. |
| **Skill map.** `skills-to-learn.md` becomes structured: id, level, closure mode, evidence links, status. Levels: heard-of → can-explain → have-built → can-teach. | Turn your skills list into proper data with levels. You don't declare a level — you link evidence (a note, a commit, a written explanation) and that earns the promotion. | **Evidence-based promotion over self-declaration.** Your doc is already a skill ladder in prose; this just gives it structure so things can be ranked against it. |
| **Build tasks.** Scoped spec: what to build, which skill it closes, which project it lands in, rough size, acceptance test. | Instead of "here's an article about X," you get "build this small thing, in this project, about two hours, and you'll know it worked when…" | Matches how you actually learn. Your own MCP entry already reads like this. |
| **Teach-back.** Prompt to explain a gap from memory; graded against your own notes. | The system asks you to explain something without looking, then checks your answer against what you've saved and flags what you missed. | Retrieval practice is the highest-leverage learning intervention for interview prep — and your skills doc already contains the questions. Also attacks "interview-defense drill, deferred 3 sessions running." |
| **Weekly review page.** Source scorecards, skill movement, one proposed build task. | A weekly page: which sources earned their keep, what skills moved, and one thing to build next. | — |

---

## F. Sources

| The Plan | In plain English | Decision & trade-off |
|---|---|---|
| **Source scorecards.** Per source: hit rate, unique contribution, lead time, action mix (reads vs. builds). | Score each newsletter like an investment. How often does it produce something you act on? Is it just duplicating others? Is it first or last? Does it produce reading, or building? | **Action-mix included specifically** because you said you engage most with practical, buildable content — so a source producing build tasks is worth more to you than one producing think-pieces. Nothing measures that today. |
| **New source classes.** Job ads (gap detection), tool changelogs, conference-recorder transcripts, your own git history. | Beyond newsletters: job ads are a superb gap detector (what do these roles want that you don't have?), changelogs for tools you actually use, talks you record, and your commit history as evidence of what you've built. | **Job ads named as the highest-value addition** — uniquely fitted to your actual goal, and you already save one manually. |
| **Source trialling.** A/B a new source for two weeks, measure hit rate, keep or drop. | Add a source on trial, measure it, keep it only if it earns its place. | Turns "should I subscribe to this?" into a measured decision. |

---

## G. Build sequence

Ordered by dependency and by what cannot be recovered later.

| Phase | The Plan | In plain English |
|---|---|---|
| **0** | Repair eval debt; extract the service layer | Fix the broken search test; reorganise the code so both doors open into the same room |
| **1** | MCP server, read-only, stdio | Build the AI plug. Immediate payoff: ask Claude Desktop about your notes |
| **2** | Event log + Today page (local) + free-text dismiss | The daily page with four buttons, and the recording of every click |
| **3** | Hosting stage 1 + Cloudflare Access | Put it online behind a login — now it's on your phone |
| **4** | `skills.yaml` + Later queue + resurfacing | Structured skill map; "later" items that come back when relevant |
| **5** | First agents in shadow (Novelty, Gap) + Verifier gate | First two specialists, running silently alongside today's ranking, plus the fact-checker |
| **6** | Orchestrator + arbitration policy + escalation | The manager AI, the written tie-break rules, and the escalate-when-split path |
| **7** | Error analysis → binary judges | After ~2 weeks of real data: read it, find the patterns, build automatic checkers |
| **8** | Source scorecards + build tasks + weekly review | The weekly layer |
| **9** | Notes online (git-as-storage) + remote MCP | Full note browsing and search from anywhere |

> **Sequencing principle:** instrumentation (phase 2) is the one thing that cannot be backfilled. Every day without it is data destroyed forever. If anything slips, don't let it be that.

---

## H. Still open

| Question | Notes |
|---|---|
| Which host? | Fly.io vs. Railway vs. Render. A detail, but affects volume pricing. |
| Keep the email digest? | Recommendation: keep it as the *notification*, linking into the hosted Today page. |
| Shared eval harness across both projects? | Asked earlier, never answered. Elegant and impressive to explain, but real refactoring — knowledge-retriever measures precision@5 and structural validity; chief-of-staff measures MARE. |
| Naming | Does this stay "knowledge-retriever," or does the hub get its own name? |
