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

## NEXT SESSION START HERE (written 2026-10-05 ~08:15 UTC; the session ended for fresh context)
1. **P2: self-promo junk rule** (AICoS `link_pipeline.py`).
   - Today `classify_destination` returns `article` for every social post before the judge sees it.
   - Add a rule: a social post is junk when its context is the newsletter's own hiring/award/about-us blurb (e.g. `jobs@`, "if we hire", "we're hiring").
   - Or let such social posts fall through to the judge.
   - Add a test using the real context above.
   - Holdout v4 row #6 is exactly this link (labelled junk). Note it in that eval's results as a known miss, now fixed by a rule. Don't re-run the holdout as if it were unseen.
2. **P3: go live.**
   - Make the scheduled run use v2: the one-line change to `env.V2` in `.github/workflows/daily_digest.yml`, for scheduled runs too.
   - Push before 21:00 UTC (loop rule), or tonight's run stays v1.
   - Re-run the tests first.
   - Then watch 3 nights: the invariants step (no repeats, digest landed) and the coverage line in the email header.
3. **B3: store-first ingestion to Neon.** See the milestone below. It can be built while the 3 nights are being watched.
4. **Then ⏸ Pause 2:** the user's mobile walkthrough with real data.
- **Test commands:**
  - AICoS: use the scratchpad venv or any Python with `requirements.txt` and trafilatura, then `python -m pytest -q`. 70 tests pass.
  - KR: `backend` tests, 24 pass.

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
- [x] **A5** Pre-go-live checks and dry run: *(code pushed 07:12 UTC 5 Oct; dry runs 37276478843 (09-30), 37276482782 (10-01), 37276486493 (10-02) all succeeded; comparison in AICoS `evals/dryrun_2026-10-05.md`; fixes `a871845`)*
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
- [x] **B4** Hosting, on **Vercel** (user decision), plus desktop local-run instructions. *(KR `4ff21c2`; live at https://knowledge-retriever-today.vercel.app)*
- [ ] ⏸ **Pause 2:** the user's mobile walkthrough.

## Iteration log
*(newest first; times corrected at 21:58 UTC to match commit times, as earlier entries had been estimated)*
- **2026-10-05 07:55 UTC — A5 done. Loop stopped at ⏸ Pause 1.**
  - **All 3 dry runs succeeded.** Real-article coverage, excl. The Neuron: v1 37% → **v2 76%** (75% / 77% / 75% per day). The Batch: 0/17 → 12/17 (71%).
  - **AC1 "no newsletter worse" FAILS on 2 Oct** (Jenny Wanger 2/8 → 1/8; Daily Rip 7/11 → 6/11). In each case, one link where v1's loose "ok" was a CNBC teaser or an event landing page. Not lowered silently: Pause 1 question P1.
  - **AC2 spot check:** 27/30 are real article text.
  - **Fixed `a871845`:**
    - One item per story per day. TLDR's own LinkedIn self-promo post was appearing 6–7 times a day.
    - Link-only X posts (long-form X Articles) are now `partial`.
    - Code review: no blocking bugs. Two suggestions applied: case-safe story key, and full text replaces an earlier blurb.
    - 70/70 tests pass.
  - **Known gap, not a regression:** jennywanger.com blocks GitHub's servers (429/403) for both v1 and v2.
- **2026-10-05 07:12 UTC — AICoS pushed; dry runs dispatched.**
  - The laptop slept through the scheduled 05:30 check-in; the user prompted the push.
  - Last night's live v1 digest ran OK at 00:01 UTC, before the push.
  - Rebased the 11 commits onto it: 67/67 tests pass, actionlint OK.
- **2026-10-05 ~00:20 UTC — Junk judge updated with the user's rulings; fourth unseen holdout.**
  - **dev:** 0 lost / 98% (no regression).
  - **Holdout v4** (30 Aug–5 Sep, blind labels committed first): **1 lost / 93% junk caught.** All 6 glossary/guide links are now correct.
  - The 1 loss is borderline (a "Best Oil Stocks" listicle) → user question 5.
  - Unseen-set losses so far: 6 → 1 → 1.
  - Tuning stopped on purpose so the holdouts stay honest. The safety net is that junk is stored and can be rescued with "Not junk".
- **2026-10-05 ~00:05 UTC — B4 done on Vercel (user present).**
  - Render needed a card. Vercel was verified (Hobby: free, no billing cycle, pauses rather than charges; Python/Flask; London `lhr1`; 5-min limit) and the user chose it.
  - Built as two Vercel Services in one project (React on the CDN, Flask API on `/api/*`). `backend/requirements.txt` was slimmed so the function stays small.
  - Created via API: project, London region, 3 encrypted env vars, production deploy (build OK).
  - **Outside checks:**
    - The API is locked: 401 without login, including the notes route.
    - Wrong password → 401; right password → 200.
    - The cookie is Secure + HttpOnly, 30 days.
    - Warm `/api/today` takes 0.24s.
  - **Phone QA in Chrome:** login → Today-only layout (no sidebar) → still logged in after a reload; no console errors.
  - The page is empty until B3 writes data.
  - **Junk review answered:** the user confirmed all 27 labels. The judge still misses those two rule types → fix the judge prompt, then re-test on a fresh unseen holdout.
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
**Pause 1 answered 2026-10-05 ~08:10 UTC: user "Agree with all 3".**
- **P1 ✅** Accepted: the 2 Oct "no newsletter worse" FAIL is a measurement artefact. It was 1 link each, and v1's "ok" was a teaser or event page.
- **P2 ✅** A newsletter's own self-promo social post is **junk**, like sponsors and referrals.
  - Example: TLDR's LinkedIn "Best Bootstrapped" post, whose context is "Apply here… jobs@tldr.tech… get $1k if we hire them! TLDR is one of Inc.'s Best Bootstrapped businesses".
  - **Not built yet.**
- **P3 ✅** Go live: switch the nightly digest to v2. **Not done yet.**

**Answered 2026-10-05 (user reviewed all 27 Pause 1 links: "nothing to change, recommendations spot on"):**
- Q1: an author's own glossary/explainer pages are **articles**.
- Q2: a report's landing page is an **article**.
- Q3: Claude's 20 random blind labels were all confirmed.

1. **Junk guideline (a):** inline links to an author's own glossary/explainer pages (Teresa Torres "opportunity solution tree", "customer needs"…). Article, or junk-as-reference like model cards and repos? This decides 4 of holdout v2's 6 misses.
2. **Junk guideline (b):** a report's landing page (holdout v3 #22, Citi). Article or junk?
3. **Grade Claude's blind labels:** a random sample of ~20 holdout links will be in the Pause 1 review page.
5. ~~**Junk bar, last borderline case:**~~ **Answered 2026-10-05: junk.** Holdout v4 now **passes** (0 lost, 93%). holdout v4 lost 1 "article": a Benzinga "Best Oil Stocks Right Now" listicle, which the judge called a ticker page. Is an evergreen "best X stocks" listicle an article or junk? If junk, every unseen set since the rulings meets the bar.
4. ~~**Hosting (blocks B4):**~~ **Answered 2026-10-05: Vercel**, after a verified comparison. Recorded in `learning-os-plan.md`. Render refuses to create even a free service through the API without a card on file. Options:
   - (a) Add a card to Render. The free plan stays free, and Claude deploys straight away.
   - (b) Create it yourself: Render dashboard → New → Blueprint → this repo (`render.yaml`), then paste the 3 secrets from `.env`. It's unknown whether the dashboard also asks for a card.
   - (c) Switch to a host that needs no card, e.g. Vercel. The original reason to rule Vercel out (its 10s limit vs a stateful app) may no longer apply now the hosted app is stateless, but this changes an agreed decision.
