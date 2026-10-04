# Phase 2a Spec — Digest upgrade (Release A) + Neon store-first and Today page (Release B)

Status: **DRAFT, being locked in conversation (2026-10-04).** Nothing is built yet.
Spans two repos: `ai-chief-of-staff` (pipeline) and `knowledge-retriever` (Today page, event API).

---

## Evidence behind this spec (2026-10-04)

- **The spike techniques were never in production.** The 27 Sep spike was measurement-only, and its recommendations were waiting on the user's confirmation.
- **Production, 27 Sep–2 Oct (old method, raw links):**
  - 803 links, 31% ok.
  - The Neuron: 332 links, 0% ok.
  - The Batch: 41 links, 0% ok, all "too short".
  - The link count is inflated by the repeat-email bug (see A2).
- **Local re-test** (home internet, 153 of last week's failed links): 50% of real articles recovered (59/117).
  - The Batch: 27/29 recovered via redirect resolution. That failure was redirect handling, not IP blocking, so it is expected to transfer to GitHub.
  - The Neuron: 15/23 from home vs 0 from GitHub, which confirms IP-based blocking.
  - 36 more non-articles were found only after following links: homepages, careers pages, YouTube/podcasts/X.
  - **Home results overstate production.** The real number comes from the GitHub dry run (A5).
- **GitHub re-test** (run 37216213235, same 153-link sample, the production location): 27/134 real articles recovered (20%). **Excluding The Neuron: 27/94 (29%).**
  - **The Batch: 21/29 (72%), up from 0%.** This confirms the redirect fix transfers.
  - The Neuron: 0/40, refused at the tracker, which confirms D1.
  - Benedict Evans and TLDR: still about 0%, because of news-site blocks and paywalls. A3 (link context) covers these.
  - T3 retry recovered 0 and T5 feeds recovered 1. Both are kept because they're cheap, but they add little.
- **3 Oct run failed:** 0 emails, because the user had read the newsletters and moved them to Trash. This is expected behaviour, and the run should send a notice rather than crash.
- **Repeat emails:** `processed_messages.json` is gitignored, so every GitHub run starts with an empty list and re-processes the previous day. Data: 30 Sep 9/17 repeated, 1 Oct 5/15, 2 Oct 10/18.

---

## Release A — upgrade the running digest (ai-chief-of-staff)

### Locked decisions
- **A1 Retrieval techniques:**
  - T1 junk filter, on link text and again on the resolved destination (homepage, careers, social, video and podcast pages).
  - T2 hop-by-hop redirect resolution.
  - T3 one polite retry on 429.
  - T5b publisher feed lookup, cached per host per run.
  - Stricter success check: 1500+ chars, not a robot-check, paywall or teaser page.
  - Not included: headless browser, The Neuron web version.
- **D1 The Neuron is email-body-only.** Its links are not fetched.
- **D2 Blocked or unavailable articles** fall back to the newsletter's blurb, tagged "(full article unavailable)".
- **D3 Accept the extra Claude cost** from more recovered articles. Safety net: if ranking fails, the digest still sends unranked (see AC5).
- **D4 Rollout:** dry-run first. A workflow input skips email and commit, and old vs new manifests are compared on a recent real day before switching on.
- **Trash:** emails in Trash are skipped. This is the current behaviour; no change. Rationale: an email read and binned before the run was read deliberately.
- **Empty days:** send a short "nothing new today" notice. The run succeeds rather than failing.
- **A2 Repeat-email quick fix:** persist the processed-message list between runs, the same way `recent_urls.json` is persisted. **The permanent fix is in Release B scope:** Neon `items` becomes the record of what has been processed.

### Acceptance criteria (locked)
1. **Coverage:** the share of real articles (junk excluded) with full text is reported in every manifest and run log. **Targets (locked 2026-10-04):**
   - ≥ 65% real-article coverage, excluding The Neuron (estimated baseline ~60%, expected ~70%).
   - The Batch ≥ 60% on its own.
   - No newsletter worse than before.
   - If the dry run falls short, bring it to the user at the dry-run pause point. Never lower the bar silently.
2. **No fake successes:** a 10-item spot check of "ok" items finds no robot-check, paywall or teaser pages.
3. **No repeats:** no email appears in two consecutive digests, checked over 3 nights.
4. **Empty day:** a day with no new emails sends the notice, and the run is marked success.
5. **No lost days:** a ranking failure still delivers a digest.
- **Eval additions:** a coverage metric, a no-repeat invariant, and a digest-landed invariant, as automated checks.

- **D6 (locked 2026-10-04, revised after label review):**
  - **Video and podcast links only** (YouTube, Spotify, Apple Podcasts) are not fetched. The text around the link is used to judge importance.
  - **X and LinkedIn text posts are articles.** The user relabelled all 5 in review.
  - For X, try the free oEmbed endpoint for the post text. If that fails, and for LinkedIn, fall back to the text around the link (A3).
- **Junk-filter eval set locked (2026-10-04):** `ai-chief-of-staff/evals/junk_filter/labels_v1.csv`.
  - 90 article, 59 junk, 1 media.
  - 145/150 agreement with Claude's first pass. All 5 changes were social posts (media → article).
  - The labelling rules are in that folder's README and go into the judge's instructions.
- **A3 Link context (locked 2026-10-04):** every link captures its surrounding paragraph plus the nearest heading. When the article can't be fetched (e.g. Benedict Evans, The Neuron), Claude ranks and summarises from that context, and the card is tagged "(full article unavailable)".
- **A4 Junk filter = LLM-as-judge, eval-able (user direction, 2026-10-04; details in conversation):**
  - Junk items are stored, not discarded, along with the reason/keywords behind each verdict.
  - The Today page gets a "Junk today" shortcut listing them, with a "Not junk" correction button on each.
  - Every correction becomes an eval case.
  - The loop must re-test until the filter is solid before moving on.

---

## Release B — store-first to Neon + Today page + hosting (knowledge-retriever)

### Locked decisions
- **R0 Scope (expanded by the user):**
  - Hosting is pulled into this loop (Render + Neon, per the Learning OS plan), so the page is usable on mobile sooner.
  - A desktop local-run option must also work, as a fallback if the hosted version needs fixing.
  - The email does not change. The Today page and the email run in parallel until the user decides to switch the email to notification-only.
- **B1 Cards:**
  - Top 3 and Next 7 as full cards.
  - Below them, an "Everything else" list of compact rows. Each row has a one-line summary, unless that raises cost significantly. **Check the cost before building.**
  - Every row can be opened and actioned.
- **B2:** Today shows only the latest digest. Earlier days are reachable via a "Previous days" link. No carry-over.
- **Dismiss reason is REQUIRED.** The user answered this under "B3"; the question was posed as B4.
- **Permanent repeat fix:** Neon `items` is the processed record (see A2).

- **A4 detail (locked 2026-10-04):**
  - Two stages: rules first for obvious junk, then Claude Haiku as judge for ambiguous links. The judge sees link text, surrounding text and the resolved destination.
  - Each junk item shows its reason.
  - "Not junk" writes an event (a new `not_junk` action, which needs a migration that is safe pre-launch) and moves the item into today's Everything-else list.
  - Corrections become eval cases.
  - Cost is roughly £1/month.
  - **Launch bar:** the user hand-labels **all ~150 links** (not just a 20 spot-check) when back on a laptop. The judge must drop 0 real articles and catch ≥ 90% of junk.
- **Hosting login (locked 2026-10-04):**
  - App-level password login: one password held as a Render env var, with a ~30-day session cookie.
  - It protects **every** route, because the existing API has unauthenticated delete endpoints.
  - Cloudflare Access is deferred, since the user owns no domain.
- **Neon-write failure (locked 2026-10-04):**
  - The email still sends, with a "⚠ Today page not updated" banner at the top.
  - The workflow run is marked failed, so GitHub notifies the user.
  - The Today page shows "Last updated: <date>".
- **B3 + B4 (locked 2026-10-04):**
  - The in-page reader opens on tap, which is logged as `open`.
  - Blocked items show the blurb, the unavailable tag and "Open original".
  - After a decision, the card shrinks to a greyed-out "done" state with Undo.
  - Later puts the item on a simple Later list, with no resurfacing yet.
  - Build takes an optional one-line note.
- **No backfill (locked 2026-10-04):** the Today page starts from go-live day, because past digests didn't keep full email content.
- **Metrics strip (locked 2026-10-04):** "Active X of Y days this month · N cards actioned today", shown on the Today page.
- **Loop pauses (locked 2026-10-04):**
  - **Before the loop starts:** the user completes the Render signup and adds the `NEON_DATABASE_URL` GitHub secret, following click-by-click steps.
  - **The loop stops only at:**
    1. Junk-label review (other work continues meanwhile).
    2. The dry-run comparison, before Release A changes the daily email.
    3. "Ready for you", when the hosted page is live and needs a mobile walkthrough.
  - Database migrations are free before launch. Once real events exist, any migration needs the user's OK.
  - Questions the spec doesn't cover are logged, and the loop continues on unblocked work.

### Already decided in `learning-os-plan.md` / Session 42 (not reopened)
- Mobile-first card stack.
- Read now / Later / Build / Dismiss.
- Append-only events with undo.
- Multiple decisions per card.
- Open events are logged but not counted.
- Filtered-out items shown with reasons.
- Metrics:
  - At least one action on ≥ 70% of calendar days.
  - ≥ 5 cards actioned per day, or all cards when fewer are shown.

### Open (to confirm)
- **B3 (proposed, not explicitly confirmed):**
  - Tapping a card opens an in-page reader with the full text and "Open original", logged as an `open` event.
  - Blocked items show the blurb, the unavailable tag and "Open original".
  - After a decision, the card shrinks to a greyed-out "done" state with Undo.
- **B4 rest (proposed):**
  - Later goes to a simple Later list, with no resurfacing yet.
  - Build takes an optional one-line note.
- **Part 2, not yet discussed:**
  - Neon-write failure behaviour.
  - Backfill.
  - Metrics display.
  - Hosting auth (the plan says Cloudflare Access).
  - Loop guardrails and gates.
  - GitHub secret.
