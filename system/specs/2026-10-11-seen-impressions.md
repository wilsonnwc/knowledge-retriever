# Spec: "Seen" impressions on the Today page

**Status:** LOCKED (2026-10-11) · **Size:** Full (a new event type in the events table), but small · **Owner (what/why):** PM (the user) · **Builder (how):** Claude
**Created:** 2026-10-11 · **Locked:** 2026-10-11 · **Shipped:** —
**Repos/areas touched:** knowledge-retriever only: `db/migrations/006`, `backend/today_store.py` + route, `frontend/src/components/TodayView/`, `frontend/src/api/client.js`, `system/signal-model.md`.
**Builds on:** [`2026-10-10-useful-signals.md`](2026-10-10-useful-signals.md) and the data contract [`system/signal-model.md`](../signal-model.md)

---

## 1. Problem ★
- A card with no press means two different things (user, 11 Oct):
  - **seen and passed over** — "not irrelevant, but not interesting enough": a weak negative, weaker than Not useful
  - **never reached** — about 30% of the time, no time to scroll to the bottom: no signal at all
- Today these look identical in the data. A ranking review that treats every unpressed card as negative would punish low-ranked items for being low (position bias), so they sink further and are seen even less.

## 2. Outcome and how we'll know ★
- For every day the page is used, each card can be classified as **seen** or **not seen**. The ranking review can then:
  - treat "seen, no press" as a weak negative
  - ignore "not seen"
- Signal: the invariant "**every card pressed from the Today tab also has a `seen` event**". A pressed card was on screen by definition. If this breaks, the seen logic is missing cards.

## 3. Scope ★
**In:**
- A new `seen` event: written when a card on the **Today tab** has been at least half visible for at least 1 second, on **any day's page** (latest or older), tagged with that page's `digest_date`.
- At most **one per card per day's page**, deduplicated on the server. *(Changed 11 Oct, see the change log.)*
- Sent in batches (a few seconds apart, and when the page is hidden or closed), not one call per card.
- Applies to Top 3, Next 7 and Everything else rows.
- Update signal-model.md with the "seen" event and the no-press interpretation ladder.

**Out (non-goals):**
- The Later and Junk tabs (Later items were already decided once; Junk has its own correction loop).
- Time spent per card or scroll depth inside the reader.
- Using the data in the ranking (periodic review, a later build).
- Backfilling earlier days (impossible). Older days fall back to the inference rule in signal-model.md.
- Retrying events lost offline (parked).

## 4. Acceptance criteria ★

| ID | Criterion | Verified by | Result | Evidence |
|---|---|---|---|---|
| AC1 | A card that is ≥50% visible for ≥1 second gets exactly one `seen` event that day. Scrolling past it quickly (<1 s) records nothing | React test (visibility timing, mocked); browser check by scrolling | — | |
| AC2 | Seeing the same card again on the same day's page (re-scroll, reload, a second device, a later catch-up) does not add a second `seen`. The same card on another day's page is its own impression, recorded against that page | Backend tests (dedupe per card per page; older-page catch-up); React test (day switch) | — | |
| AC3 | Seen events go out in batches: one request carries several cards, and pending ones are sent when the page is hidden or closed | React test; network check in the browser | — | |
| AC4 | `seen` has no effect on the card's status, the Later list, the metrics strip or undo | Backend tests (state and metrics unchanged) | — | |
| AC5 | Invariant: every card pressed on the Today tab after release also has a `seen` event | SQL check on live data after 1–2 days of real use | — | |
| AC6 | Nothing visible changes, and the page stays as fast as before. A failed send is silent and never shows an error | Design quick check is not needed (no UI change); browser check that there are no console errors | — | |

## 5. Edge cases and failure states
- **Offline (train):** the batch fails and is dropped silently, as with "open" today. Those cards look unseen, which is the safe direction: they're ignored, not punished.
- **Phone screen locked mid-read, or app switched:** pending events are sent on "page hidden".
- **Fast flick through Everything else:** below 1 second, nothing is recorded. That's intended: a flick isn't a look.
- **A Next 7 card that is taller than the phone screen:** "≥50% visible" can't happen. *Open: use "≥50% visible, or filling at least half the screen".*
- **A press before 1 second:** the press itself proves the card was seen. *Open: also send `seen` on press, so the AC5 invariant holds.*

## 6. Decisions (locked)
- D1. Record impressions (option B) rather than infer them (option A). The user chose B on 11 Oct. Instrumentation can't be backfilled, and the cost is tiny.
- D2. *Seen* = at least 50% visible for at least 1 second. Accepted as drafted when the user locked the spec. Counted **once per card per day's page** (changed 11 Oct).
- D4. Each `seen` carries `digest_date`, so `(item_id, digest_date)` joins to exactly one `sightings` row (section, rank, position). Rank and topic are looked up, not copied onto the event (user, 11 Oct: "as long as I tie an event back to an article").
- D3. A tall card counts as visible when it fills at least half the screen. A press or a reader open marks the card as seen at once (Claude's craftsmanship, per Q2).

## 7. Open questions
- Q1, Q2: resolved at the lock (D2, D3).

---

## 8. Plan (Claude, reviewed by the user)
- **Database:** migration 006 adds `seen` to the allowed `events.action` values. Nothing else changes.
- **Backend:** `POST /api/seen {item_ids: [...]}` (at most 200) calls `today_store.record_seen`. It inserts `seen` only for items that exist and have no `seen` yet that London day, and returns how many it recorded. `seen` is not a press: it is not in `ACTIONS`, and it can't be undone.
- **Frontend:** a `useSeenTracker` hook (IntersectionObserver plus a 1 s timer per card). It is attached only to Today-tab cards. A queue is flushed every 5 s and on `visibilitychange: hidden` / `pagehide`, using `fetch` with `keepalive`. A press or reader open on the Today tab marks the card as seen at once. Failures are dropped silently.
- **Alternative considered:** one request per card. Rejected: about 100 calls a day instead of about 10–20, for no extra information.
- **Tests:** the rest of the backend tests keep running on throwaway schemas, and never use a session-level `SET` (lesson from 10 Oct).

### Agents and automation for this build
| Stage | Automated help | Kind | Exists / proposed | Human gate |
|---|---|---|---|---|
| Build | Backend tests on a throwaway Neon schema; React tests with a mocked IntersectionObserver | Deterministic | Exists | — |
| Review | `/code-review` | Subagent | Exists | Claude fixes clear bugs |
| Release | Migration 006 on live Neon, then push | Manual | Exists | **The user's OK for the migration** |
| Post-release | AC5 invariant SQL after 1–2 days | Deterministic query (run by hand for now) | Proposed as a query, not an agent | User reviews |

No new agent: the invariant is a single query, and it will become a check in the ranking review later.

## 9. Tasks
- [x] T1: Migration 006 (AC1, AC2)
- [x] T2: Backend `record_seen`, the route and tests (AC2, AC4)
- [x] T3: Frontend tracker, batching, mark-on-press, and tests (AC1, AC3, AC6)
- [x] T4: Full suites (backend 37, React 28). Code review round 1: 9 findings, all fixed. Round 2, after the change control: 8 findings; 6 fixed (the database unique index replaces the lock; junk only once corrected; reader presses mark seen; strict date check; skip already-seen cards; dead helper removed), 1 not applicable (keepalive preflight: production API is same-origin `/api`), 1 skipped (minor memory growth in very long sessions). The local browser check was skipped: the local app uses the live database, so verify on the hosted page after release instead (AC1, AC3, AC6)
- [ ] ⏸ T5: User OK → apply 006 → push → the hosted page sends `seen` (AC1, AC3)
- [ ] T6: After 1–2 days, run the AC5 invariant query (AC5)

---

## 10. Change log
| Date | Change | Why | ACs affected | OK'd |
|---|---|---|---|---|
| 2026-10-11 | Paused while the reader is open or the page is hidden | Code review: the clocks kept running behind a locked screen or the reader | AC1 | Claude's call (craftsmanship) |
| 2026-10-11 | ~~Latest day only~~ → **every day's page, tagged with `digest_date`; one per card per page** (replaces "one per card per London day"). Migration 006 also adds `events.digest_date` | User: "there could be days I'm not available and go back to older days to read". Latest-only would drop exactly those catch-up sessions | AC2, D2, D4 | **User OK, 11 Oct** |

## 11. Spec vs reality (retro) ★
- **What the spec got right:**
- **What it missed (found during build or QA):**
- **What changed and why:**
- **What I'd specify differently next time:**
