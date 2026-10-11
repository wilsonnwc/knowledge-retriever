# Spec: Phase 4, the "Learn loop" (Learn button, skill map, skill page)

**Status:** DRAFT. Stage 1, Specify. The questions in section 7 need the user's answers before the lock · **Size:** Full (new feature, data model, several sessions) · **Owner (what/why):** PM (the user) · **Builder (how):** Claude
**Created:** 2026-10-12 · **Locked:** — · **Shipped:** —
**Repos/areas touched:** knowledge-retriever (Neon migrations, `backend/`, `frontend/src/components/TodayView/`, a new skill page); `claude-brain/skills-to-learn.md` (seed data).
**Context:** [`system/roadmap-review-2026-10-11.md`](../roadmap-review-2026-10-11.md) (this is R1), [`system/signal-model.md`](../signal-model.md), and the Learning OS plan, Section E ("Skill map", "Later queue").

---

## 1. Problem ★
- The product's vision is that **what I read each day helps me decide what to learn or build** (user, 11 Oct). Nothing does that today:
  - Skills live as prose in `skills-to-learn.md` (16 open items), disconnected from reading.
  - The intent to act on an article has nowhere useful to go. Build has been pressed **once in 6 days** (its note, "Ijk", looks like a test), and nothing happens to a Build press afterwards.
  - Most articles are market updates or opinion. Topic matching alone can't tell "about X" from "teaches X", so the user's own judgement has to be captured explicitly.
- Real use (4–11 Oct): 33 Useful, 21 Not useful, 6 Later, 1 Build. Later is rarely used, so the August plan's centre for Phase 4 (a Later queue with resurfacing) is not where the value is.

## 2. Outcome and how we'll know ★
- **Outcome:** an article that contains something worth learning becomes, in one deliberate action, a **next step under a named skill**. A skill page then shows, per skill, my level, my evidence and my queued next steps (build ideas, deep dives). That's where I decide what to learn or build next.
- **Proposed success measures** (*the PM to confirm or replace, see Q1*):
  - **Use:** in the 3 weeks after switching on, the skill page collects at least 5 Learn items across at least 3 skills, and I start at least 1 build or deep dive from it.
  - **AI quality (measured, not a launch gate):** the pre-filled skill is accepted unchanged at least 60% of the time. The skill I pick is among the top 3 suggestions at least 80% of the time. This feeds R5 (the classifier agent).
  - **Levels move on evidence:** at least 1 skill moves up a level with linked evidence within a month.

## 3. Scope ★
**In:**
- **Build → Learn.** The 🛠 Build toggle becomes 📚 **Learn**: a flag beside any status, as Build is today. On the card and in the reader.
- **The Learn panel** (same interaction pattern as the Not-useful reasons; see section 8 for the sub-option analysis):
  - **"Learn what?":** up to 3 suggested skill chips (the best is pre-selected), plus "New skill…" (text).
  - **"How?":** multi-select chips. Proposed: 🛠 **Build** · 📚 **Deep dive** (*see Q2*).
  - An optional note, then ✓ / ✕.
- **The skill map:** skills with name, description, **level** (heard-of → can-explain → have-built → can-teach), status (active / parked / done) and **evidence** (links or notes). It's seeded once from `skills-to-learn.md`'s open items, and the user reviews the import.
- **The skill page:** each skill shows its level, its evidence, its Learn items (build ideas and deep dives, with links to the articles) and any Later items matched to it. The user can change a level only by adding evidence, can edit or merge skills, and can mark a Learn item done.
- **Skill suggestions:** embedding similarity between the article (title + summary) and each skill (name + description). The suggestions shown and the skill finally chosen are both logged, so suggestion quality can be measured.
- **Feature toggle:** everything above sits behind `FEATURE_LEARN`. Off = today's page, exactly. It can be on locally and off on the hosted page, or the reverse.

**Out (non-goals):**
- Any change to the ranking (R4/R5).
- An article-type classifier (market update, how-to and so on): that's R5, which uses this build's Learn presses as labels.
- The library merge and searching articles alongside notes (R3).
- Automatic level changes: the user sets levels, with evidence.
- Showing skills on the Today page (for example a "matches your focus skill" badge). Possibly later.
- Teach-back, quizzing, the weekly review page (later items).
- Renaming the stored `read`/`dismiss` codes (D2: see D5).

## 4. Acceptance criteria ★ (draft. IDs are stable; the "Verified by" lines are written before the build)

| ID | Criterion | Verified by | Result | Evidence |
|---|---|---|---|---|
| AC1 | With `FEATURE_LEARN` off, the Today page and the API behave exactly as now (Build shown, no skill page) | Existing test suites pass unchanged, plus a toggle-off test | — | |
| AC2 | With it on, 📚 Learn replaces 🛠 Build on the card and in the reader. Tapping it opens the Learn panel; ✕ saves nothing | React tests; design quick check at 390px and desktop | — | |
| AC3 | The panel shows at most 3 suggested skills, the top one pre-selected, plus "New skill…". Confirming takes **at most 3 taps** (Learn → a "How?" chip → ✓) when the top suggestion is right | React tests; manual walk-through on a phone | — | |
| AC4 | ✓ stores one `learn` event with the item, the chosen skill (or the new skill's name), the "How?" modes, the note, the **surface**, and **the suggestions shown, in order** | Backend tests; a database read-back | — | |
| AC5 | Tapping Learn again undoes it, as Build does today. The old `build` events still display (as Learn → Build) | Backend and React tests | — | |
| AC6 | The skill map is seeded from `skills-to-learn.md`'s open items. The import is shown to the user for review before it's saved | Import dry-run output reviewed by the user | — | |
| AC7 | The skill page lists each skill's level, evidence, Learn items (linked to their articles) and matched Later items. A level change requires an evidence entry | React and backend tests; design quick check | — | |
| AC8 | A "New skill…" from the Learn panel creates a skill marked *new*, which appears on the skill page for review | Backend test | — | |
| AC9 | Suggestions come back in under 1 s on the hosted page and cost well under $0.01 a day | A timing log; usage on the embedding provider's dashboard | — | |
| AC10 | Suggestion quality is measurable: one query gives the acceptance rate (top suggestion kept) and the top-3 hit rate | Saved query, run on test data and then on real data after 2 weeks | — | |

## 5. Edge cases and failure states
- **The suggestion service is down or slow** (more than 1 s): show the skill list without pre-selection, alphabetically. Learn must never be blocked by the AI.
- **No skill is a good match** (best similarity below a threshold): don't pre-select; show "New skill…" first.
- **A market update the user marks Learn anyway:** allowed. The user's judgement wins; that's the point of the explicit tap.
- **The same article is learned under two skills:** allowed (one event per skill). *Or one event with several skills? Plan decision.*
- **A skill renamed or merged later:** Learn items follow the skill's id, not its name.
- **Offline:** the press fails with the existing error, as other presses do. (Offline queueing belongs with the offline-reading item.)
- **390px phone:** the panel's chips wrap like the Not-useful reasons.

## 6. Decisions (locked)
*None yet. Proposed:*
- **D1 (user, 11 Oct): drop "attention" as a skill-map measure.** The skill map tracks level, evidence and next steps only.
- **D2 (user, 11 Oct): rename Build to Learn, with sub-options.**
- **D3 (user, 11 Oct): an explicit tap is the source of truth for "this teaches a skill I want".** AI suggests, the user confirms. Every confirmation or correction is a free labelled example for R5.
- **D4: Learn stays a flag beside the reading status**, as Build is now. "Useful + Learn" is the expected combination.
- **D5 (resolves the open D2/Q1 from the Useful/Not useful spec): keep the stored codes `read`/`dismiss`.** Renaming would mean rewriting append-only history, or mapping two codes for ever, for a cosmetic gain. New behaviour gets new, self-describing codes (`learn`).

## 7. Open questions (for the user; answer in any order)
- **Q1, success:** keep, edit or replace the proposed measures in section 2?
- **Q2, Learn sub-options:** Build + Deep dive at launch (recommended), or add a third, "Apply at work"? See the analysis in section 8.
- **Q3, where skills live:** Neon (recommended) or a file? See section 8.
- **Q4, baseline labels:** before the build, will you label about 15 recent Useful articles with their skill (about 10 minutes, in a simple list I prepare)? It gives the suggester a measured baseline on day one instead of three weeks later.
- **Q5, Later resurfacing:** keep it small (Later items appear under a matched skill on the skill page), or drop it from v1, given Later is rarely used?

---

## 8. Plan notes (draft, for the Plan stage after the lock)

### The Learn sub-options, worked through
Each candidate was tested against four questions: what happens next, what it says about the skill, whether it overlaps an existing action, and whether it maps to the plan's own **closure modes** (read-closeable / build-closeable / opportunity-only, the user's own distinction in the Learning OS plan).

| Candidate | What happens next | Level path | Overlap | Verdict |
|---|---|---|---|---|
| **🛠 Build** | A build idea queued under the skill (this *is* the planned "idea bank") | → have-built | None | **Keep** (build-closeable) |
| **📚 Deep dive** | A study item under the skill. Later: related articles and notes gathered for it (R3) | → can-explain | None | **Keep** (read-closeable) |
| **🔁 Revisit** | "Come back to this article" | — | **High:** Later already means "read later", and R3 makes every Useful article searchable, so a reference copy needs no tap | **Drop.** The two meanings it could have are covered elsewhere |
| **💼 Apply at work** | Note an opportunity to use it at work | → have-built (on the job) | Low | **Candidate** (opportunity-closeable). Fits the plan's third closure mode, but adds a third chip. *User's call (Q2)* |
| **🗣 Practise / explain** | A teach-back prompt | → can-explain / can-teach | None | **Later:** it needs teach-back (after R3) to have a next step |

Recommendation: **Build + Deep dive at launch, multi-select**, keeping the panel light. Add "Apply at work" if the user wants all three closure modes from day one.

### Where skills live (Q3)
- **Recommended: Neon (`skills` and `skill_evidence` tables).**
  - Private: the knowledge-retriever repo is public, and personal skill gaps shouldn't sit in its files.
  - Editable from the phone.
  - Joins directly to events.
  - After the import, Neon is the **source of truth for skills**. `skills-to-learn.md` keeps its "Open tasks" list and points to the skill page for skills, so there aren't two diverging copies.
- **Alternative:** `skills.yaml` in claude-brain (private, edited in the IDE). Easy to edit by hand, but the hosted app can't read it, and edits from the phone are impossible.

### Technical sketch (to be confirmed at Plan)
- **Events:** a new `learn` action with `skill_id`, `learn_modes`, `reason` (the note), `surface`, `suggested_skill_ids`. Old `build` rows are read as Learn → Build.
- **Embeddings:** OpenAI `text-embedding-3-small` (already used for notes). Skill vectors are cached; an article is embedded when its Learn panel first opens and then cached. Cost: about 100 tokens per article, so a fraction of a cent a month.
- **Feature flag:** the server reads `FEATURE_LEARN`, and `/api/session` tells the page which features are on.
- **Phase 0 remainder:** `skills_store` and `events_store` are extracted as part of this build (the plan's service layer), not separately.

### Eval flag (per "Eval Discipline")
- **This adds a new AI component (the skill suggester), so it needs its own eval set:**
  - each item paired with the skill the user chose, built from the Learn confirmations
  - seeded by Q4's ~15 hand labels
  - The metric is in AC10.
- The skill suggester is also R5's first labelled dataset (Haiku vs Jev).
- **Data shape change:** the event log gains `learn` with skill links, so `signal-model.md` will need a section on skills.

### Agents and automation for this build
| Stage | Automated help | Kind | Exists / proposed | Human gate |
|---|---|---|---|---|
| Build | Backend tests (throwaway schemas, no session `SET`); React tests | Deterministic | Exists | — |
| Build | Production build before every push (`CI=true npm run build`) | Deterministic | Exists (from 11 Oct) | — |
| Review | `/code-review`; design quick check, then a detail check before calling it done | Subagent / multi-agent skill | Exists | Trade-off findings go to the user |
| Data | Seed-import dry run | Deterministic script | Proposed | **The user reviews the import** |
| AI quality | Suggestion acceptance query (AC10) | Deterministic query | Proposed | User reviews it after 2 weeks |
| Release | Migrations on live Neon; toggle on | Manual | Exists | **The user's OK for migrations and the toggle** |

No new agent in this build. The first agent is R5, which needs this build's labels.

## 9. Tasks
*After the lock.*

---

## 10. Change log
| Date | Change | Why | ACs affected | OK'd |
|---|---|---|---|---|

## 11. Spec vs reality (retro) ★
- **What the spec got right:**
- **What it missed (found during build or QA):**
- **What changed and why:**
- **What I'd specify differently next time:**
