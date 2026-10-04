# Phase 2a — Build Plan

Implements `system/phase2a-spec.md`. Progress is tracked in `system/phase2a-progress.md`.
Repos:
- **AICoS** = `ai-chief-of-staff` (the pipeline).
- **KR** = `knowledge-retriever` (Today page, API, hosting).

## Cross-cutting decisions (Claude's call, mentioned per the decision split)
1. **A feature flag keeps the live digest unchanged until Pause 1.**
   - The nightly cron runs whatever is on `main`. So every Release A behaviour change sits behind `run_daily.py --v2`.
   - The workflow passes it only when `dry_run=true` (or later `v2=true`).
   - Pause 1 approval = flip the scheduled run to `--v2`, a one-line workflow change.
   - Old code paths stay until v2 has run live for a week, then are removed.
2. **Dry runs replay a past day.**
   - Gmail search includes Trash in dry-run mode only (`includeSpamTrash=True`), because the user bins newsletters after reading them.
   - Dry runs do not read or write the processed list, do not send email and do not commit.
   - Output is uploaded as a workflow artifact.
   - Live runs keep skipping Trash (spec: a binned email was read deliberately).
3. **Shared link pipeline.** A new module, `link_pipeline.py`, holds context capture, rules, resolution, the judge and fetching. `layer1_cleaner.py` calls it under `--v2`.
4. **Tests use pytest with recorded HTML fixtures.** There are no unit tests today. All network calls are mocked, so tests are offline and deterministic.
5. **"Everything else" one-line summary: zero extra cost.** Call 1 already writes a 2-sentence summary for every item. The card uses sentence 1. *(Resolves the spec's "check cost before building".)*
6. **Eval hygiene for the judge.**
   - `labels_v1.csv` is the **dev set** (tuned against).
   - The fresh-week blind set is the **held-out test**. Its result is the one reported at Pause 1, so tuning on dev can't flatter the number.

## Release A (AICoS)

### A2 — Quick fixes (behind `--v2`)
- **Processed list:** persist `processed_messages.json`. Un-gitignore it and add it to the workflow commit step. In dry-run, read-only and ignored.
  - **Check:** a run on day D+1 skips emails processed on day D (unit test with a fake Gmail client).
- **Empty day:** `gmail_ingest` returns 0 → `run_daily` sends a short "Nothing new today (N newsletters already read/binned)" email and exits 0.
  - **Check:** a unit test, plus the run is marked success.
- **Ranking safety net:** Call 2 fails after retries → the digest is built unranked (all Call 1 summaries, grouped by category) with a "⚠ Ranking unavailable today" banner, and still sent.
  - **Check:** a unit test with a stubbed Claude client returning truncated JSON.

### A3 — Retrieval (`link_pipeline.py`)
- **Link context capture:**
  - For each `<a>`: the text of the nearest block ancestor (p/li/td/div, ≤ 600 chars) plus the nearest preceding heading or bold line.
  - Stored as `context` on the link.
  - Replaces the plain-text sponsor-window heuristic for v2. The sponsor signals move into rules.
- **Classification rules (T1), cheap and certain, before any network:**
  - Admin, poll, survey, profile, legal and sponsor-context patterns.
  - **Change from today:** X/LinkedIn **post** URLs are no longer skipped. Per the label review they are articles. LinkedIn `/in/` profiles stay junk.
- **Resolution (T2):**
  - Hop-by-hop redirects, never auto-following into a block.
  - Handles HubSpot/Batch `e3t` pages: a 200 that contains a meta-refresh or JS redirect, then a 307.
  - Post-resolve rules run again on the destination: homepage, careers, ticker, model/repo, benchmark, docs and featured-tool patterns are junk; video/podcast hosts are media.
- **The Neuron** (sender match): email body only, so its links aren't processed at all (D1).
- **Fetch:**
  - T3: one polite retry on 429, honouring `Retry-After` (≤ 30 s).
  - Per-host spacing of 3 s.
  - T5b: publisher feed lookup on failure, with each host's feed fetched at most once per run.
  - X posts: the `publish.twitter.com/oembed` text.
- **Stricter judge of a fetch (from the spike):** ok = ≥ 1500 chars and not a robot-check, paywall or teaser page. Otherwise status `partial`, `paywalled` or `blocked`.
- **Fallback (A3/D2):**
  - Article not ok → the item's body = the link context.
  - Its title gets the suffix "(full article unavailable)". Call 1 summarises from the context.
  - Media items behave the same, with "(video/podcast — not fetched)".
- **Checks:**
  - pytest with fixtures for each newsletter format (Batch `e3t`, Kit, beehiiv, TLDR, Substack, Benedict).
  - Context capture is non-empty for ≥ 95% of fixture links.

### A4 — Junk judge (Haiku)
- **Input per link:** anchor text, context and resolved destination URL.
- **Output:** `article` / `media` / `junk`, plus a short reason.
- **Batching:** 40 links per call, with JSON output and retry.
- **Order:** rules first; the judge sees only links the rules didn't settle.
- **Prompt:** includes the README labelling rules verbatim.
- **`evals/junk_filter/run_eval.py`:** runs rules + judge over `labels_v1.csv` (dev). Reports the confusion matrix, article→junk count and junk recall, and writes `results_v1.md`.
- **Iterate on the prompt and rules until dev passes:** 0 article→junk and ≥ 90% junk recall.
  - Every iteration's numbers are logged in the progress file.
  - The bar is never lowered.
- **Held-out set:**
  - Build `labels_v2_holdout.csv` from the newest available digest days.
  - Claude labels **blind, before running the judge**, and commits the labels first so the git history proves the order.
  - Run the judge and record the disagreements for Pause 1.
- **Cost:** about 4 Haiku calls per run of 150 links, so pennies.

### A5 — Coverage, invariants and dry run
- **Manifest v2 per link:** `class`, `reason`, `rule_or_judge`, `status`, `chars`, `resolved_url`, `context_used`.
- **Coverage line in the log and digest footer:**
  - `real-article coverage (excl. The Neuron): X/Y = Z%`, plus a per-newsletter table.
  - Real = class article. Covered = ok.
- **`evals/invariants.py`** (runs at the end of every v2 run, and standalone over the committed history):
  - **No email in two consecutive digests**, by Gmail message id in the manifest. *(The manifest gains `message_id`.)*
  - **Digest landed:** a committed output folder exists for every scheduled date. Run against the git history.
  - Failures print loudly, and the step fails in dry-run.
- **Workflow:** `workflow_dispatch` inputs `dry_run` (bool) and `v2` (bool). Dry-run = v2 + include Trash + no send + no commit + upload artifact.
- **Dry run on GitHub:**
  - Replay the 2–3 most recent days that had emails, which are still in Trash.
  - Write `evals/release_a_dryrun.md`: old manifest vs new, per newsletter, against AC1–AC5 and the coverage targets (≥ 65% excl. The Neuron; The Batch ≥ 60%; no newsletter worse).
- **Cost:** one dry-run day ≈ the live run's Haiku cost plus the judge, so cents.

## ⏸ Pause 1
The user reviews:
- `release_a_dryrun.md`
- The held-out disagreements
- A 10-item "no fake success" spot check (AC2), sampled by the report

Approval → switch the scheduled run to v2, then watch 3 nights for AC3 (no repeats).

## Release B (KR)

### B1 — Auth + API
- **Migration `002`:**
  - `items.class` (article/media/junk/email_body)
  - `items.class_reason`
  - `items.context`
  - `items.one_liner`
  - `retrieval_status` adds `context_only`
  - `events.action` adds `not_junk`
  - a `runs` table (digest_date, finished_at, ok, neon_ok, coverage)
- **`backend/today_store.py`:** the queries.
- **`backend/routes/today_routes.py`:**
  - `GET /api/today?date=`: ranked cards, Everything-else, junk list, metrics, last_updated, previous dates.
  - `GET /api/items/<id>`: the reader.
  - `POST /api/events`: action, item_id, reason (required for dismiss → 400 without), undoes_event_id.
  - `GET /api/later`.
- **`backend/auth.py`:**
  - A password from env `APP_PASSWORD`.
  - A signed session cookie (`SECRET_KEY`), 30 days, HttpOnly, Secure when hosted.
  - `before_request` guards **every** `/api/*` route except `/api/login` and `/api/health`.
  - Login rate limit: 5 attempts a minute.
- **Checks:**
  - pytest against a throwaway schema on Neon (`today_test`, created and dropped per run), or a local Postgres if one is available.
  - Every route returns 401 without the cookie.
  - Dismiss without a reason → 400.
  - Undo works.
  - Events are append-only (the existing trigger).

### B2 — Today page (React)
- **`TodayView`:**
  - Top 3 and Next 7 cards.
  - Everything-else rows with a one-liner.
  - Reader drawer (logs `open`).
  - Read now / Later / Build (optional note) / Dismiss (reason required).
  - Done state with Undo.
  - Later list.
  - "Junk today" shortcut with "Not junk".
  - Previous days.
  - Metrics strip ("Active X of Y days this month · N actioned today").
  - "Last updated".
- **Mobile-first, per the existing standing principle:** stacked cards < 480 px; reuse the existing patterns from Sessions 35–37.
- **Hosted build mode (`REACT_APP_MODE=today`):** shows only Today + Later + the login.
- **Checks:**
  - React tests for the reason-required dismiss and for undo.
  - **Browser QA via Chrome** at 390 px and 1280 px, with screenshots in the progress log.

### B3 — Store-first ingestion (AICoS, after Pause 1)
- **`neon_store.py`:**
  - Upsert `items` right after Layer 1, before any Claude call. The item id = the canonical URL, or message-id + subject for bodies.
  - Enrichment (summary, one_liner, rank, why) is updated after Layer 2.
  - A `runs` row per run.
- **Neon is the processed record:** ingest skips message ids already present. `processed_messages.json` is kept one more week as a fallback, then removed.
- **Neon failure:** the email still sends with a "⚠ Today page not updated" banner, and the workflow step fails at the end so GitHub notifies the user.
- **Checks:**
  - A unit test with Neon unreachable (bad URL) → email built with the banner, exit code ≠ 0.
  - A replay of one dry-run day writes the expected item count.

### B4 — Hosting
- **Render web service** via the API (`RENDER_API_KEY`):
  - Free instance, from the GitHub repo.
  - Build: `pip install -r backend/requirements-today.txt && npm --prefix frontend ci && npm --prefix frontend run build`.
  - Start: `gunicorn backend.today_app:app`.
- **`backend/today_app.py`:**
  - A slim app factory: auth + today routes + the React build as static files.
  - No chromadb, no notes, no Anthropic key needed, which keeps it within the free tier's 512 MB.
- **Env:** `DATABASE_URL`, `APP_PASSWORD`, `SECRET_KEY`, set via the API from local `.env`. The user sets `APP_PASSWORD` in `.env` first; ask at B4 if it's missing.
- **Desktop local run:**
  - The full local app gets the Today view too, against the same Neon.
  - A `RUNNING.md` section with exact commands.
- **Checks:**
  - Deploy succeeds.
  - `/api/health` 200 and `/api/today` 401 without login, from outside.
  - Browser QA of the hosted URL at mobile width, using cookie login.

## ⏸ Pause 2
The user's mobile walkthrough of the hosted URL.

## Risks
- **Render's Python environment may lack Node for the React build.** Fallback: build in a GitHub Action and serve the committed build, or use a Docker deploy.
- **The `e3t` meta-refresh format could change.** Covered by the fixture test plus the nightly coverage metric.
- **Haiku judge drift.** Covered by the "Not junk" correction rate on the Today page, plus held-out re-checks.
- **The Neon free tier** (0.5 GB) is ample at roughly 70 items a day.

---

## Amendments from the plan review (2026-10-04, Plan agent; all accepted)
1. **Protecting the live digest.**
   - The workflow commits `processed_messages.json` **only when v2 is on**.
   - The commit step runs `git pull --rebase` before pushing, and gets `if: always()` so a deliberate failure can't skip saving state.
   - Any deliberate failure (Neon down) moves to a separate final step.
   - **The loop never pushes to AICoS between 21:00 and 05:30 UTC**, the window when the nightly run can be in progress.
   - Workflow edits are linted with `actionlint` before push.
2. **Golden test for v1.**
   - Recorded fixtures + stubbed Claude → v1 `cleaned_digest.txt`/`final_digest.txt` must be byte-identical to pre-change output.
   - Runs every iteration that touches AICoS.
   - All v2 logic lives in new modules or in branches gated on `--v2`.
3. **Fair dry-run comparison.**
   - Dry-run uses `recent_urls.json` as committed **before** date D.
   - v1 and v2 run **side by side on the same emails in one job**, and both are scored with v2's classes. The baseline is then real-article coverage, not raw link %.
4. **Judge eval integrity.**
   - Before any tuning, split `labels_v1` (stratified by newsletter) into `dev` (~100) and `test` (~50), and commit the split first.
   - Tune only on dev. Run test **once**.
   - The launch bar is judged on user-confirmed labels: the test split, plus at Pause 1 the held-out disagreements and a random sample of ~20 fresh links for the user to label.
   - Claude's blind labels are only a pre-filter, never the grade.
5. **Context for the eval set (new milestone A1b, done first because Gmail Trash expires after 30 days):**
   - Re-fetch the 20 Sep → 2 Oct source emails locally with `includeSpamTrash` and recompute each labelled link's context.
   - Write it to a `labels_v1_context.json` sidecar. Raw emails stay out of git.
6. **Neon keys (B1 migration 002).**
   - Extend the existing `kind` CHECK (article/media/junk/email_body) rather than adding a parallel `class` column.
   - Add `message_id`.
   - Add a `processed_messages` table (message_id, digest_date) as the processed record.
   - The item id stays the canonical URL. A repeat on a later day updates `also_in`/`last_seen_date` instead of duplicating.
   - Junk rows are per-day sightings, so "Junk today" lists links by sighting date, not first-seen date.
7. **Neon failure:**
   - The processed list/state is always committed (`if: always()`).
   - The failure surfaces in a separate final step.
8. **Empty-day paths, all handled:**
   - Ingest finds 0 emails.
   - Layer 1 finds no `.eml` files.
   - Layer 2 has every item already featured.
   - Each sends the short notice and commits an `output/EMPTY` marker, so digest-landed passes.
   - The digest-landed check starts from 2026-10-05, because the history has known gaps.
9. **Layer 2 resilience.**
   - API errors (overloaded/5xx) retry with backoff, then degrade instead of `sys.exit`.
   - A failed Call 1 batch is skipped with a warning.
   - A failed Call 2 → unranked digest.
   - Tests cover broken JSON **and** API errors.
10. **Setup, so the loop needn't stop outside the pauses.**
    - Already done: `RENDER_API_KEY` verified, Render's GitHub app has access.
    - The loop generates `SECRET_KEY` and a strong random `APP_PASSWORD` into KR `.env` and tells the user where to find it, rather than stopping.
    - Render fallbacks:
      - React build out of memory → build in a GitHub Action.
      - `ProxyFix` for the Secure cookie.
      - Outside checks retry through a ~50 s cold start.
    - `db/migrate.py` gains a `--schema` option for the throwaway test schema.
11. **Spec items made explicit:**
    - `not_junk` events are exported into the junk eval set (`evals/junk_filter/export_corrections.py`, run on demand).
    - Everything-else rows are openable and actionable.
    - Junk items are written to Neon.
    - The spec's "junk-label review" pause is **already done** (labels locked 2026-10-04).
12. **Cuts:**
    - No login rate limiter. A random 24-character password makes guessing impractical.
    - No old-code removal this phase.
    - No `REACT_APP_MODE`: the hosted `today_app.py` reports `mode: today` on `/api/health`, and the React app hides other views from that.
