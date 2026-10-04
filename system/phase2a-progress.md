# Phase 2a — Autonomous Build Progress

The loop reads this file at the start of every iteration and updates it at the end.
Source of truth for *what* to build: `system/phase2a-spec.md`. This file tracks *where we are*.

## Operating rules (confirmed by the user, 2026-10-04)
- Each iteration:
  1. Pick the next unchecked milestone.
  2. Build it.
  3. Run its checks.
  4. Run code review.
  5. Commit and push to `main`.
  6. Update this file.
- **No pushes to AICoS between 21:00 and 05:30 UTC** (the nightly run window).
- **Pause only at ⏸ points.** Everything else runs unattended.
- **Spec gaps:**
  - Add them to "Questions for the user" below.
  - Continue on work that isn't blocked.
  - Never guess on product/UX tradeoffs.
- **Database migrations** are free until real button events exist. After that, ask first.
- **Never:**
  - Change the live digest's behaviour before Pause 1 is approved. Use the dry-run path.
  - Lower an acceptance bar silently.
  - Put secrets in code, logs or commits.
- The junk-filter fresh-week check uses Claude's blind labels, written **before** seeing judge output. Disagreements go to the user at Pause 1.

## Milestones
- [x] **A1** Build plan written (`system/phase2a-build-plan.md`) and reviewed by the plan-reviewer agent. 12 amendments accepted.
- [x] **A1b** Recover source emails (incl. Trash) → `labels_v1_context.json`, plus the dev/test split, committed before any tuning. *(AICoS `aee6472`, committed locally; push after 05:30 UTC.)*
- [x] **A2** Quick fixes: *(AICoS `8c4eb81` golden test, `09f0ea0` fixes; local, push after 05:30 UTC)*
  - Persist the processed-message list.
  - Empty-day "nothing new today" notice.
  - Ranking-failure safety net (send unranked).
  - Tests.
- [x] **A3** Retrieval: *(AICoS `c01bf1a`, local; push after 05:30 UTC)*
  - Link-context capture.
  - T1 rules, also applied post-resolve.
  - T2 redirects.
  - T3 retry.
  - T5b feeds, cached per host.
  - X oEmbed.
  - Stricter block/paywall/teaser detection.
  - The Neuron email-body-only.
  - Video/podcast as media.
  - D2 "(full article unavailable)" tag.
  - Tests.
- [x] **A4** Junk judge (rules + Haiku): *(AICoS `423d3a3`, `2b16fe4`, local; push after 05:30 UTC)*
  - Passes `evals/junk_filter/labels_v1.csv`: 0 articles → junk, ≥ 90% junk recall.
  - Fresh-week blind check prepared.
- [ ] **A5** Pre-go-live checks and dry run: *(code done, AICoS `ac6ddf4` local. **Waiting:** push after 05:30 UTC, then dispatch dry runs for 2026-09-30, 10-01, 10-02.)*
  - Coverage metric in the manifest and log.
  - No-repeat and digest-landed checks.
  - `dry_run` workflow input.
  - Dry run on GitHub.
  - Old-vs-new comparison report written.
- [ ] ⏸ **Pause 1:** the user reviews the dry-run comparison and the junk disagreements, and approves Release A go-live.
- [x] **B1** Password login on all routes, plus the Neon-backed items/events API (incl. `not_junk` migration). *(KR `cad2b32`; migration 002 applied to Neon)*
- [x] **B2** Today page (mobile-first): *(KR `11cc47f`)*
  - Cards and the Everything-else list.
  - Reader view.
  - Buttons, done/Undo, required Dismiss reason.
  - Later list.
  - Junk-today list with "Not junk".
  - Previous days.
  - Metrics strip and "Last updated".
  - Browser QA.
- [ ] **B3** (after Pause 1) Store-first ingestion to Neon:
  - Neon becomes the processed record.
  - Neon-failure banner plus the run marked failed.
- [ ] **B4** Render deploy via API, plus desktop local-run instructions. *(Prep done, KR `3691f4b`. **Blocked on user question 4:** Render's API returned 402 'payment information required'.)*
- [ ] ⏸ **Pause 2:** the user's mobile walkthrough.

## Iteration log
*(newest first; times corrected at 21:58 UTC to match commit times, as earlier entries had been estimated)*
- **2026-10-04 22:10 UTC — B4 prep done; deploy blocked (user question 4).**
  - Built `today_app.py` (Today + login only, same-origin React, ProxyFix), `render.yaml`, desktop run docs. 5 tests pass (24 backend total).
  - Generated `APP_PASSWORD` + `SECRET_KEY` into `.env`.
    - **Self-caught:** `.env` had no trailing newline, so `APP_PASSWORD` got glued onto the `RENDER_API_KEY` line. Split back; the Render key was re-verified (HTTP 200).
  - Render API: 402, card required → stopped, as instructed.
  - **Remaining:** A5 dry runs at 05:30 UTC (time-gated, no question needed), then Pause 1.
- **2026-10-04 21:56 UTC — B2 done.**
  - Today page, reader, buttons with Undo, Later, Junk today with "Not junk", previous days, metrics strip, login screen.
  - **Browser QA:** the Chrome extension wasn't connected, so I used Playwright driving the installed Chrome (headless, temporary profile).
    - 390px and 1280px, on 216 real items from 2 Oct seeded into a throwaway schema (dropped afterwards).
    - Every flow passes. Fixed: "Not junk" wrapping, "card(s)" plural. Screenshots are in `system/qa/2026-10-04/`.
  - **Code review:** 3 real bugs fixed —
    - The day picker showed the wrong label.
    - A failed dismiss closed its reason box.
    - A stale build note could become a dismiss reason, polluting error-analysis data.
  - Review note 4 (hosted mode never switches on) is expected until B4 builds `today_app.py`. Verify it there.
  - **For B3:** store titles without the "(full article unavailable)" suffix; the tag already says it.
  - ⚠ **Side effect to report:** starting the local app ran its existing 7-day trash purge, which permanently removed 5 notes from the Notes trash (the app's designed behaviour on any start).
- **2026-10-04 21:45 UTC — B1 done.**
  - **Migration 002:** sightings (one card per URL, per-day rank), processed_messages, runs, junk/media kinds, `not_junk`. Applied while the tables were still empty.
  - **Today API:** today / items / later / events. Dismiss needs a reason; undo is validated; state is folded from the append-only history; metrics use London days.
  - **Auth:** password + 30-day signed cookie on every `/api` route. A hosted deploy refuses to start without a password.
  - **Neon gotcha:** the pooled endpoint rejects `search_path` as a startup option, so `SET LOCAL` per transaction is used instead.
  - **19 tests on throwaway Neon schemas**, all cleaned up.
  - **Code review:** a non-text reason or password caused a 500 → now a 400.
  - **Carried to B2:** local dev runs page and API on different ports, so the frontend must send cookies (`credentials: 'include'`) and CORS needs `supports_credentials`. The hosted app is same-origin, so it's fine there.
- **2026-10-04 21:36 UTC — A5 code done; dry run waits for the push window.**
  - Built: coverage metric, invariants (repeats / landed), `dry_run` workflow input (v1 and v2 side by side on the same emails), comparison report.
  - **Local smoke test on 2 Oct** (v2 from home network): real-article coverage v1 32% → v2 75%; The Batch 0% → 89%.
  - **⚠ Jenny Wanger came out worse** (3/11 → 1/11, rate-limited). Watch this in the GitHub dry run, since it fails "no newsletter worse".
  - **Code review (medium):** 4 bugs fixed —
    - The repeats check couldn't match v1 against v2.
    - It raised false alarms after an unsent day.
    - A local dry run could overwrite a real day.
    - A missing live commit silently used the wrong `recent_urls`.
  - 1 finding rejected with reasoning: the dry run ignoring the processed list matches what live v1 actually did, since v1 never had the list on GitHub.
  - 67/67 tests pass. 8 AICoS commits are queued locally.
  - **Next:** B1/B2 in knowledge-retriever while waiting (pushes are allowed there).
- **2026-10-04 21:28 UTC — A4 done.**
  - **Judge:** Haiku 4.5 with structured JSON output, temperature 0, batched 40 per call. It's told "unsure → article"; any failure keeps the link.
  - **Eval results** (rules + judge):
    - **dev** 0 lost / 98% junk caught (round 5).
    - **test** (run once) 0 / 100%. Caveat: the rules were written after seeing all 150 labels.
  - **Unseen holdout v2** (13–19 Sep, Claude blind labels committed first): **6 articles lost.**
    - 2 real bugs, fixed: the vals.ai rule was host-wide (overfit), and the judge called market news "ticker".
    - 4 sit on an open guideline question (Teresa Torres glossary links) and were not tuned on.
  - Also fixed: temperature 0 for stable verdicts; eval inputs had lost query strings (RBI `?prid=`).
    - A mislabelled "round 4" log entry is kept, with a correction note.
  - **Second unseen holdout v3** (6–12 Sep): 1 lost (the Citi report landing page, which Claude had flagged ambiguous) / 100% junk caught.
  - **Code review:** 2 bugs fixed — the judge would have crashed in CI (the key lives only in `.env`); an API outage could have burned a one-time holdout.
  - 57/57 tests pass.
- **2026-10-04 21:12 UTC — A3 done.**
  - `link_pipeline.py` + `layer1_v2.py`, behind `--v2`.
  - **Rules on dev:** 0 wrong calls; 36/40 junk settled with no LLM. The rest go to the A4 judge.
  - **Caught on real emails:** v2 first saw ~4× more links than v1, because v1 skips Substack redirect links. That turned essays (Lenny, a16z…) into "hybrids", and one essay lost its body.
    - Fixed by keeping v1's link selection, except X/LinkedIn posts (user rule).
    - Result: **0 shape mismatches on 61 real emails.**
  - **Real-day run** (2 Oct, 18 emails, home network): 14.5 min.
    - 110/147 real articles fetched (pre-judge); 81 junk by rule.
    - **141 items for Claude vs 68 in v1**, so roughly 2× Haiku calls per night. D3 accepted the extra cost; A4's judge will trim some.
    - Runtime is up from about 8–11 min, which is fine for a nightly job with no timeout.
  - Fixed from real data: TLDR `(Sponsor)` blocks leaked through; headings picked the previous story's title. The eval context was regenerated before any tuning.
  - **Code review (medium):** 2 bugs fixed — tracking-param stripping corrupted URLs; the `context_used` flag over-reported.
  - 50/50 tests pass. Golden v1 is unchanged.
- **2026-10-04 20:50 UTC — A2 done.**
  - **Golden test committed first.** Synthetic link-digest, essay and hybrid emails, a fake fetcher and a fake Claude.
    - Together they pin the live v1 output: ok, paywalled, too-short and blocked fetches, the sponsor filter, 2 batches and ranking.
    - A first fixture accidentally put every link within 700 chars of "sponsor", so all links were filtered. Fixed before recording the baseline.
  - **v2:** empty-day notice for all 3 empty paths, with the binned count; resilient Claude calls; unranked fallback; processed list persisted; workflow `v2` input.
  - **Self-caught bug:** v2 originally saved the processed list even when it crashed before sending, which would have **lost** those emails. It's now gated on a SENT marker.
  - **Code review (medium) found 5 more issues, all fixed with tests:**
    - The rebase was blocked by a dirty tracked state file (fixed with `--autostash`).
    - `recent_urls` was saved before sending, so a failed send would have hidden those items tomorrow. Now deferred until after sending.
    - Layer 1's zero items was misreported as "already featured".
    - A stale SENT marker survived re-runs.
    - Spam was counted as "binned".
  - **13/13 tests pass. v1 output is byte-identical.**
  - Workflow change `git pull --rebase --autostash` also applies to v1 runs. It is protective only: it doesn't change digest content, and it stops a concurrent push losing a night's output.
- **2026-10-04 20:41 UTC — A1b done.**
  - New `link_context.py`, shared with A3: the newsletter's own text around each link, plus the nearest heading.
  - Re-fetched 76 source emails incl. Trash. Context recovered for 150/150 labelled rows: median 411 chars, never just the anchor.
  - Committed the dev/test split before any tuning: dev 101, test 49, stratified by newsletter + label.
  - Code review found 2 minor robustness issues (Gmail pagination, silent key collision). Both fixed.
  - The AICoS commit stays local until the nightly window closes (05:30 UTC).
  - Known imperfection, for A3: the heading heuristic sometimes picks the previous item's bold title in TLDR.
- **2026-10-04 20:40 UTC — A1 done.**
  - Build plan written. The Plan agent's review found 12 issues, all accepted as amendments. The top two:
    - (1) The workflow commit/push could alter the live digest before Pause 1.
    - (2) The dry-run comparison was skewed by `recent_urls.json`.
  - Added milestone A1b (email context recovery), because Gmail Trash expires after 30 days.
  - No code yet.

## Questions for the user (batched for Pause 1)
1. **Junk guideline (a):** inline links to an author's own glossary/explainer pages (Teresa Torres "opportunity solution tree", "customer needs"…). Article, or junk-as-reference like model cards and repos? This decides 4 of holdout v2's 6 misses.
2. **Junk guideline (b):** a report's landing page (holdout v3 #22, Citi). Article or junk?
3. **Grade Claude's blind labels:** a random sample of ~20 holdout links will be in the Pause 1 review page.
4. **Hosting (blocks B4):** Render refuses to create even a free service through the API without a card on file. Options:
   - (a) Add a card to Render. The free plan stays free, and Claude deploys straight away.
   - (b) Create it yourself: Render dashboard → New → Blueprint → this repo (`render.yaml`), then paste the 3 secrets from `.env`. It's unknown whether the dashboard also asks for a card.
   - (c) Switch to a host that needs no card, e.g. Vercel. The original reason to rule Vercel out (its 10s limit vs a stateful app) may no longer apply now the hosted app is stateless, but this changes an agreed decision.
