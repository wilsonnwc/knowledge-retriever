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
- [ ] **A3** Retrieval:
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
- [ ] **A4** Junk judge (rules + Haiku):
  - Passes `evals/junk_filter/labels_v1.csv`: 0 articles → junk, ≥ 90% junk recall.
  - Fresh-week blind check prepared.
- [ ] **A5** Pre-go-live checks and dry run:
  - Coverage metric in the manifest and log.
  - No-repeat and digest-landed checks.
  - `dry_run` workflow input.
  - Dry run on GitHub.
  - Old-vs-new comparison report written.
- [ ] ⏸ **Pause 1:** the user reviews the dry-run comparison and the junk disagreements, and approves Release A go-live.
- [ ] **B1** Password login on all routes, plus the Neon-backed items/events API (incl. `not_junk` migration).
- [ ] **B2** Today page (mobile-first):
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
- [ ] **B4** Render deploy via API, plus desktop local-run instructions.
- [ ] ⏸ **Pause 2:** the user's mobile walkthrough.

## Iteration log
*(newest first)*
- **2026-10-04 ~22:30 UTC — A2 done.**
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
- **2026-10-04 ~21:50 UTC — A1b done.**
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

## Questions for the user
*(none yet)*
