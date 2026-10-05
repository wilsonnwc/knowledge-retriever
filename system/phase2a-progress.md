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

## NEXT SESSION START HERE (updated 2026-10-05 ~08:50 UTC)
1. ~~**P2: self-promo junk rule**~~ **Done** (AICoS `727e5e7`, pushed). See the iteration log.
2. ~~**P3: go live**~~ **Done** (AICoS `16cd408`, pushed 09:29 UTC 5 Oct, after the user said "go live"). The first v2 night is 5 Oct (scheduled 21:30 UTC).
   - **Now watch 3 nights (5, 6 and 7 Oct):**
     - The invariants step: no repeats, and the digest landed.
     - The coverage line in the email header.
     - Night 1 specifically: none of the 3 seeded 4 Oct emails reappear.
   - **Rollback if needed:** revert `16cd408`, or run the workflow manually with `v2` unticked.
3. **B3: built and pushed, switched OFF** (AICoS `a12fab6`).
   - The user first chose option A on 5 Oct: build now, switch on after the 3-night v2 watch.
   - **Revised the same day:** switch on from **6 Oct**, if v2's first night alone (5 Oct) is clean.
   - Reasoning: B3 can't break the email or cause repeats, and its failures are labelled separately (the NEON_FAILED step name plus the banner). v2's own checks don't depend on it. The night that matters most for telling the two apart is v2's first one.
   - **Switch-on, morning of 6 Oct, if the 5 Oct email and invariants are clean.** Edit `.github/workflows/daily_digest.yml` (this needs the user's OK, since auto-mode treats workflow edits as production deploys):
     - Add `"psycopg[binary]" markdownify` to the `pip install` line. Without markdownify, the reader-format import crashes the run once NEON_STORE is on.
     - Add to the job's `env:` block: `NEON_STORE: 'true'` and `DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}` (the secret already exists).
     - Push before 21:00 UTC, then check the next morning's Today page.
   - **Backfill for review (user decision, 5 Oct; supersedes "no backfill" for this one day):**
     - 4 Oct was re-fetched from Gmail (read-only) and loaded into the live tables (public schema): 38 items, 3 top / 7 rest / 28 junk (3 borderline).
     - No processed_messages written. The `runs` row has `sent=false`.
     - It exists for the user's mobile review before real B3 nights land.
   - Junk-today list: answered (Q6). Borderline calls first, rule-filtered underneath. Built.
4. **Then ⏸ Pause 2:** the user's mobile walkthrough with real data.
- **Test commands:**
  - AICoS: AICoS has no `requirements.txt`. Install the package list from `daily_digest.yml`'s `pip install` line plus `pytest` into a venv, then run `python -m pytest -q`. 74 tests pass.
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
- [x] ⏸ **Pause 1:** the user reviews the dry-run comparison and the junk disagreements, and approves Release A go-live. *(Approved 5 Oct; P2 `727e5e7`, live `16cd408`)*
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
- [x] **B3** (after Pause 1) Store-first ingestion to Neon. *(AICoS `a12fab6`, built behind `NEON_STORE`, off until 8 Oct)*
  - Neon becomes the processed record: Neon OR the JSON file, so there's no cold start.
  - Neon-failure banner plus the run marked failed.
  - Tests: unit tests offline; integration tests on a throwaway Neon schema; replay of 4 Oct real emails.
- [x] **B4** Hosting, on **Vercel** (user decision), plus desktop local-run instructions. *(KR `4ff21c2`; live at https://knowledge-retriever-today.vercel.app)*
- [ ] ⏸ **Pause 2:** the user's mobile walkthrough.

## Iteration log
*(newest first; times corrected at 21:58 UTC to match commit times, as earlier entries had been estimated)*
- **2026-10-05 ~15:00 UTC — First mobile review fixes (KR `8c94930`, migration 003 applied to Neon with the user's OK).**
  - **Lists clipped on the left.**
    - Cause: App.css's global `* { padding: 0 }` strips list indentation, so outside markers ("10.") fell past the reader's 16px edge.
    - Fix: lists get their indent back, and the reader can't grow or scroll sideways.
    - Checked in a 390px frame: no element outside the screen.
  - **More reading room:**
    - The title scrolls with the text.
    - The top bar and the buttons fade and slide away on scroll down, and come back on scroll up, at the top or end, or on a tap.
  - **Back:** the reader pushes a history entry, so the phone's native back swipe closes it.
  - **Decisions (user, 5 Oct):**
    - "Completed" is a new `read` action. "Skip" is still stored as `dismiss`, and its reason is now optional.
    - Later / Completed / Skip form one reading status. Build is a separate flag beside it.
    - Old `read_now` presses fold as an open status, like Later (found by code review).
  - **Tests:** backend 28/28, frontend 15/15. Behaviour was checked in the 390px frame: hide/show bars, back closes the reader, Completed + Build together.
- **2026-10-05 ~13:00 UTC — Reader shows Markdown with links (AICoS `aa9826d`, KR `e56a8e1`). User decision: option A, no images.**
  - **Problem (found by the user on their phone):** email bodies read as flattened plain text. Lines broke mid-sentence, invisible preheader padding left blank walls, and there were no links.
  - **Emails:** converted with markdownify after the plain-text path's own footer cleanup (`newsletter_digest_prep.email_soup`, now shared). Layout tables are unwrapped and images dropped.
  - **Why not trafilatura for emails:** it was tried first and dropped real content (Peter Yang's "Top takeaways" heading) as boilerplate.
  - **Articles:** trafilatura Markdown, with tables flattened.
  - **Safety net:** under 90% of the plain text's words, the plain text is stored instead.
  - **Eval** (`evals/reader_format_eval.py`) on a real week, 28 Sep–4 Oct (56 emails, 18 senders): 56/56 Markdown, 100% of words kept, about 1,800 links, 0 gaps.
  - **Code review found 8 issues, all fixed with tests:** autolinks, titled links, parentheses in URLs, non-http links, nested lists, stray asterisks, article tables, bare `>` lines. Tests: AICoS 92/92, KR frontend 12/12.
  - **Reader styling:** headings on the chat scale, links in the accent colour. Checked in a local browser on the 4 Oct data.
  - **Live data:** 4 Oct reloaded with Markdown. The user's 10 events are kept.
- **2026-10-05 ~11:30 UTC — Hosted reader showed no content; fixed (KR `25a5ddd`).**
  - **Found by the user on their phone** with the 4 Oct backfill.
  - **Cause:** the reader fetched `/api/items/<id>`. Item ids contain `/`, `<`, `@` (canonical URLs, email Message-IDs), and Vercel's Python adapter passes the path still percent-encoded, so the lookup 404'd.
  - **Why local QA missed it:** the local dev server decodes the path. The B2 test fixture ids were also plain (`a1`).
  - **How it was diagnosed:**
    - Hosted probes reached Flask (401).
    - The local endpoint worked.
    - Simulating a still-encoded path reproduced the 404.
    - The local browser reader worked.
  - **Fix:** `GET /api/item?id=…` (query strings are always decoded by Flask). Regression test with real-shaped ids; backend 26/26, frontend 6/6.
  - Confirmed the new bundle is live on Vercel.
  - **Noted for the user, not changed:** email bodies read as choppy plain text (mid-sentence line breaks, blank gaps where images were, no links).
- **2026-10-05 09:50 UTC — B3 built behind `NEON_STORE` (AICoS `a12fab6`); 85/85 tests pass.**
  - **Design:**
    - Layer 1 writes `$DATE/store/items.json` (never committed), plus an `ITEM_ID` line per cleaned item. That line is never sent to Claude.
    - Layer 2 writes `$DATE/store/enrichment.json`. Summaries map to items by Call 1's per-batch index; Call 2's ranks map by URL, then by title.
    - `run_daily` stores after Layer 1 (store-first), enriches after Layer 2, and closes the run once the email is sent.
  - **Found and fixed while building:**
    - Articles and email bodies were capped at 8000 chars, the cap for Claude's input. The reader now gets the full text, and Claude's input is unchanged.
    - Cold start: processed means Neon OR JSON, so an empty Neon table can't repeat emails.
    - Code review found 3 bugs, all fixed with tests: a real class now beats junk on merge; the email-body placeholder URL is no longer used to match ranks; a later full-text fetch updates the title.
  - **Flag off is proven inert:** Layer 1 output with the flag on equals flag off, minus the ITEM_ID lines.
  - **Real replay of 4 Oct** (read-only Gmail, throwaway schema, about $0.15 of Haiku):
    - 43 records became 38 unique items, and Neon holds exactly 38.
    - The Today page's own `today_store.today()` read it back as 3 top / 1 next / 6 rest / 28 junk, with summaries, one-liners and "Last updated".
    - The 28 junk rows are mostly noise, which raised question 6.
- **2026-10-05 09:29 UTC — P3 done: Release A is live (AICoS `16cd408`).**
  - The user approved ("go live") after the auto-mode denial.
  - Workflow YAML validated: both values read back as intended.
  - The workflow change and the seeded processed list shipped in one commit.
- **2026-10-05 08:50 UTC — P3 prepared; workflow edit blocked pending the user.**
  - **Found a night-one repeat bug before go-live.**
    - The Gmail search covers yesterday plus today. v2 skips emails already in `processed_messages.json`, but that file didn't exist yet, since v1 never kept one on GitHub.
    - So v2's first night (5 Oct) would have re-sent the 4 Oct emails that v1's last digest already covered, and turned the new repeats check red.
    - The dry runs couldn't catch it: they ignore the processed list by design, so they can replay the past.
  - **Fix:** seeded `processed_messages.json` with the Gmail IDs of exactly the 3 emails in the 4 Oct v1 digest.
    - Matched read-only by sender and decoded subject, using a one-off scratchpad script that isn't in the repo.
    - The 4 other emails in the window are not seeded. They're dated 3 Oct or in Trash, so they're outside tonight's search.
    - There was no v1 digest for 3 Oct (no auto-commit that night). This predates v2 and is noted only for the record.
  - The workflow edit was denied by the auto-mode classifier as a production deploy. Left for the user (see NEXT SESSION START HERE).
- **2026-10-05 08:40 UTC — P2 done (AICoS `727e5e7`).**
  - A social post whose newsletter text is the hiring blurb is now junk. The rule is `SELF_PROMO_CONTEXT`, checked in `classify_destination` after redirects.
  - **Code review flagged** that the broad phrases "we're hiring" and "want to work at" could junk real headlines. Narrowed the pattern to `jobs@`, "if we hire" and "create your own role", and added a test for that headline case.
  - **Checked on all 390 labelled links (v1 + holdouts v2–v4):** the pattern touches only holdout v4 #6. There's no footer spillover into real stories' surrounding text.
  - `run_eval.py` now passes the surrounding text through as well, keeping the eval's decision order identical to production.
  - The v4 holdout was not re-scored: #6 is now a known case, recorded in `results_v4_holdout.md`. 74/74 tests pass.
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

## Questions for the user (batched for Pause 2)
6. ✅ **Answered 5 Oct: both, ordered.** The judge's borderline calls go at the top ("Borderline calls"), then everything the rules filtered goes underneath ("Filtered by rules"). With little time, the user can do just the borderline ones; with more, the whole list. Built in `TodayView.jsx` `splitJunk()`, and browser-checked on the 4 Oct replay data: 3 borderline, then 25 rule-filtered.
   - *Original question:* **Junk-today list scope (found in the B3 replay, 5 Oct).**
   - A real day has about 100–130 junk links, and most come from rules: stock tickers (`$CDNA`), poll buttons ("Bearish"), unsubscribe and "view online" links. On 4 Oct the list held 28 rows like that.
   - Option (a): show only junk the Haiku judge decided (`class_reason` starts with `judge:`). Those are the ones worth a "Not junk" correction.
   - Option (b): show everything, collapsed.
   - Neon stores all junk with its reason either way, so this is a filter on the page, not a pipeline change.

## Questions for the user (batched for Pause 1)
**Pause 1 answered 2026-10-05 ~08:10 UTC: user "Agree with all 3".**
- **P1 ✅** Accepted: the 2 Oct "no newsletter worse" FAIL is a measurement artefact. It was 1 link each, and v1's "ok" was a teaser or event page.
- **P2 ✅** A newsletter's own self-promo social post is **junk**, like sponsors and referrals.
  - Example: TLDR's LinkedIn "Best Bootstrapped" post, whose context is "Apply here… jobs@tldr.tech… get $1k if we hire them! TLDR is one of Inc.'s Best Bootstrapped businesses".
  - **Built:** AICoS `727e5e7`.
- **P3 ✅** Go live: switch the nightly digest to v2. **Live:** AICoS `16cd408`, 2026-10-05.

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
