# Roadmap review: Learning OS phases, re-sequenced (2026-10-11)

**Readable page:** https://claude.ai/artifact/CDoD2AaqP6BbF2goyS7FyK (private).
**Status:** a recommendation for the user to decide on. It doesn't change `learning-os-plan.md` Section G until the user approves.
**Why now:** the plan's phase order was written on 27 Aug, before any real use. Since then, 6 days of real use, three shipped signal builds and the user's own discussion have changed what we know.

---

## 1. The vision these phases serve (user, 11 Oct)

> "Every day, what I read helps me decide what I should learn or build. Then it merges with the knowledge library I built before, to search articles on a topic, prepare for a project, etc."

Broken into the loop the product has to close:

| # | Loop step | Status today |
|---|---|---|
| 1 | **Read**: one daily page where all newsletter content is read | ✅ Built (Phases 2–3): Today page, hosted, full text |
| 2 | **Signal**: every press says something trustworthy | ✅ Mostly built: Useful / Not useful with depth, "seen" impressions. Build is barely used (1 press, a test) |
| 3 | **Decide what to learn/build**: reading turns into a skill and a next step | ❌ **The biggest gap.** No skill map; skills live as prose in `skills-to-learn.md` |
| 4 | **Library**: what I read joins my notes, searchable by topic and for project prep | ❌ **Second gap.** The 545 stored articles (Neon) and the notes (Git + Chroma) are two separate worlds. Search and MCP see only the notes |
| 5 | **Better supply**: ranking learns from my signals | ⏳ Data is accumulating; nothing reads it yet |
| 6 | **Weekly layer**: sources scored, skills moving, one build proposed | ❌ Not started |

## 2. What real use has taught us since August

1. **Most items are market updates and opinion pieces**, not how-tos. Topic matching alone can't tell "about X" from "teaches X". That needs either an explicit tap (Learn) or a small classifier.
2. **"Attention" isn't useful to the user.** They know from their own reading when something deserves building. The skill map should track **level and next steps**, not reading volume.
3. **Build is almost unused** (1 press in 6 days). Wanting to act on articles is real; the button doesn't capture it. That supports turning **Build into Learn**, with sub-options.
4. **Later is barely used** (6 presses, 1 item waiting). So the plan's "Later queue + resurfacing", the original heart of Phase 4, is a minor feature, not the core.
5. **Sources fail silently.** 3 senders dropped out unnoticed in October, simple.ai for 4 months. Reliability of supply is a real, recurring risk.
6. **Reading on the train fails** with poor signal. That's daily friction on the core habit.
7. **Ranking quality is unmeasured.** We can't yet say whether the ranking is the bottleneck. Building agents to fix it (Phases 5–6) before measuring it would be building on a guess.

## 3. Recommended order

### Principles behind the order
- **Close the biggest gap in the vision first** (loop steps 3, then 4).
- **Start collecting signals that can't be backfilled early**, so Learn presses accumulate from day one.
- **Measure before building agents.** Look at the signals cheaply (SQL) before deciding which agents are worth it.
- **Deterministic before AI.** Use a rule, a query or an embedding before an LLM, and an LLM before a multi-agent system. This follows the order in `claude-brain/docs/agent-pipeline.md`.

### Now (the next 1–2 weeks)

| # | What | Why now | Size |
|---|---|---|---|
| **R1** | **Phase 4, re-scoped as the "Learn loop"** (behind a feature toggle): Build → **Learn** with sub-options; a structured **skill map** with levels and evidence; AI **pre-fills the skill** (embedding match) for one-tap confirmation; a **skill page** showing each skill's level, evidence and next steps; Later items linked to a skill resurface there (small). Absorbs: the idea bank (Learn → Build *is* the idea bank), the D2 code question (proposed resolution: keep `read`/`dismiss`, because renaming append-only history isn't worth it), and the rest of Phase 0's service-layer extraction (`skills_store`, `events_store`) | Biggest vision gap (step 3). Learn presses start accumulating as soon as it ships | L (2–3 sessions) |
| **R2** | **Silent-source check** (AI Chief of Staff): flag any sender with no email in N days in the morning digest | 3 silent losses in a month; a cheap, deterministic check. Protects everything downstream | S (under a session) |

### Next (weeks 3–5)

| # | What | Why then | Size |
|---|---|---|---|
| **R3** | **Library merge v1:** Useful and Learn articles become searchable **alongside notes** (Search/Chat and MCP), with "this came from your 9 Oct digest" provenance. Plus **"save a quote to notes"** (propose, don't write: you approve). **Key decision inside it:** keep Chroma (local only) or move vectors into Neon with **pgvector** (one store, searchable from the hosted app and phone, and it unblocks R8) | Vision gap 2 (step 4). Needs R1's Learn data to know which articles matter most | M–L |
| **R4** | **Signal review v0**, after about 3–4 weeks of signals (around early November): SQL analysis, not agents. Useful rate by source and section (**source scorecards**, from the old Phase 8), position-bias check using "seen", the Not-useful reason mix, and a junk-tuning session if one is due. **Output: which ranking problems are real**, which decides R5's scope | Old Phase 7 (error analysis), done cheaply and *before* agents rather than after | S–M |

### Later (gated by data from R1–R4)

| # | What | Gate | Size |
|---|---|---|---|
| **R5** | **First agent in shadow: the Article-Type Classifier Agent** (market update / opinion / how-to / case study / research, plus "teaches a learnable skill?"). Run as **champion/challenger: Haiku vs Jev (System One)**, scored against the user's Learn confirmations as labels. Then the **Gap Agent** (needs the R1 skill map) and the **Novelty Agent** (needs the R3 merged library). The **Verifier Agent** arrives when an agent first makes claims | R1 has produced labels (~2–3 weeks of Learn presses); R4 shows ranking problems these agents would fix | M per agent |
| **R6** | **Orchestrator Agent + arbitration** (old Phase 6) | Only if R4/R5 show that inputs vary enough to justify routing (see the trade-off below) | L |
| **R7** | **Weekly review page:** skill movement, source scorecards, one proposed build | R1 + R4 | M |
| **R8** | **Notes online + remote MCP** (old Phase 9) | R3's storage decision | M |

### Small items: slot in opportunistically

| Item | Recommendation |
|---|---|
| **Offline reading** (train) | **Candidate to promote to "Now"** if it's hurting the daily habit. Cache today's page and its articles on the phone (a service worker/PWA), plus queue presses made offline and send them later (also fixes the "lost offline events" gap). M. *User's call (decision 2 below).* |
| Dark mode (follow the device) | S. Any quiet session |
| Promo-email filter (whole-email junk) | S. Only if promos keep annoying you; R4 will show how often |
| Teach-back / "quiz me" via MCP | After R3: quizzing needs the merged library. Gives evidence for the "can-explain" level in R1's ladder |
| "I don't know this term" flag (pending study) | After R1. Possibly a later Learn sub-option |
| AI Chief of Staff backlog: sender config UI, sender auto-discovery, podcasts, social monitoring, Playwright | Keep parked. Auto-discovery overlaps R2; revisit after R2 |

### The dependency chain in one line
**R1 (skill map + Learn labels)** → R5 Gap Agent, R7 · **R3 (merged library)** → R5 Novelty Agent, teach-back, R8 · **R4 (3–4 weeks of data)** → R5 scope, R6 go or no-go.

## 4. What changed from the August plan, and why

| August plan | Now | Reason |
|---|---|---|
| Phase 4 = skills.yaml + **Later queue** + resurfacing | **Learn loop:** Learn button + skill map + skill page; Later is minor | Real use: Later is rarely pressed; the skill signal sits in Useful and Learn |
| Skill map tracks reading **attention** plus level | **Level, evidence and next steps only** | User: attention adds nothing; they judge from their own reading |
| Phases 5–6 (agents) straight after Phase 4 | **Measure first (R4)**, then the smallest agent (R5) | Ranking quality is unmeasured; don't build agents on a guess |
| Error analysis (7) **after** agents | Moved **before** agents, done cheaply in SQL (R4) | Its output should decide which agents to build |
| Notes online (9) **last** | **The library merge (R3) moves up**; hosting notes (R8) stays later | User's vision: reading merges with the library. Search is half the product's value |
| No reliability work | **Silent-source check (R2)** | 3 silent source losses in October |

## 5. Decisions for the user

1. **Approve this order** (R1 → R2 → R3/R4 → R5…), or change it.
2. **Offline reading:** promote it to "Now" (after R1), or keep it as an opportunistic item?
3. **The multi-agent trade-off (R6):** at about 100 items a day for one user, a fixed pipeline may honestly be enough. The Orchestrator Agent is justified mainly by your **interview goal** (the multi-agent demo), not by product need. Two options:
   - keep R6 as a deliberate skill-building build, labelled as such
   - drop it, and use "knowing when not to build an orchestrator" as the interview story

   Both are defensible. *Recommendation: decide after R4/R5 data, not now.*

## 6. A reminder: the AI Chief of Staff roadmap (user asked)
- **Phases 1–3 are complete** (manual validation → Gmail API pipeline → automated daily email). Since 27 Sep, its main role is the **content supply for the Learning OS**: nightly ingestion into Neon, the junk filter and the junk-correction loop.
- **Its own backlog** (`enhancement_backlog.md`):
  - a sender config UI
  - auto-discovery of new senders
  - podcast ingestion
  - social monitoring (X and Reddit)
  - Playwright for cookie-walled articles
  - a minimum-content threshold
- **None of these are scheduled.** R2 (the silent-source check) is the one item recommended now. Sender auto-discovery is its natural follow-up.
