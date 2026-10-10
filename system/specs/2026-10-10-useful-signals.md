# Spec: Useful / Not useful signals on the Today page

**Status:** LOCKED (2026-10-10, the user's "go build and push it") · **Size:** Full (it changes the events table), but small · **Owner (what/why):** PM (the user) · **Builder (how):** Claude
**Created:** 2026-10-10 · **Locked:** 2026-10-10 · **Shipped:** —
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
| AC1 | The card and the reader both show **Useful · Later · Not useful · 🛠 Build**, in that order. "Completed" and "Skip" appear nowhere on the Today page | React test; browser check at 390px and desktop | — | |
| AC2 | Tapping Useful stores `action='read'` with `surface='card'` on the card, or `'reader'` in the reader | React test (the press passes the surface); backend test (stored and returned) | — | |
| AC3 | Not useful asks "Why not useful?" with Not relevant · Already know it · Low quality · Other…; the reader also offers **Summary was enough**. ✓ saves `dismiss` with the reasons and the surface; ✕ cancels | React tests (card and reader variants); backend test | — | |
| AC4 | The API rejects an unknown `surface` with a 400 and still accepts a press with no surface (an old page still open in a tab keeps working) | Backend tests | — | |
| AC5 | Existing history is untouched: old events keep `surface` NULL, undo/toggle behaviour is unchanged, and every existing test still passes | Full backend and React suites; read-only event count on live Neon before and after the migration | — | |
| AC6 | The saved-reason note under a card reads "Not useful: “…”" | React test | — | |
| AC7 | Live on the hosted Today page by the evening of 10 Oct, so presses from 11 Oct carry the new signal | Hosted API check after the Vercel deploy; one real press shows `surface` in the database | — | |

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
- Q1 (Claude → user, at the ⏸ before push): keep the codes `read`/`dismiss` (D2), or rename them? Non-blocking for the build.

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
- [ ] T1: Migration 005 (AC2, AC5)
- [ ] T2: Backend `surface` and its validation, plus tests (AC2–AC5)
- [ ] T3: Frontend labels, surface and the reader reason, plus tests (AC1–AC3, AC6)
- [ ] T4: Full test suites, code review, design quick check (AC1, AC5)
- [ ] ⏸ T5: User OK → apply 005 to Neon (event count before and after) → push → hosted check (AC5, AC7)

---

## 10. Change log
| Date | Change | Why | ACs affected | OK'd |
|---|---|---|---|---|

## 11. Spec vs reality (retro) ★
- **What the spec got right:**
- **What it missed (found during build or QA):**
- **What changed and why:**
- **What I'd specify differently next time:**
