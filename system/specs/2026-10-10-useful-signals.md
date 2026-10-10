# Spec: Useful / Not useful signals on the Today page

**Status:** SHIPPED, pending AC7 (locked 2026-10-10 on the user's "go build and push it") · **Size:** Full (it changes the events table), but small · **Owner (what/why):** PM (the user) · **Builder (how):** Claude
**Created:** 2026-10-10 · **Locked:** 2026-10-10 · **Shipped:** 2026-10-11 (`42f83d7`)
**Repos/areas touched:** knowledge-retriever only: `db/migrations/005`, `backend/today_store.py`, `backend/routes/today_routes.py`, `frontend/src/components/TodayView/`, `frontend/src/api/client.js`. AI Chief of Staff was checked and is not affected: it reads only `build` and `not_junk` events.
**Data contract:** [`system/signal-model.md`](../signal-model.md)

---

## 1. Problem ★
- "Completed" mixes up "I read it" with "it was worth reading", and it can't tell a summary read from an article read. A ranking review built on it would learn the wrong lessons.
- Evidence (live data, 10 Oct): 31 Completed and 14 Skip presses, with no value signal. 28 of 30 Completed items had been opened, but nothing says whether the article itself was worth it.

## 2. Outcome and how we'll know ★
- Every decision on the Today page records **value** (useful or not) and **where it was judged** (summary card or article reader), at the same number of taps as today.
- Signal: from 11 Oct, new `read`/`dismiss` events carry a non-null `surface`, and the four surface × value combinations can be counted with one query (section 8).
- The ranking-review use (periodic, not live) is a later build. This one only makes the data exist.

## 3. Scope ★
**In:**
- Relabel "Completed" → **Useful** and "Skip" → **Not useful**, on both the card and the reader. Later and Build are unchanged.
- Record `surface` (`card` / `reader`) on each press.
- Not useful still asks for reasons (multi-select, optional, as now). The reader adds a **"Summary was enough"** reason.
- Migration 005: an additive, nullable `surface` column.

**Out (non-goals):**
- Skimmed vs read fully (dropped by the user: too hard to judge).
- Using the signals to change the ranking (periodic review, a later build).
- Re-labelling old presses (they keep `surface` NULL, see signal-model.md).
- Retrying presses made offline (parked).
- Saving quotes to notes and offline reading (logged future ideas).

## 4. Acceptance criteria ★

| ID | Criterion | Verified by | Result | Evidence |
|---|---|---|---|---|
| AC1 | The card and the reader both show **Useful · Later · Not useful · 🛠 Build**, in that order. "Completed" and "Skip" appear nowhere on the Today page | React test; browser check at 390px and desktop | ✅ Pass | React test (button order). Design quick check: labels confirmed at 390px and 1280px on all 78 rows, no overflow; Build wraps alone to line 2 on a phone (Minor, accepted by the reviewer). Reader footer: same component, checked in code only |
| AC2 | Tapping Useful stores `action='read'` with `surface='card'` on the card, or `'reader'` in the reader | React test (the press passes the surface); backend test (stored and returned) | ✅ Pass | React tests check `{surface:'card'}` and `{surface:'reader'}`; backend test reads the rows back from the database |
| AC3 | Not useful asks "Why not useful?" with Not relevant · Already know it · Low quality · Other…; the reader also offers **Summary was enough**. ✓ saves `dismiss` with the reasons and the surface; ✕ cancels | React tests (card and reader variants); backend test | ✅ Pass | React tests (card: 3 reasons, saves with surface `card`; reader: 4th chip, saves with surface `reader`); prompt and ✕ checked live at 390px |
| AC4 | The API rejects an unknown `surface` with a 400 and still accepts a press with no surface (an old page still open in a tab keeps working) | Backend tests | ✅ Pass | `test_surface_is_optional_but_must_be_known` (also rejects a surface on non-decision actions, added after code review) |
| AC5 | Existing history is untouched: old events keep `surface` NULL, undo/toggle behaviour is unchanged, and every existing test still passes | Full backend and React suites; read-only event count on live Neon before and after the migration | ✅ Pass | Backend 31/31, React 20/20. Neon: 118 events before, 118 after, 0 with a surface |
| AC6 | The saved-reason note under a card reads "Not useful: “…”" | React test | ✅ Pass | React test; also seen live on card #1 in the design capture |
| AC7 | Live on the hosted Today page by the evening of 10 Oct, so presses from 11 Oct carry the new signal | Hosted API check after the Vercel deploy; one real press shows `surface` in the database | ⏳ Pending | Pushed `42f83d7` ~00:00 11 Oct. Waiting for the user to confirm the new buttons on the phone and make the first real press |

## 5. Edge cases and failure states
- **A tab still open from before the deploy** sends no surface → stored as NULL and accepted (AC4). It's indistinguishable from an old press, which is acceptable for one day.
- **Read in the reader, swipe back, tap on the card** → stored as `card`. Recovered at analysis time from the earlier `open` event (signal-model.md).
- **Offline press** → fails with the existing "Couldn't save that" error, as today. No change.
- **Undo** → unchanged: the undo event points at the original press, which carries the surface.
- **390px phone:** the label "Not useful" is longer than "Skip". The four buttons must still fit, or wrap as whole buttons (the existing `.decision-row` behaviour).

## 6. Decisions (locked)
- **D1. Two value buttons on both screens; the screen gives the depth** (user, 10 Oct). Fewer, more reliable labels beat a richer but noisy 2×2 grid.
- **D2. Keep the stored action codes `read` / `dismiss`** and mark the new meaning with a non-null `surface`. Why: no rename of the codes that the existing status logic, metrics and tests use, and the new column cleanly separates old presses from new ones. *(Claude's call, flagged at the ⏸ before push: the user can switch to new codes `useful` / `not_useful` if they prefer self-describing names.)*
- **D3. "Opened before pressing" is derived, not stored.** The `open` events already exist, and the plan's principle is "store events, not aggregates".
- **D4. The reader-only reason is labelled "Summary was enough"** (user's wording).
- **D5. Revises the Learning OS plan's "implicit labels first"** to: one explicit value tap replaces Completed, with the same number of taps; behavioural events (`open`) are kept as a cross-check. Logged in `learning-os-plan.md` section D.

## 7. Open questions
- Q1 (Claude → user): keep the codes `read`/`dismiss` (D2), or rename them? Not raised at the ⏸, because the incident took priority. Still open; renaming later is cheap while `surface` marks the boundary.

---

## 8. Plan (Claude, reviewed by the user)
- **Database:** migration 005 adds `surface TEXT NULL CHECK (surface IN ('card','reader'))`. It's additive, so the live page keeps working before and after (expand-then-migrate, as with 004). Real events exist, so applying it to Neon needs the user's OK.
- **Backend:** `record_event` takes an optional `surface`. The route passes it through and rejects unknown values.
- **Frontend:** `DecisionButtons` gets a `surface` prop (TodayCard → `card`, Reader → `reader`). It sends the surface with every press, relabels the buttons, and shows the extra reason in the reader.
- **Analysis query** (for the later ranking review):
  ```sql
  SELECT e.surface, e.action, count(*) FROM events e
  WHERE e.action IN ('read','dismiss') AND e.surface IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM events u WHERE u.undoes_event_id = e.id)
  GROUP BY 1, 2;
  ```

### Agents and automation for this build
| Stage | Automated help | Kind | Exists / proposed | Human gate |
|---|---|---|---|---|
| Build | Backend tests on a throwaway Neon schema (the migration runs there first); React tests | Deterministic | Exists | — |
| Review | `/code-review` | Subagent / LLM review | Exists | Claude fixes clear bugs; behaviour changes go to the user |
| UI | Design quick check (changed screens, phone and desktop) | Multi-agent skill | Exists | Tradeoff findings go to the user |
| Release | Migration on live Neon; push to main (Vercel deploys) | Manual | Exists | **The user's OK for the migration** |

No new agent proposed: no recurring pain justifies one.

## 9. Tasks
- [x] T1: Migration 005 (AC2, AC5)
- [x] T2: Backend `surface` and its validation, plus tests (AC2–AC5)
- [x] T3: Frontend labels, surface and the reader reason, plus tests (AC1–AC3, AC6)
- [x] T4: Full test suites, code review, design quick check (AC1, AC5)
- [x] ⏸ T5: User OK → apply 005 to Neon (event count before and after) → push → hosted check (AC5, AC7)

---

## 10. Change log
| Date | Change | Why | ACs affected | OK'd |
|---|---|---|---|---|
| 2026-10-10 | Added: `surface` is rejected on non-decision actions (open, undo, not_junk) | Code review: keeps the column meaning what signal-model.md says | AC4 | Claude's call (no behaviour change for the user) |
| 2026-10-10 | Added: hotfix `21fa5c7` (KR) and `0799edd`→rebased (AICoS): always `SET LOCAL search_path`, including public | Incident: this build's test leaked a session `search_path` onto a pooled Neon connection and took the hosted Today API down (~23:30–23:55) | none | User OK for AICoS push |

## 11. Spec vs reality (retro) ★
- **What the spec got right:**
  - Expand-then-migrate with a nullable column: the migration went in with zero risk to 118 live events, and old tabs keep working.
  - The user's simplification (two buttons, the screen gives the depth) made the build mostly a relabel: small, and fully testable.
- **What it missed (found during build or QA):**
  - **Test isolation.** The tests run on the real Neon database (throwaway schemas, shared connection pool). The spec's "Agents and automation" table listed the tests as a safe check and never asked what they share with production. A new test used a session-level `SET search_path`, which stuck to a pooled connection, and the hosted Today API returned 500s until the hotfix.
  - The design check briefed "opening the reader is fine", but opening it writes a real `open` event, which would pollute this very signal. Caught before capture.
- **What changed and why:** two hotfixes (see the Change log). Code-review fixes: test coverage of the card surface, and no surface allowed on non-decisions.
- **What I'd specify differently next time:**
  - Add an edge case for every build that touches the database: "What do the tests share with production (database, pool, schema)?"
  - Candidate follow-up (user's call): run tests on a Neon *branch* instead of the production database.
