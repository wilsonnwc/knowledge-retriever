# Session Log

A running record of progress and learnings. Update this at the end of every working session before closing VS Code.

---

## How to use this file

At the end of each session, copy the template below and fill it in at the top of the **Sessions** section. Takes 5 minutes. Makes the next session 10x faster to restart.

### Template

```
---
### Session [N] — [Date]

**Phase/step completed:** 
**Where to pick up next:** 

**What worked:**
- 

**What didn't work / got stuck on:**
- 

**Learnings (context architecture or otherwise):**
- 

**Open questions to come back to:**
- 
---
```

---

## Sessions

*(most recent at the top)*

---
### Session 21 — 2026-08-24

**Phase/step completed:** UI build plan Session 2 (`system/ui-build-plan.md`) — implemented all 6 planned Flask API endpoints for real (import, import/confirm, notes list/get/patch, topics, tags), replacing the `501 not_implemented` stubs. Live-tested every endpoint end-to-end against real notes data, including a full import→save→verify→delete round trip, with no permanent trace left (`git status` on `notes/` clean afterward).

**Where to pick up next:** Before anything else — (1) add `OPENAI_API_KEY` to `.env` (still missing as of end of session), and (2) actually run and try the backend end-to-end (user has not tried it yet — see "How to Run" in CLAUDE.md's "IMMEDIATE NEXT" line). Only after that: Step 4 of the plan — wire the React frontend to these real endpoints instead of mock data (Notes list/detail/tags first, then the Import wizard's Confirm step). Search/Chat still has no backend endpoint at all — deliberately out of scope this session (confirmed with user) since it has an open design question (Session 19's "how is sources elaboration generated" question) blocking a real implementation.

**What worked:**
- Reused `scripts/chunking.py`'s existing `parse_frontmatter()` rather than writing a second frontmatter parser — kept the new `/api/notes` listing consistent with how the same notes get chunked/embedded, instead of two parsers silently disagreeing on messy real frontmatter.
- Diagnosed real notes' frontmatter before writing the parser: most notes have no `title` field at all (`source` doubles as the title), a few have a redundant `topic:` field, dates mix `YYYY-MM-DD` and `YYYY.MM.DD`. Derived title with a fallback chain (`title` → `source` → filename) and derived topic from the folder (authoritative) rather than trusting the inconsistent frontmatter field.
- Caught a real crash risk before it could fire: `embed_all_notes()` calls `sys.exit(1)` if `OPENAI_API_KEY` is missing, which would kill the whole Flask process, not just fail one request. Added an explicit key-presence check before calling it, returning a normal warning response instead.
- Live end-to-end testing (not just reading the code) caught two dependency bugs that reading alone wouldn't have: `backend/requirements.txt` pinned `anthropic==0.25.0`, incompatible with the `httpx` version it pulls in on this machine (`Client.__init__() got an unexpected keyword argument 'proxies'`) — fixed by unpinning `anthropic`/`openai` (matching the root `requirements.txt` convention) and pinning `httpx<0.28` (the version that removed the `proxies` kwarg anthropic's older client construction still passes).
- A `pkill` pattern-match to restart the dev server silently failed to kill the actual running process (command-line format didn't match the grep pattern), so a stale server kept serving the *old*, broken dependency versions for several retries even after the fix was installed — each "still broken" result looked like the fix hadn't worked. Caught by checking `lsof -i :PORT` for the actual PID instead of trusting the pattern-based kill succeeded.

**What didn't work / got stuck on:**
- `.env` is missing `OPENAI_API_KEY` (only `ANTHROPIC_API_KEY` is present) on this machine, even though `backend/.env.example` documents it as required and Session 10 already built semantic search against it. Embedding is currently skipped with a warning on every save until this is added back.
- Port 5000 was unavailable for local testing (macOS AirPlay Receiver commonly claims it) — tested on port 5050 instead; not a code issue, just a local dev annotation for next time.

**Learnings:**
- A version pin from early in a project (`anthropic==0.25.0`) can silently rot — the SDK's own internal HTTP client construction assumed an older `httpx` API shape that a fresh `pip install` on a new machine happily installs a newer, incompatible version of. Reading the code gives no signal of this; only actually running it surfaces it.
- When a "fix, restart, retest" loop keeps failing identically, verify the restart actually happened (check the port's real PID) before concluding the fix itself is wrong — a silently-failed process kill can make a solved problem look unsolved indefinitely.

**Open questions to come back to:**
- `OPENAI_API_KEY` needs to be added to `.env` before real embedding/semantic search can run through the new `/api/import/confirm` endpoint.
- All 3 Session 19 UX questions, still unanswered (Go to article behavior; sources elaboration generation + eval discipline; API cost).
- Frontend-to-backend wiring (this session's "next" item) — not started.
---
### Session 20 — 2026-08-23

**Phase/step completed:** Frontend design system pass on top of the Session 19 UI prototype — fixed a broken `npm` environment, then did a full visual reskin plus a real IA restructuring to a Claude Desktop-style layout (left sidebar with Projects/Notes/Goals nav + unified History, single Search/Import landing chat window replacing separate top-nav pages).

**Where to pick up next:** Wiring the Search/Chat UI to the real `chat.py` backend (still pure mock data) — same as Session 19's open item, now on the new layout. Also the 3 open questions from Session 19 (Go to article → Edit not Read; how sources elaboration gets generated + eval discipline; API cost of that generation) are still unanswered.

**What worked:**
- Diagnosing before fixing: the "unstyled form" complaint traced to a real root cause — this project had **zero** base CSS for `input`/`select`/`label`/`.btn` anywhere, not a font/sizing tweak. Fixed once, globally, via CSS variables in `index.css` rather than patching each screen.
- Restructuring App.jsx's page-routing state (`view`/`mode` instead of separate `notes`/`import`/`search` pages) let Import and Search share one landing window with a mode toggle, while reusing all the already-built wizard/chat components unchanged — no functionality was rebuilt, only re-routed.
- Asking clarifying questions before the big IA restructuring (toggle vs. auto-detect, nav-click behavior, one-pass vs. incremental) avoided guessing on genuine UX decisions the user had opinions on.

**What didn't work / got stuck on:**
- User ran `npm audit fix --force` after a routine `npm install`, which silently downgraded `react-scripts` to a non-functional `0.0.0` and gutted `node_modules` from 1310 to 32 packages — broke the ability to run the app at all. Recovered cleanly via `git restore` on `package.json`/`package-lock.json` (uncommitted) + reinstall, since the damage was never committed.
- Found and fixed a real duplicate-definition bug in `TagPicker.css`: `.btn`/`.btn-primary`/`.btn-secondary` were defined twice in the same file with different values, silently fighting the new global button styles depending on CSS load order.
- `npm install` initially failed with `EACCES` on `~/.npm/_cacache` — leftover root-owned files from a past `sudo npm` invocation, unrelated to this project; fixed via `sudo npm cache clean --force`.

**Learnings:**
- `npm audit fix --force` is not a safe "clean up warnings" command — it's allowed to replace core tooling (here, the package that runs the whole app) to silence a vulnerability, even if that breaks the app. The `28 vulnerabilities` npm reports on a stock Create React App project are normal/low-real-risk noise in CRA's own dev-dependency chain, not something to "fix" reflexively.
- A visually "almost right" UI can have a structural gap invisible until you go looking — this project's inputs/buttons had literally no CSS anywhere, not a styling mismatch. Worth checking base element styles exist at all before assuming a font-size tweak will fix an inconsistent look.
- Large IA changes (nav restructuring, merging two flows into one) are worth pausing on for explicit scope/interaction decisions before writing code, even when the visual reference (a competitor's app) makes the target look obvious — the underlying state model (how "mode" and "view" and "history" relate) isn't obvious from a screenshot alone.

**Open questions to come back to:**
- Backend wiring for Search/Chat (Session 19's item, still open).
- The 3 Session 19 UX questions (Go to article behavior; sources elaboration generation + eval discipline; API cost).
- New from this session: history currently only supports reopening the *most recent* completed import with full detail — multiple past imports show in the list but aren't all individually reopenable yet (mock-data limitation, not a real backend).
---
### Session 19 — 2026-08-12

**Phase/step completed:** Built the Search/Chat UI (roadmap item 6) end-to-end with mock data — ChatGPT-style conversational interface: sidebar with "+ New Chat" and conversation history (first-question titles), chat thread with user/assistant bubbles, sources section per assistant reply (stat line + AI-generated 1-2 sentence elaboration + snippet cards), and an article modal reached by clicking a snippet card. Locked 4 UX design decisions with the user first: (1) snippet shows the exact embedded chunk if it's 2+ sentences, otherwise shows the sentence before/after in plain text with the matched chunk in bold italic; (2) the "N articles found" line is paired with a separately AI-generated elaboration specific to that conversation's retrieved sources; (3) sidebar history shows the first question verbatim (flagged for re-review once used in practice); (4) the article modal renders like a formatted document (parsed meta row, paragraphs, styled "Why this matters" quote block) rather than raw markdown, with "Back" (returns to chat) and "Go to article" buttons. Verified all of this live in the browser via claude-in-chrome — new chat, follow-ups, snippet clicks, and modal navigation all confirmed working.

**Where to pick up next:** Three open questions from the user, not yet answered — see "Open questions" below. Also still pending: wiring this UI to the real `chat.py` backend (currently pure mock data, no Flask endpoints called yet).

**What worked:**
- Getting explicit answers to the 4 UX questions before building avoided rework — the snippet chunk/context split, the elaboration field, and the modal's read-vs-edit button pair were all decisions the user had specific opinions on that weren't guessable from the spec alone.
- Testing live in the browser (not just reading the code) caught that "Go to article" needed to be wired through App.jsx's existing `handleEditNote`/`setCurrentPage` state — confirmed the full navigation flow actually lands on the Edit Note modal for the right note.

**What didn't work / got stuck on:**
- "Go to article" currently opens the note directly into **Edit** mode — there's no dedicated read-only "view" state distinct from the NotesListView's own click-to-preview panel (`NotesDetailPanel`) or the full edit modal. This wasn't caught until the user reviewed it after building — see open question 1 below.

**Learnings:**
- A CTA labeled "Go to article" carries an implicit expectation of a *read* view; wiring it to the nearest existing screen (Edit) without checking whether that screen matches the CTA's implied mode is an easy way to ship a mismatch between label and behavior — worth explicitly deciding "read vs. preview vs. edit" as named UI states before adding more entry points into note detail.

**Open questions to come back to (from the user, 2026-08-12 — do not answer until next session):**
1. **"Go to article" opens Edit, not Read.** Should this be fixed to open a read-only view instead? Or does this surface a bigger gap — the app currently has no clearly-defined "Read" view distinct from "Preview" (`NotesDetailPanel`, reached by clicking a note in the Notes list) and "Edit" (`EditNoteModal`)? May need to name and scope these three modes explicitly before deciding where "Go to article" should land.
2. **How is the sources elaboration (1-2 sentences) actually generated?** Once this is wired to a real LLM call: should it go through the same eval discipline as other AI-generated pieces of this project (per this repo's "no skipping evaluation" principle), rather than just trusting whatever comes out? And — practically — will generating it consume Anthropic API usage/cost, or does it ride on the user's Claude Pro plan? (This project currently calls the Claude API directly via `ANTHROPIC_API_KEY` in `.env`, per `scripts/chat.py` — Claude Pro is a separate, unrelated subscription for claude.ai chat access, not API credits. This distinction itself may be worth confirming with the user next session, not assumed.)
---
### Session 18 — 2026-08-09

**Phase/step completed:** Designed comprehensive UX/error-recovery eval checklist for `research_goal()`. Extracted candidate checklist items from three UX design frameworks (Microsoft's 18 Human-AI Interaction Guidelines, Error Recovery Patterns from AIUXDesign, Google PAIR's Calibrated Trust framework). Prioritized PM-level must-haves and should-haves, grounded in real user experience patterns (ChatGPT, Claude chat). Created reusable testing templates and test-goal candidates file.

**UX Spec Locked (5 core decisions):**
1. Every-step streaming updates (Claude-like: step completion visible, new step on new line)
2. Immediate mid-loop fallback notifications in plain language (not silent degradation)
3. Follow-up sequence: New goal → Modify goal → Online search (CLI prompts now, buttons in lightweight UI later)
4. LLM-powered error recovery suggestions (intelligent per-error-type mapping)
5. Upfront expectation-setting prompt (clarify: "searches *your* notes, not web search")

**Eval Strategy: Hybrid (Rule-based + Manual UX review)**
- Rule-based checks: structural/timing verification (YES/NO, measurable)
- Manual UX quality: tone/clarity/naturalness (1–5 rating scale)
- Why: personal project scale, user will do manual testing; reserve LLM-as-judge for only genuinely subjective quality calls

**Artifacts Created:**
- `system/research-goal-ux-testing-checklist.md` — 14-item reusable template covering ESTABLISH → EVOLVE → RECOVER → COMPLETION phases
- `system/research-goal-test-candidates.md` — running list of test goals (3 candidates identified: stakeholder communication, design judgment, AI PM skills/frameworks)

**Where to pick up next:** User will test with 3 goal candidates using the checklist template, capture structural/UX feedback, then return findings. Once patterns emerge from testing, prioritize UX fixes before building lightweight UI (roadmap item 6).

**What worked:**
- PM-driven strategy: user defined success criteria upfront (must-haves vs. should-haves), then I surfaced options from frameworks. Avoided engineer-first-proposal trap identified in learnings file.
- Grounding spec in familiar patterns (ChatGPT, Claude) reduces unfamiliarity tax — users already know what "streaming updates" and "follow-up prompts" feel like.
- Hybrid eval strategy balances speed (rule-based checks) with quality (manual UX spot-check) — appropriate for personal-project scale.

**Learnings:**
- **User experience design is strategy work, not taste work.** The three frameworks (trust calibration, error recovery, interaction guidelines) give structure to "make it feel natural" — not arbitrary preference, but proven principles. Every checklist item maps back to a user need or a trust/error principle.
- **Testing strategy depends on project scale and who the user is.** For a personal project where the PM (user) will be the primary tester, manual UX review + rule-based structural checks beats full LLM-as-judge automation. Different tradeoff for a production multi-user product.

**Open questions / deferred:**
- None blocking. Ready to test whenever user resumes.

---
### Session 17 — 2026-08-09 (continued)

**Phase/step completed (second half):** Diagnosed and fixed the test design mismatch discovered in first half of session. Core issue: the original eval strategy assumed "given a pre-specified item, judge if covered" but the feature actually does "generate items from goal + notes, then judge them." This fundamental mismatch meant no pre-specified item would ever appear in the output.

**Solution: complete redesign of eval strategy.**
1. Changed `research_goal()` return type from string → structured dict with: original_goal, narrowed_goal, all_items, covered_items, open_items, coverage_count, total_count, round_log, markdown_path. Markdown file still generated for human readability; summary printed to stdout for CLI.
2. Rewrote all 5 test cases to validate OUTPUT PROPERTIES instead of matching pre-specified items:
   - rg_001: Caveat tags used correctly (generic sources have caveats) — STRUCTURAL
   - rg_002: Uncited claims not in covered_items — RULE_BASED
   - rg_003: No duplicates or overlaps in covered/open — RULE_BASED
   - rg_004: Arithmetic holds (covered + open == total) — RULE_BASED
   - rg_005: All sources are valid file paths — RULE_BASED
3. Rewrote eval_research_goal.py to implement structural validation checks (check_coverage_arithmetic, check_no_duplicates, check_no_uncited_covered, check_all_sources_valid, check_caveat_usage).
4. First eval run: 4/5 passing (80%). rg_003 failed because model had generated duplicate items. This was a REAL BUG in research_goal(), not a test issue.
5. Fixed bug: added deduplication to all_items after round 1 using `list(dict.fromkeys(all_items))` (preserves order).
6. Final eval run: **5/5 passing (100%)** ✅

**Where to pick up next:** Eval infrastructure is complete and working perfectly. Next: build the lightweight UI (roadmap item 6) — user needs to describe their preferred build-sequencing approach. Also deferred: question 3 (other dimensions real teams consider), interview-defense drill, 5 "Why this matters" TODOs on Kindle imports.

**What worked:**
- Played back the test case problem to the user in plain language, which led to their own clear restatement of the mismatch ("feature generates its own items, test assumes pre-specified items"). This was the key insight that unblocked the fix.
- Running the eval end-to-end caught a REAL bug (duplicate items) that code review alone wouldn't have surfaced. The eval is a more effective verification tool than manual inspection.
- Structured validation approach (validate output properties, not item content) is more robust and aligns with what the feature actually does. No more arbitrary thresholds or LLM judging.

**What didn't work / got stuck on:**
- Initial test design (pre-specified items) was fundamentally incompatible with feature behavior. The mismatch wasn't a bug to fix but a design question to rethink.
- First eval run: two tests with wrong eval_method assignment. Fixed by identifying tests by test_name instead of test_id.

**Learnings:**
- **When an eval keeps failing, the eval itself may be wrong, not the feature.** A 60% pass rate triggered investigation of test design, which revealed the core assumption (pre-specified items) didn't match the feature's actual input/output contract. Redesigning the eval strategy was the right move.
- **Structural validation (checking output properties) is more maintainable than semantic validation (trying to judge intent).** As features evolve, structural tests remain valid; semantic tests often drift.
- **An eval that runs end-to-end is more valuable than a theoretically perfect eval that fails to execute.** The first eval run surfaced both test design issues AND a real bug (duplicates). That's practical feedback.

**What didn't work / got stuck on:**
- The two LLM-as-judge test failures — rg_001 returned NOT_FOUND (item wasn't in the output), rg_002 returned FAIL with truncated feedback. Need to read full model output from one of these runs to understand why the item wasn't found or why the parsing failed. The parsing logic in `eval_research_goal.py` (lines 165–174) is simplistic — splits on "### Covered" and "### Open" headers and grabs lines starting with "- " — and it's likely fragile to output format variance.

**Learnings:**
- **An eval that runs end-to-end without crashing is already valuable.** Discovering that the eval infrastructure itself has bugs (like the stdin blocking issue) is worth running before claiming the feature is "ready for eval." An eval that doesn't run tells you nothing; an eval that partially passes tells you what's trustworthy (rule-based checks) and what needs work (LLM-as-judge parsing).
- **Scope-matching in eval cases needs to be explicit and codified.** "Generic vs. AI-specific" sounds clear in conversation, but rg_001's original design showed it wasn't — user had to articulate the actual rule (subset-of-scope is fine, orthogonal-to-scope is open). Making that rule visible in the test case description is the fix for next time.

**Open questions to come back to:**
- Why did rg_001/rg_002 LLM-as-judge checks fail? Likely the parsing is too simple for real model output variance.
- Should we invest in fixing the parsing, or step back and use a simpler eval method (rule-based only, plus manual spot-checks)?
- Lightweight UI: what's the third build-sequencing option the user wants to describe?
---
### Session 16 — 2026-08-07

**Phase/step completed:** Confirmed Session 15's three research-goal bug fixes hold on a clean re-run (12/24, then 12/24 stable — covered+open summed correctly every round, no duplicates, every covered item cited a real source). Then addressed two real quality gaps the user spotted in that clean output: (1) some "covered" items were shallow or off-topic (e.g. a generic product-discovery note "covering" an AI-specific question) with no way to flag that — added a `[caveat: ...]` tag the model can attach to a covered item when the source is thin/generic, threaded through `_parse_labeled_list()` (now returns 3-tuples: item, source, caveat) and both prompts in `research_goal()`. (2) Root-caused why repeated runs on the same goal gave different item counts/wording — Claude's API defaults to `temperature=1` (full sampling) on every call, and `_ask_claude()` wasn't setting it. Added an optional `temperature` parameter to `_ask_claude()`; left `scope_goal()` (exploratory, benefits from variety) at default, set `research_goal()`'s covered/open classification step to `temperature=0` (judgment task, wants consistency). Also added roadmap item 6: a lightweight end-to-end web UI (chat/search/research-goal + article import + tag/project management) — not started, still deciding build sequencing.

**Where to pick up next:** User wants to build real eval cases for the `research_goal()` coverage step — not just conceptually, but hands-on, trying all the common approaches discussed (rule-based/exact-match checks, LLM-as-judge, manual eval). Concrete plan agreed but not yet built: a small JSON file of real test cases in the eval-case format discussed this session (test_id, goal, retrieved_notes, item_being_judged, expected_verdict, expected_source, expected_caveat, tests, acceptance_bar) — seeded from real bugs already found this project (e.g. the Teresa Torres generic-note case as a caveat-required test), plus a first LLM-as-judge script to try that approach hands-on. Start here next session. Separately: the lightweight UI's build order is still undecided — design-shell-first vs. build-everything-together vs. a third option the user wants to describe (they picked "Other" on the build-order question and hadn't answered before this session's context needed to move on) — needs revisiting.

**What worked:**
- The user's own repeated-run test ("the topics aren't the same every run") was the right way to surface a real, nameable AI concept (temperature/non-determinism) rather than treating it as a bug — a good instance of a "problem" actually being an opportunity to learn a core mechanism.
- Splitting temperature by *step type* (exploratory vs. judgment) rather than applying one global setting reflects real production practice, not just a plausible-sounding guess — confirmed this against how AI PM/data-science teams actually tune this parameter (sweep values against an eval bar, pick the lowest temperature that still meets the bar for that step's job).

**Learnings:**
- **Temperature is a knob tuned against an eval bar, not a creative preference** — the same "define what good means, measure against it, then tune" discipline used for chunking/retrieval-depth choices applies here too. Documented in `claude-brain/learnings.md` with the eval-case template and the automation tiers (rule-based checks, LLM-as-judge, manual eval).
- **A caveat/quality flag is a cheap way to add nuance to a binary covered/open judgment without a full depth-scoring system** — extending an existing prompt (one more instruction, one more optional tag) is nearly free compared to a second API call per item; the real cost lever in LLM features is usually "new call vs. extend an existing one," not "call the LLM at all."
---
### Session 15 — 2026-08-06/07

**Phase/step completed:** Built `--research-goal`, the Layer 4 ("goal-oriented research") prototype — explicitly a personal-learning build, not a claim this role would build Layer 4 (the job ad names it as the company's long-term destination, a later stage, not this squad's near-term scope; confirmed by re-reading `job-ad-reference.md`'s explicit "you're not hired to build Layer 1 or Layer 4" line before starting). Two pieces: (1) a goal-scoping step that loops with the user until a stated goal is specific enough to be diagnostic of their own notes rather than generic advice Claude would give with no notes at all, stopping on the model's judgment or the user saying stop (capped at 4 exchanges as a safety net, not the real stopping condition); (2) a multi-round gap-finding loop (capped at 3 rounds, stops early on zero new progress) that tracks a stable "covered/open" list against a fixed total, with each covered item requiring a citation to an actually-retrieved note file.

Also built `claude-brain/skills-to-learn.md` — a running backlog of AI-PM skills to learn and open tasks across all projects, populated from a real scan of every project's session logs/CLAUDE.md rather than guessed from memory. This didn't exist before tonight despite being mentioned earlier; the scan surfaced things neither of us would have listed from memory (e.g. `conference-recorder` has an entire second paused roadmap; `recipe-app`/`restaurant-researcher` don't exist as folders yet despite being listed as "in progress").

**Where to pick up next:** The `--research-goal` loop has NOT been successfully tested end-to-end yet — every real run tonight surfaced a genuine bug, and the session ended right after the third fix, before a clean re-run. Re-run it next session first, on the same goal used throughout tonight ("Identify which of the specific AI PM skills, projects, and experiences I've documented that are relevant to the AI PM roles I'm targeting, and find gaps in the ones I'm missing.") and confirm: covered + open sums to the total exactly every round, no duplicates in the printed remaining-gaps list, and every covered item carries a real cited source file. If that's clean, this feature is genuinely done. Separately, still open from Session 14: 5 deferred "Why this matters" TODOs, the interview-defense drill (now a 4th session running), and the formal eval script not re-run since the two Kindle imports.

**What worked:**
- The user caught all three bugs in this session by actually reading real output closely, not by code review — each one started with a plain, specific question ("how could there be 28/25 covered?", "why does 'source not cited' show up on things that sound uncovered?", "why is open larger than covered + total?") rather than a vague "something seems off." Each question pointed at the exact mechanism that was broken.
- Correctly identified, from the first real test run, that a gap list dominated by generic AI-PM-interview advice (negotiation strategy, interview formats) meant retrieval wasn't doing load-bearing work — the output would have looked similar with zero notes in the system. This is a materially harder catch than a crash or an obviously-wrong number; it required judging whether an AI feature's output was actually using the data it claimed to use.
- Rejected an inference-based alternative (diffing two independently-generated gap lists round-to-round to infer what got "covered") in favor of asking the model to state coverage directly — reasoned through explicitly rather than picked by default, because inferring meaning from a diff of two freeform LLM outputs is fragile in a way that asking directly isn't.

**What didn't work / got stuck on:**
- **Bug 1 — impossible coverage count (28/25):** the prompt asked Claude to "only use items from the original list, don't invent new ones" but never enforced it in code — round 2+ trusted whatever Claude returned. Fixed with `_closest_match()`/`_validate_against()`, a word-overlap similarity check that discards anything not a genuine match to the real round-1 list.
- **Bug 2 — "covered" items with no real backing** (e.g. "Specific case studies... (none documented)" labeled COVERED): the validator from Bug 1 checked the item's identity but not the *quality* of the covered claim. Root cause: Claude was asked to cite a source but an uncited claim was still being counted as covered. Fixed by demoting any covered item without a validated citation (to a file actually retrieved that round) down to open — an uncited "covered" claim is no more trustworthy than an invented item.
- **Bug 3 — open count exceeding the total, with duplicated items in the printed list:** `open_items` was being incrementally patched together each round from `validated_open`, `uncited`, and a "catch anything all_items forgot to mention" fallback step — and that fallback could re-add items already present from the round's own earlier construction, since nothing checked for existing membership before appending. Fixed by removing the incremental patching entirely: `open_items` is now always computed fresh each round as "everything in `all_items` not currently in `covered_sources`" — derived from state already trusted, rather than maintained by hand.

**Learnings:**
- **A feature that "uses" a user's data isn't necessarily using it in a load-bearing way** — check whether the output would look meaningfully different with the data removed. If not, retrieval is decorative, and the fix is upstream (scope the input better) not downstream (tune the retrieval).
- **Asking an LLM to follow a formatting/scope constraint in the prompt ("only use these items," "cite your source") is a request, not an enforced guarantee** — anywhere a number needs to be trustworthy (a count, a total, a percentage), validate the model's output against ground truth already held in code, every time, not just for the first bug found this way.
- **When multiple derived lists need to stay in sync (covered, open, a running total), maintaining each one by hand and patching mismatches invites exactly the kind of bug found here** — the more durable fix is computing every derived value fresh from the smallest set of state actually trusted, each time, rather than incrementally updating several lists and hoping they stay consistent.
- Documented separately in `claude-brain/learnings.md`: the agentic-loop vocabulary (termination condition, convergence, ReAct pattern) that came up while designing this feature's stopping conditions — useful interview vocabulary distinct from the plain-English "loop engineering" framing that prompted it.
---
### Session 14 — 2026-08-06

**Phase/step completed:** Resolved Session 13's open refactor decision and built the read-time related-notes extension. `search_notes()` and `search_notes_semantic()` now return `(context_string, top_note_path)` tuples instead of a bare string — chosen over parsing the path back out of the formatted string, since a silent parsing break felt like the wrong failure mode to accept for a small, one-time change. `chat()` now asks "Check for notes related to '<top note>'? (y/n)" after every answer and runs `suggest_related()` on demand if yes — the missing read-time half of Layer 3's "grown from every finding" slice, complementing Session 13's write-time version.

**Where to pick up next:** 5 deferred `[TODO — user to review]` "Why this matters" lines are still open across the two Kindle imports (1 in `continuous-discovery-habits.md`, 4 in `hard-thing-about-hard-things.md`). The interview-defense drill (rehearsing closed-book explanations of tags-vs-projects, the Chroma L2 bug, the client-side project filtering, and now the keyword-search retirement) is deferred a third time. The formal eval script has not been re-run since the two Kindle imports were added.

**What worked:**
- Testing the just-built feature with a real question ("what does Teresa Torres say about discovery?") immediately surfaced a genuine retrieval bug rather than a contrived one — `search_notes()`'s preview logic only ever grabbed a file's *first* `##` section, so a 7-section consolidated book note returned an honest-but-incomplete answer. The model wasn't wrong; retrieval hadn't given it the rest of the file.
- Diagnosed the bug as a data-model drift, not a code defect: `search_notes()`'s "grab section 1" logic was written when notes were short and single-topic; the bulk-import workflow later evolved to deliberately consolidate whole books into many-section files, and nobody went back to update the keyword search preview to match. Nothing crashed — it just quietly answered a category of question worse than before.
- Decided to retire `search_notes()` from the live `chat()` path rather than patch its preview logic — `search_notes_semantic()` can't have this bug at all, since `embed.py` already chunks by `##` section at embed-time, so there's no "which section to preview" decision left to get wrong. `search_notes()` itself is untouched and still called by `run_evaluation.py`, kept intact as the deliberate, explainable baseline the semantic search was measured against (82% vs. 96% precision@5).
- Fixed a portability bug in the global `~/.claude/CLAUDE.md` (outside this project, but found while working in it): a hardcoded absolute path to the master learnings file only resolved on the personal laptop's username. Fixed by referencing it relative to the `claude-brain` repo instead — same root cause and same fix pattern as the earlier Chroma distance-metric bug and the `/elaborate` symlink issue: something that works on the machine it was built on and silently breaks elsewhere.
- Verified (via `setup-machine.sh`, which builds every symlink from `$HOME` rather than a literal username) that all cross-machine symlinks — commands, skills, settings, learnings file, project memory — already resolve correctly and portably on both laptops; ran the script on both machines to confirm (0 linked, N already correct, 0 backed up on each).

**What didn't work / got stuck on:**
- Hit an environment mismatch on the work laptop: `ModuleNotFoundError: No module named 'chromadb'`. Root cause: this project never had its own isolated Python environment — it had been relying on whatever was globally installed, which happened to include the right packages on the personal laptop but not in the work laptop's `(base)` conda environment. Fixed by creating `.venv/` in the project root and installing `requirements.txt` into it. This needs `source .venv/bin/activate` at the start of every new terminal session on this project, especially on the work laptop.

**Learnings:**
- **Retrieval quality can silently degrade as a corpus's document structure evolves, even when no retrieval code changes and nothing crashes.** A locked eval set only measures what it was designed to measure — "does retrieval find the right *file*?" doesn't automatically catch "does retrieval find the right *section within* a file?" once files stop being single-topic. This is now written up fully in `learnings.md` under "On eval acceptance criteria needing to be actively revisited when feature scope changes" — including the three concrete moves an AI PM makes about it (treat eval sets as a living artifact tied to product/data changes, not a calendar cadence; convert real user confusion into permanent regression tests).
- A hardcoded absolute path (a doc reference, an old symlink, a `sys.path` entry) works perfectly on the machine it was written on and fails silently elsewhere — the fix is always either making the reference relative/portable, or codifying the setup step into something re-runnable, never trusting a path or a manual step to still be true on a different machine.
- Running the tool whose actual job is "verify state" (`setup-machine.sh`) is more trustworthy than eyeballing `ls`/`find` output myself — a manual check is scoped to what I guessed to look for, while the dedicated script checks everything it was built to track.
---
### Session 13 — 2026-08-06

**Phase/step completed:** Built `--suggest-related <note-path>` in `scripts/chat.py` — a small, deliberately narrow Layer 3 ("living knowledge base") rehearsal: compares a note against every other note already embedded, ranks by best-matching-chunk-per-note (so one long note can't dominate just by having more chunks), and groups results into "same project" vs. "other projects / unassigned." Wired as an ask-first step (not automatic) into `system/agent-bulk-import-instructions.md`'s "After Creating Files" checklist, only offered when the new note carries a `projects:` tag. Also re-read the job ad's exact Layer 3 language word-by-word ("living," "AI-maintained," "structured," "current," "grown from every project, source, and finding") before building, which surfaced that this feature only rehearses one slice ("grown from every finding") — "structured" (categorization) and "current" (staleness) remain untouched, worth stating explicitly rather than implying full Layer 3 coverage in interview.

**Where to pick up next:** A read-time extension was scoped but not built: after `chat()` answers a question, proactively ask whether to check for related notes on the single top-ranked retrieved note (reusing `suggest_related()` as-is, no changes needed there). Blocked on one small refactor decision: `search_notes()`/`search_notes_semantic()` currently return one formatted string with no clean way to extract "the top note's file path" separately — need to decide between (a) changing both to return `(context_string, top_note_path)` [small ripple to every caller, including the eval script] or (b) parsing the path back out of the formatted string inside `chat()` [no changes elsewhere, but fragile]. Decide this first, then build.

**What worked:**
- Re-reading the job ad's Layer 3 sentence phrase-by-phrase (rather than trusting an earlier compressed paraphrase) surfaced a real gap: "AI-maintained" implies active upkeep, not just storage — and breaking the sentence into its component claims made it possible to honestly scope which *slice* of that ambition a small feature actually covers, rather than overclaiming coverage of the whole idea.
- Testing against real note content (not just checking the code ran) is what caught the distance-metric bug: "The Mom Test" ranking behind weaker matches was a domain-knowledge red flag, not a test failure — spotted because the result contradicted something already known about the actual books, not because any assertion failed.
- Correctly identifying that a user-proposed idea (auto-searching the web for related articles) fell outside this role's actual ownership boundary (core retrieval / corpus search, a separate team per the ad) before building it — same category of mistake as the earlier Notion/Obsidian-connector question, caught before any code was written this time.

**What didn't work / got stuck on:**
- Found and fixed a real bug: the first version of `suggest_related()` computed `score = 1 - distance`, assuming Chroma's default distance metric is cosine (a common convention in embeddings tutorials, but not a guarantee for any specific collection). This collection was never configured with an explicit `hnsw:space` metric in `embed.py`, so Chroma silently defaulted to squared L2 distance instead — confirmed by querying a note's embedding against itself and observing a raw distance of exactly 0.0, with unrelated chunks at ~0.8–1.0+ (not the ~0–2 range consistent with cosine distance for short related text). The bug didn't crash or error; it produced numbers that still looked like plausible "similarity scores," which is why it needed a domain-knowledge sanity check (see above) rather than a code review to catch. Fixed by ranking on raw distance directly instead of inventing a similarity conversion that assumed the wrong metric.

**Learnings:**
- **A number that looks structurally valid (bounded, comparable-seeming) is not the same as a number that is semantically valid for the calculation being done with it.** `1 - distance` produced small positive numbers that read as plausible similarity scores regardless of which distance metric actually fed into it — the bug was invisible from the output's shape alone.
  > **Analogy:** it's like converting a temperature assuming it's in Celsius when it's actually in Fahrenheit — the converted number still looks like a real temperature (not an obviously broken one), it's just wrong, and nothing about its *appearance* signals the mistake.
- **"Living, AI-maintained knowledge base" is not one feature — it's at least three separable claims** (grown from findings / structured / current), each independently buildable and independently defensible. Treating a job ad's ambition language as a single monolithic target risks either overbuilding or overclaiming; breaking it into its component phrases first makes it possible to build one honest slice and say precisely which slice it is.
- **A design idea can be reasonable in general and still be the wrong thing for this specific project to build**, if it reaches outside the role's actual ownership boundary. Auto-web-search is a fine feature for some product — it's just core-retrieval's job at LeapSpace, not knowledge-management's, per the ad's own "partner with the team that owns core retrieval" line.

**Open questions to come back to:**
- The `(context_string, top_note_path)` vs. parse-the-string decision above — needs to be made before the read-time related-notes feature can be built.
- Not yet run: the project's own formal evaluation script (`system/evaluation/run_evaluation.py`) against the two newly-added notes from Session 12 — would answer whether the growing note collection is changing retrieval quality, a different and more rigorous question than "does new content show up when searched for directly" (which was checked).
- Interview-defense drill still deferred from Session 12 — now has more material to cover (the L2-distance bug joins the tags-vs-projects and Chroma-workaround items already on that list).
---
### Session 12 — 2026-08-05

**Phase/step completed:** Built and evaluated "project spaces" (Roadmap item 2, Layer 2 of the four-layer stack analysis in `system/job-ad-reference.md`): a `projects:` frontmatter field (many-to-many, separate from `tags:`), a `system/projects.md` registry tracking active/archived status, `--new-project`/`--archive-project` CLI lifecycle commands, and a `--project` filter added to both `search_notes()` and `search_notes_semantic()`. Also imported two new Kindle-highlight books ("Continuous Discovery Habits," "The Hard Thing About Hard Things") via the bulk-import workflow, both tagged into the one real active project (`leapspace-interview-prep`).

**Where to pick up next:** Decide whether to continue into a small Layer 3 taste (auto-suggesting related notes within a project as new ones are added — deliberately scoped small enough to defend under a follow-up question, not a shallow agentic demo) or first close the interview-defense gap (see Open Questions below).

**What worked:**
- Researching how Notion, Obsidian (PARA), and Zotero handle "project" as a concept before designing our own — all three independently converged on the same pattern (many-to-many grouping, structurally separate from tags), which gave real, citable evidence for the design rather than an invented convention.
- Deciding not to force a second project into existence just to have multi-project test data — `leapspace-interview-prep` is genuinely the only active project right now, and that's a legitimate finding, not a gap to paper over.
- Testing each CLI command's actual output after every step (not just "it ran without error") — this is what caught the registry bug below.

**What didn't work / got stuck on:**
- Found and fixed a real bug: `load_projects()` originally discarded each project's full detail line (e.g. `created 2026-08-05`) and kept only its status, so *any* registry rewrite silently dropped the date off every project except the one actively being changed. Caught by re-reading the file after an unrelated archive operation, not by the success message (which looked fine). Fixed by preserving each project's full line text and only ever replacing the line for the project actually being modified.
- Chroma's `where` metadata filter can't cleanly filter on `projects:` because `embed.py` stores frontmatter values as raw strings (e.g. `"[a, b]"`), not real lists — exact-match filtering breaks the moment a note has more than one project. Worked around by over-fetching (25 instead of 5) and filtering client-side in Python before trimming to the top 5.
- A semantic search query ("acting in a role before hiring") missed the newly-added Horowitz note and surfaced an unrelated one instead, even though the Horowitz note was correctly indexed (verified directly in Chroma — all 9 chunks present). A more distinctively-phrased query retrieved it correctly. Read as a retrieval-ranking/query-phrasing issue, not a defect in the project-filtering feature itself — worth keeping in mind as the note collection grows.

**Learnings:**
- **A "project" is structurally a many-to-many metadata grouping, not a folder or a tag** — and the reason it needs to be separate from a tag isn't arbitrary: a tag describes something permanently true about a note, while a project describes a temporary purpose tied to a real lifecycle event (an interview happening, a deadline passing). That's *why* projects need an archive mechanism and tags structurally don't.
  > **Analogy:** a tag is like a book's genre label (always true); a project is like the stack of books on your desk for this week's essay (temporary, purpose-driven, and the same book can sit in a different stack next month for a different essay).
- **Silent data-loss bugs are the hardest to catch precisely because the obvious test passes.** Archiving the *targeted* project worked correctly every time; a *different*, unrelated project's data was what quietly broke. Only caught by re-reading full file state after an operation, not by trusting a success message — directly reinforces this project's own "never move on without measuring" rule.
- **Re-reading a dense job-ad passage as a layered architecture (not just a sentence to interpret) surfaced a build-sequencing insight that a single read-through missed:** three separate passages, read together, describe four explicit layers (corpora → project spaces → living knowledge base → goal-oriented research), each stated as being built *from* the one below it — which is also, implicitly, the org chart of who owns what. Full breakdown in `system/job-ad-reference.md` under "The Four-Layer Stack."
- **AI-executed engineering and AI-suggested product decisions carry different interview risk, and conflating them is itself a risk.** Writing the Python is safe to claim as AI-assisted (matches the ad's own "prototype with AI tools" framing); approving a *design* option (e.g. why `projects:` is a separate field from `tags:`) without independently reconstructing the reasoning is not yet "internalized" and needs active rehearsal before interview, not just recall that it happened. See the new "Ownership Check" section in `system/job-ad-reference.md`.

**Open questions to come back to:**
- Interview-defense drill deferred, not done: can I explain, closed-book, why `projects:` isn't just another tag? Why many-to-many? Why did semantic search need a client-side workaround? Flagged explicitly in `system/job-ad-reference.md`'s "Ownership Check" section — not yet drilled as of this session.
- 5 total "Why this matters" TODOs deferred across the two new notes (1 in Continuous Discovery Habits — Ideation section; 4 in The Hard Thing About Hard Things — Product Strategy, Culture as Deliberate Design, Evaluate Executives Holistically, Two Core Skills sections) — need the user's own reasoning, not an AI-drafted guess.
- Whether to build a small Layer 3 taste (auto-suggested related notes within a project) this session or next, and whether to eventually wire in the `ai-chief-of-staff` project's daily article pipeline as a real "living memory" data source — both flagged as live ideas, neither started.
---
### Session 11 — 2026-08-04 (continued from Session 10)

**Phase/step completed:** Doc-elaboration pass across all 18 non-notes project docs (plan.md, CLAUDE.md, every file in `system/` and `system/interview-prep/` and `system/evaluation/`, excluding the raw template). Added an analogy, plain-English restatement, or "why this matters" callout to every non-trivial technical/product claim, so the material can be recited from memory in an interview rather than re-read cold. No facts, numbers, or decisions were changed — verified as pure additions via diff review.

**Where to pick up next:** Project-scoped organization (Roadmap item 2 in `CLAUDE.md`) — unchanged from Session 10's next step; this session was a documentation pass, not new build work.

**What worked:**
- Splitting the 18 files across 4 parallel background agents by natural cluster (interview-prep write-ups; retrieval/chunking reference docs; logs and diagnosis; planning/taxonomy docs) let the elaboration happen concurrently instead of one file at a time
- Requiring each agent to self-QA every file twice against a 9/10 rubric (example-per-claim, interview-usable, still scannable, zero factual drift, tone match) caught a real problem before it shipped: one agent's first CLAUDE.md draft invented specific precision numbers to illustrate a concept, and its own QA pass flagged and replaced it with an accurate generic explanation
- Verifying `git diff --stat` showed only additions (a handful of minor deletions from light rewording) across all 18 files was a fast, objective way to confirm no facts were silently altered, on top of the agents' own self-reported QA scores

**What didn't work / got stuck on:**
- N/A — all 4 agents completed cleanly on the first dispatch; no rework needed beyond the one self-caught fabrication above

**Learnings:**
- **A documentation "richness" preference is itself worth codifying as a standing instruction, not a one-off request.** After seeing one example of the desired explanation style, the instruction ("always include an example/analogy, never just the technical description alone") was added to the global CLAUDE.md and memory system before doing the bulk elaboration — so future sessions default to this depth without being asked again.
  > **Analogy:** This is the difference between fixing one typo versus updating the style guide so the same typo doesn't recur. A single elaborated reply solves today's request; codifying the preference solves every future request of the same kind.
- **Requiring self-QA with a numeric bar (9/10, minimum 2 passes) produces a meaningfully different result than "please double check your work."** The one caught fabrication (invented precision numbers) only surfaced because the agent was forced to explicitly score itself against "is anything factually changed or invented" as a discrete rubric item, not left as a vague quality gate.
- **Parallel background agents work well when file sets are genuinely disjoint.** Splitting by file, with each agent owning a fixed list and no overlap, meant merging back into the main repo was a simple four-way copy with zero merge conflicts — the upfront planning cost (deciding the split) paid for itself at merge time.

**Open questions to come back to:**
- None blocking — ready to move to Project-scoped organization (Roadmap item 2)
---
### Session 10 — 2026-08-04 (continued from Session 9)

**Phase/step completed:** Built `embed.py` (chunking → OpenAI embeddings → Chroma upsert, deterministic IDs), committed it, then built `search_notes_semantic()` in `chat.py` with the same input/output shape as the existing keyword `search_notes()`. Re-ran the locked 28-query eval set through semantic search and compared against the 82% keyword baseline.

**Where to pick up next:** Phase 4 (semantic search) is functionally done and measured. Next per the roadmap: Project-scoped organization (Phase 2 in `CLAUDE.md`'s roadmap).

**What worked:**
- Semantic search scored **96% precision@5 (27/28)** vs. keyword's 82% (23/28) on the exact same locked test set — a clean, directly comparable before/after number
- The interface match (`search_notes_semantic()` returns the same `=== path ===` block format as `search_notes()`) meant no changes were needed to the eval scoring logic itself — only which search function it called
- Deterministic chunk IDs from `embed.py` meant no duplicate-chunk issues when testing

**What didn't work / got stuck on:**
- One failure: Q4b ("How should I organize things?") expected `design-of-everyday-things` but retrieved PM-practice/strategy content instead. Read as a genuinely ambiguous query rather than a retrieval bug — "organize things" has no strong semantic anchor to information architecture specifically.

**Learnings:**
- **A locked, reusable test set is what makes a before/after comparison credible.** Because the 28 queries and their expected answers were frozen before either retrieval method was built, the 82% → 96% jump is a real measured improvement, not a number that could have been shaped by hindsight.
  > **Analogy:** This is like agreeing on the exam questions *before* either student studies, so no one can accuse you of picking easier questions for the student you wanted to win. Locking the test set first means the 82% → 96% jump reflects semantic search actually being better — not the test quietly getting easier.
- **Semantic search's biggest wins were on "hard" queries requiring synonymy** (e.g. "stop users from making mistakes" → design-of-everyday-things' error-handling content, zero literal keyword overlap) — exactly the retrieval gap semantic search is supposed to close, and exactly the kind of concrete example worth having ready for an interview.
  > **Plain-English restatement:** The query never says "error handling" or "design," but semantic search still found the right note — because it's comparing *meaning*, not literal words. This is the single clearest before/after example in the whole project: keyword search would have returned nothing useful here, and semantic search nailed it.
- **A good evaluation should still produce failures.** 96% with one legitimately ambiguous miss is a more credible, interview-ready result than 100% would have been — it shows the eval set isn't rigged and that ambiguous queries are being called out as ambiguous, not silently "fixed."
  > **Analogy:** A student who gets 100% on every single test, every time, makes you suspicious the test is too easy or the grading is soft — not that the student is a genius. One honest, explainable miss (Q4b's genuinely ambiguous query) is more convincing evidence that the 96% score is real and was earned, not engineered.

**Open questions to come back to:**
- Should `system/chroma_db/` be `.gitignore`d? It's local, regenerable (via `embed.py`), and somewhat binary — likely yes, but not yet decided
- Wire `run_evaluation.py`/canary-set automation (carried over from Session 9)
---
### Session 9 — 2026-08-04 (continued from Session 8)

**Phase/step completed:** Built and verified `scripts/chunking.py` implementing the Session 8 decision. Caught a real bug while testing (line-counting mismatch: manual review counted raw file lines, code counted non-blank body lines — recalibrated threshold from 40 to 30 using actual measured values). Then discussed chunking robustness at scale: how commercial RAG systems handle content variety we haven't seen (token-based sizing, recursive/structural splitting with fallback, format-aware parsers per content type, canary-set evaluation). Built the paragraph-break fallback path for long, unstructured notes (no `##`, no bold-labels) — the one real gap our hand-tuned rule had. Verified against synthetic unstructured content and confirmed zero regressions on the real 26-note corpus.

**Where to pick up next:** Embedding generation + Chroma setup (the next Phase 4 step), now that chunking is solid and has a safety net for unknown content shapes.

**What worked:**
- Testing the chunking code against real notes immediately surfaced a bug the summary output alone would have hidden: the Communication note (which we'd manually confirmed *should* split into 7 sections) stayed as one chunk on the first run, because "40 lines" meant different things in the manual review (raw lines) vs. the code (non-blank body lines)
- Recalibrating the threshold using actual measured values (5/9/12 non-blank lines for keep-whole cases vs. 35 for the should-split case) instead of re-guessing a new number
- Testing the new paragraph-break fallback against synthetic content designed to hit the exact gap (long + unstructured), rather than only re-running against the real corpus where that case doesn't naturally occur

**What didn't work / got stuck on:**
- First synthetic test of the fallback produced a false negative — the fake note was accidentally too short (11, then 21 non-blank lines) to trigger the threshold at all; had to build a genuinely long synthetic note before the fallback path actually exercised

**Learnings:**
- **A rule tuned against known content is not automatically robust to unknown content.** Our chunking rule works well on the 26 notes it was built and tested against, but had zero handling for "long + no detectable structure" until we deliberately went looking for that gap. Production systems solve this with recursive fallback chains (try header split → try paragraph split → try sentence split → hard token cut) rather than trying to write one rule that anticipates every format upfront.
  > **Analogy:** It's like tailoring a suit to fit exactly the people who showed up for the first fitting, then assuming it will fit anyone who walks in the door. Our chunking rule was "tailored" to the 26 real notes it saw; a genuinely new note shape (long, no headers, no bold labels) needed its own fallback — the equivalent of a suit with an adjustable waistband for people who didn't come to the fitting.
- **Fixing data quality at the source is usually cheaper than compensating for it downstream — but only when you control the source.** Discussed two ways to handle content variety long-term: an ingestion-time agent that normalizes structure before saving (high leverage, but requires control over how content is created) vs. read-time chunker robustness (works regardless of source, but harder to get right). Chose read-time robustness first specifically because it's the closer analog to LeapSpace's actual constraint — the product can't control how a third-party PDF or a researcher's own external tool is structured.
  > **Plain-English restatement:** You can either ask everyone to submit clean, well-formatted paperwork upfront (fixing it at the source) or build a system that can make sense of messy paperwork however it arrives (fixing it downstream). The first is easier when you control who submits the paperwork; the second is necessary when you don't — which is exactly LeapSpace's situation with third-party PDFs and researchers' own tools.
- **A "canary set" is just our existing 28-query eval set, re-run automatically on every pipeline change.** Production systems catch silent retrieval regressions by re-scoring a held-out test set whenever ingestion/chunking changes and comparing to the last known-good score — the retrieval-quality equivalent of a unit test suite. We already have the pieces (`run_evaluation.py`, the locked test set) to build this; just haven't wired it to run automatically yet.
  > **Analogy:** Coal miners used to carry canaries into mines because the bird would show signs of distress from bad air before a human would notice. A "canary set" of test queries does the same job for a retrieval pipeline — it's the early-warning check that quietly re-runs after every change, so a silent quality drop gets caught immediately instead of being discovered by a frustrated user weeks later.
- **A synthetic test can fail silently if the test data itself doesn't actually exercise the code path being tested.** Two attempts at testing the fallback path produced "passing" results (1 chunk, no crash) before realizing the test note was simply too short to trigger the threshold — a reminder to check *why* a test produced a given result, not just whether it ran without error.
  > **Plain-English restatement:** The test "passed" both times — but only because it never actually reached the code it was supposed to be testing, the same way a fire drill "succeeds" if everyone stays seated because the alarm never actually rang. A passing test only means something if you've confirmed it genuinely exercised the risky path, not just that nothing crashed.

**Open questions to come back to:**
- Wire `run_evaluation.py` to run automatically whenever chunking or the notes corpus changes, and compare precision@5 against the last recorded score (canary-set pattern)
- Ingestion agent (structure-nudging at note-creation time) — deferred to a future roadmap item, tracked in `CLAUDE.md`, for once this project is in genuine ongoing personal use
- Should the fallback's paragraph cap (currently 15 non-blank lines) be tuned once the eval pipeline can score it?
---
### Session 8 — 2026-08-03/04 (continued from Session 7)

**Phase/step completed:** Decided the chunking strategy for Phase 4 (semantic search), and separately re-grounded the whole project against the full LeapSpace job ad text and product demo videos.

**Where to pick up next:** Build the chunking function per the rule below, then embedding generation + Chroma setup, then re-run the locked 28-query test set and compare precision@5 against the 82% keyword baseline.

**Chunking rule decided:**
1. Notes ≤ 40 lines: keep as one chunk (no split)
2. Notes with real `##` headers: split at `##` boundaries
3. Notes > 40 lines without `##` headers: split at bold-label lines (e.g. `**Re: Topic**`, `Latency:`)
4. No overlap between chunks — boundaries are real content divisions, not arbitrary cuts
5. The 40-line threshold is a reasonable starting default, not precision-tuned — real teams pick a sensible default fast and only grid-search/tune further once an eval pipeline exists to measure against; we're deferring threshold tuning until the semantic search pipeline is built and can be scored against the locked 28-query test set

**What worked:**
- Scanning all 25 notes for structure (line count, `##` count, bold-label count) before deciding, instead of guessing — this immediately falsified the original un-approved plan (only 1/25 notes actually has `##` headers)
- Stress-testing the "bold label = split point" heuristic against real borderline notes (17, 20, 25, 52 lines) caught that inline bold emphasis (e.g. numbered steps of one framework) reads very differently from bold labels marking genuinely independent ideas (e.g. 7 unrelated book quotes in one file) — a purely mechanical regex can't fully distinguish these, so the rule leans on note length + label count as a proxy
- Full job ad re-read (candidate provided complete text) surfaced a stronger, more specific reading than the earlier partial-ad guess: role partners on retrieval/upload rather than owning it, and explicitly asks the PM to "anticipate...richer integrations" as a future roadmap item, not a shipped one
- Watching the actual LeapSpace demo videos and summarizing them (saved to `system/leapspace-product-reference.md`) corrected an assumption: today's shipped product only supports session-scoped uploads (max 5 PDFs), not a persistent Notion/Obsidian-style personal knowledge base — that gap *is* the strategic problem this role exists to close

**What didn't work / got stuck on:**
- Initial grep-based "bold label" detector over-matched — flagged inline emphasis within a single coherent argument as if it were a section divider; caught by manually reading borderline notes before committing to the rule in code

**Learnings:**
- **Chunking thresholds are an empirical question, not a reasoning question, in real teams.** Product/ML teams don't debate their way to "the right" chunk size — they pick a few candidate values, run the same held-out eval set against each, and let the metric (here, precision@5) decide. The PM's role is often ensuring that discipline happens at all under time pressure, not personally finding the number.
  > **Analogy:** It's like taste-testing a recipe instead of arguing about it in theory. You don't debate in a meeting room whether "a pinch of salt" or "two pinches" is correct — you make both versions, have people taste them, and let the results decide. Chunk-size thresholds work the same way: try 30 lines vs. 40 lines vs. 50 lines, run the eval set against each, and let precision@5 pick the winner.
- **A documented "requirement" in a job ad can be about the candidate, not the product.** The Zotero/Obsidian/Notion line reads as a personal-fluency bar ("you understand this tool category"), not a confirmed integration target — separate from the "richer integrations" line elsewhere in Responsibilities, which *is* a real (if still vague) roadmap signal. Worth reading job ad lines for which section they're in, not just their content.
  > **Plain-English restatement:** A job ad line like "familiarity with Zotero/Obsidian/Notion" usually means "we want someone who already speaks this language," not "we are building an integration with these specific tools next quarter." Reading *where* a requirement sits (Qualifications vs. Responsibilities) tells you whether it's describing the candidate or promising a roadmap item — an easy distinction to blur if you only skim for keywords.
- **A chunk needs to be self-contained, not just short.** Length alone doesn't determine whether a section should be split — a 25-line note with 2 bold labels can be one indivisible argument (claim → limitation → caveat), while a 52-line note with 7 bold labels can be a compilation of unrelated ideas. The real test is "would this fragment make sense read in isolation," which length + label-count only approximates.
  > **Analogy:** Think of chopping a cake versus chopping a fruit salad. A cake (one connected argument — claim, limitation, caveat) doesn't stay meaningful if you slice it at arbitrary points; every slice needs the whole story to make sense. A fruit salad (a compilation of separate quotes or ideas) can be split apart cleanly because each piece was already independent. Length alone can't tell you which one you're holding — you have to check whether the pieces actually depend on each other.

**Open questions to come back to:**
- Build the actual chunking function against the rule above and spot-check its output against a handful of real notes before moving to embeddings
- After the pipeline exists: does the 40-line threshold need tuning based on eval results?
- Project-scoped organization (next roadmap phase after semantic search) — how should a "project" concept coexist with the existing topic taxonomy, and does it change chunk metadata/scoping?
---
### Session 7 — 2026-08-02 (continued from Session 6)

**Phase/step completed:** Started Phase 4 (semantic search) properly. Caught that the earlier `semantic-search-chunking-plan.md` "Decision" had been written up in a prior session without being genuinely reviewed and agreed — so we're treating all of Phase 4 as undiscussed and starting over, step by step. Decided: embedding model = OpenAI `text-embedding-3-small`; vector store = Chroma (confirmed free/local, no API key). Gave a from-scratch concept briefing (embeddings, who/how they're learned via model training, cosine similarity, why Chroma is free but embedding calls cost a little, semantic dilution) — saved to `system/interview-prep/04-semantic-search-concepts-briefing.md`.

**Where to pick up next:** Chunking strategy has *not* been decided yet — this is the next thing to discuss properly, together, before any code is written. Specifically: should we chunk by `##` header (as the old undiscussed doc assumed), and are the existing notes actually structured that way today, or would they need rework first? After chunking strategy is agreed, then: write the embedding generation script, set up Chroma, re-run the locked 28-query test set through semantic search, and compare precision@5 against the keyword baseline (82%).

**What worked:**
- Pausing to question whether "the chunking approach has been approved" was a good catch by the user — checked git history, confirmed the doc was written in a single session without clear evidence of genuine back-and-forth, and explicitly un-approved it rather than defending it
- Going concept-first (embeddings → cosine similarity → vector DB → chunking problem) before any design decision, given the user is new to RAG — checked understanding before moving on
- Answering "who decides the embedding of a word" concretely (model training, not manual rules) surfaced a genuinely useful clarification worth keeping

**What didn't work / got stuck on:**
- Nothing broken this session — this was planning/concept-building only, no code written yet

**Learnings:**
- **A documented "Decision" isn't necessarily an agreed decision.** A doc can look settled (clean "Decision:" heading, confident tone) while actually being one person's (the AI's) synthesis that was never genuinely pressure-tested with the user. Worth periodically asking "did we actually agree on this, or did I just write it down?" — especially for anything written in a single fast session.
  > **Plain-English restatement:** Just because meeting notes say "Decision: we're doing X" doesn't mean the room actually debated and agreed to X — sometimes one person just wrote it down confidently and no one pushed back. The formatting (a bold "Decision:" label) can create a false sense that something was settled, when really it was one party's summary that never got tested.
- **Embeddings vs. vector databases sit on different cost axes.** The vector database (Chroma) is free/local infrastructure; the embedding model (OpenAI API) is the part that costs money because it's a hosted model call. Conflating "vector search" as one single cost line is a common simplification worth avoiding.
  > **Analogy:** Think of Chroma as the filing cabinet (free — you already own it, it just sits in your office) and the embedding model as the librarian you pay by the hour to convert your documents into the filing system's format in the first place. "Semantic search costs money" is too blunt a statement — the storage is free, the conversion step is what you're paying for.

**Open questions to come back to:**
- Chunking strategy: by `##` header, fixed-size, or something else — and do current notes already fit that structure or need rework first?
- Once chunking is settled: overlap between chunks or clean breaks only?
- How to re-run the locked 28-query test set against semantic search for a fair before/after comparison (mechanically — same script, or a new one)?

---
### Session 6 — 2026-08-02 (continued from Session 5)

**Phase/step completed:** Phase 3.5 — evaluated keyword search baseline. Expanded test set to 28 queries (14 specific + 14 vague pairs). Ran evaluation, found and fixed 3 stacked bugs (eval scoring logic, test data errors, tokenization), corrected the baseline from a raw 18% to a trustworthy 82% precision@5. Wrote full diagnosis of the 5 remaining genuine failures. Test set is now locked ahead of Phase 4.

**Where to pick up next:** Phase 4 — implement semantic search (embeddings), re-run the same locked 28-query test set, compare precision@5 before/after.

**What worked:**
- Walking backwards through the eval process one step at a time (review test set → run → analyze → diagnose) instead of batch-producing results caught problems that would have been missed otherwise
- Treating a suspiciously bad number (18%) as a prompt to debug the measurement itself, not just the system — this uncovered 3 real bugs, not retrieval failures
- Grepping actual file content to verify expected_source values against ground truth, instead of trusting what was written when the test set was first drafted

**What didn't work / got stuck on:**
- Eval script's match check treated `"X or Y"` expected_source values as one literal substring — could never match any filename (affected 16/23 original failures)
- Several `expected_source` values referenced folder names (`stakeholder-management`, `product-strategy`) or files that didn't exist (`good-strategy-bad-strategy`) instead of real filenames
- `search_notes()` tokenizer didn't strip punctuation — `"goals?"` never matched `"goals"` in content, silently discarding the most meaningful word in several queries
- A few dead placeholder options (leftover folder names, `"any"`) remained in the test set after the first cleanup pass and needed a second audit to catch

**Learnings:**
- **A bad eval number is a prompt to debug the measurement, not just the system.** 18% looked like proof keyword search didn't work; the true, bug-free baseline was 82%. Trusting the first number would have produced the wrong conclusion.
  > See `system/evaluation/DIAGNOSIS.md` for the full worked example (broken answer key / vending machine analogies) — this learning is the compressed version of that whole debugging story.
- **Design choice vs. method limitation is worth distinguishing precisely.** Keyword search *can* use metadata (Google, Elasticsearch, email search all do) — this implementation just didn't, as a deliberate simplicity choice for a clean baseline.
  > **Plain-English restatement:** "Keyword search is limited" and "*this* keyword search is limited" are different claims. Real production keyword search engines boost results using metadata (recency, popularity, tags) — this project's version deliberately skipped that, to keep the baseline simple and easy to reason about. The gaps we found are gaps in *this implementation's choices*, not proof that keyword search as a category is inherently weak.
- **Test set correctness is itself a design decision.** `expected_source` values must reference real filenames (not folders, not imagined files), and fixing them only after seeing failures needs to be done transparently (grounded in file content, not adjusted to make numbers look better) and the set explicitly locked before the next comparison.
  > **Analogy:** Adjusting your answer key *after* seeing which students failed is fine only if you're correcting a genuine mistake (a typo in the key) — not if you're quietly changing answers to make the class look better. The fix here was audited against the real file contents each time, and then the test set was locked, so nobody could keep "improving" it after the fact.
- Full bug-by-bug detail lives in `system/interview-prep/03-three-bugs-that-hid-the-baseline.md`; compressed cross-project version in `../learnings.md`.

**Open questions to come back to:**
- Phase 4: does semantic search close the 5 remaining gaps (Q4, Q5, Q6, Q9, Q9b) — all synonymy/phrasing gaps in nature?
- Should MRR be added as a second metric alongside precision@5 before comparing keyword vs. semantic, since ranking position (not just top-5 presence) matters for some of the near-miss queries (e.g. Q10 found at rank 5)?
- Worth doing a personal teach-back (explaining the 3 bugs unprompted, without notes) before using this as an interview story — deferred until closer to actual interview prep.

---
### Session 5 — 2026-08-02 (continued from Session 4)

**Phase/step completed:** Consolidated Design of Everyday Things into single file; defined precise tagging rules; planned semantic search chunking strategy; fixed critical retrieval bug; tested system end-to-end.

**Where to pick up next:** Knowledge base is now live and functional with 24 consolidated notes. Ready for: (1) ongoing bulk imports using new agent instructions, (2) semantic search implementation (Phase 5), (3) evaluation/measurement against the LeapSpace job requirements.

**What worked:**
- Section-aware retrieval fix works — consolidated files now surface their actual content, not just YAML frontmatter
- Haiku model is fast and capable enough for this use case
- System synthesizes well across multiple notes (e.g., combining Mom Test + Product Sense insights)
- Testing revealed a critical bug (good timing before deployment)
- Job ad context (LeapSpace) directly maps to this project's RAG challenges

**What didn't work / got stuck on:**
- Initial 15-line preview truncation was breaking retrieval for large consolidated files — caught by testing, not by design review
- Model name in script was outdated (claude-opus-4-1-latest doesn't exist)

**Learnings:**
- **Testing catches what design doesn't.** Spent entire session optimizing file structure and taxonomy *without* running a single query. As soon as we tested, a critical bug surfaced (truncated previews). This is exactly the trap the project's own principle warns against: "evaluation must be measured and scored, not qualitative."
  > **Analogy:** You can polish a car's paint job and interior for hours and still not know if the engine starts. All the taxonomy and file-structure work looked great on inspection, but only actually running a query (turning the key) revealed the truncated-preview bug — a reminder that "looks well-organized" and "actually works" are different questions.
- **The chunking strategy works bidirectionally.** Section-aware retrieval for keyword search is exactly the prep work semantic search needs. We're not building two separate systems; the section discipline serves both.
  > **Plain-English restatement:** The work of splitting notes into clean, well-labeled sections wasn't wasted effort specific to keyword search — the same section boundaries are exactly what semantic search will later need to create good chunks for embeddings. One piece of foundational work quietly serves two future systems.
- **Tagging precision prevents drift.** Moving from vague definitions ("foundational = important stuff") to testable rules ("foundational = what a senior PM aspiring to principal should know and execute daily") makes multi-session consistency possible.
  > **Plain-English restatement:** A vague rule like "tag it foundational if it feels important" will get applied differently every session, because "feels important" depends on mood and memory. A testable rule ("would a senior PM aspiring to principal need to know and use this daily?") gives a yes/no test that produces the same answer whether it's session 3 or session 30.
- **Job context sharpens decisions.** LeapSpace's job requirements (RAG, chunking, researcher knowledge bases, evaluation of AI reasoning) directly validated which problems in this project matter most. The retrieval bug we just fixed is the exact class of problem LeapSpace solves.
  > **Why this matters for interviews:** Being able to say "here's a real bug I hit and fixed, and here's exactly how it maps to the job description's requirements" is far stronger than a generic "I'm interested in RAG" — it shows the practice work was deliberately chosen to mirror the target role, not just generic tinkering.

**Open questions to come back to:**
- When implementing semantic search (Phase 5), should we chunk exactly at `##` boundaries, or with overlap? (overlapping chunks provide continuity but increase embedding volume)
- What's the target retrieval quality for this system — precision (few false positives), recall (find all relevant content), or a balance? Needs measurement before/after semantic search.
- Should we add response logging to track which queries work well and which fail? (This data would be valuable for Phase 5 evaluation)

---
### Session 4 — 2026-08-02

**Phase/step completed:** Phase 4 — Bulk knowledge base population. Added 34 notes from key PM/design books and frameworks. Knowledge base now at 37 total notes.

**Where to pick up next:** Test the chat system with expanded knowledge base, then upgrade to semantic search with Chroma + embeddings for better retrieval (the planned next phase).

**What worked:**
- Batching notes (10–13 at a time) is vastly more efficient than one-by-one
- Lazy annotation strategy confirmed: don't force "Why this matters" upfront; let it fill in through use
- Clear taxonomy structure makes it easy to organize diverse content
- Sourcing is flexible — can handle exact sources or "unknown" and update later
- Claude can quickly organize unstructured quotes into structured notes with frontmatter

**What didn't work / got stuck on:**
- None — straightforward session

**Learnings:**
- Batch operations compound time savings dramatically. 34 notes in one session vs. 34 sessions.
  > **Analogy:** Doing laundry once a week in one big load beats doing one item of clothing every single day — not because each wash is faster, but because you avoid paying the "setup cost" (finding the detergent, starting the machine) 34 separate times. Batching 10-13 notes at once meant paying the "get into note-writing mode" cost only a few times instead of 34.
- Note quality doesn't suffer from speed; frontmatter discipline (YAML structure) enforces consistency automatically
  > **Plain-English restatement:** Because every note has to fill in the same YAML fields (title, source, tags, etc.) no matter how fast you're writing, the structure itself acts like a form with required fields — it's hard to accidentally skip a piece of information even when moving quickly.
- Source tracking can be lazy too — users naturally remember or find sources later when notes matter
  > **Plain-English restatement:** Not every field needs to be filled in perfectly the moment a note is created. If a source is marked "unknown" now, it's easy enough to fill in later once you rediscover it — deferring low-stakes details is fine as long as the important content is captured while it's fresh.
- The keyword search system is ready to test; no need to wait for semantic search to validate the concept

**Open questions to come back to:**
- When you test the chat, which queries surface the most relevant notes? Which miss?
- Should we implement topic-folder filtering in the chat interface?
- What's the exact failure mode of keyword search vs. semantic search? (Will inform whether the upgrade is needed)
- Shall we refactor the chat.py to add response logging?

---
### Session 3 — 2026-07-31

**Phase/step completed:** Phase 1 complete (all setup steps). Phase 2 complete (system prompt written). Phase 3 complete (chat.py built and tested).

**Where to pick up next:** The system is live and working. Next steps: (1) add more notes to the knowledge base, (2) improve retrieval with semantic search if needed, (3) refine system prompt based on actual usage patterns.

**What worked:**
- Python dependencies installed without issues
- API key stored safely in .env
- System prompt customised with actual taxonomy — all 10 topics documented with clear skills/modes
- Chat script built with keyword search retrieval and Anthropic API integration
- First test query worked perfectly — found The Mom Test and Lean Startup notes, connected them thematically, surfaced a follow-up question
- Script handles multi-turn conversation history correctly

**What didn't work / got stuck on:**
- Initial model name was outdated (claude-3-5-sonnet-20241022 doesn't exist in current API). Fixed by using claude-opus-4-1-latest.
- Piped input mode exits with EOFError after first response (expected, not a real issue — script is designed for interactive terminal use).

**Learnings:**
- The keyword search is surprisingly effective for small knowledge bases. Top 5 matches by word frequency are relevant.
  > **Plain-English restatement:** With only a handful of notes, even a simple "count matching words" approach tends to work, because there isn't much competing content to accidentally outrank the right answer. This effectiveness is somewhat deceptive — the gaps show up later as the knowledge base grows (see the 82% baseline diagnosis in Session 6), but early on, simple methods can look deceptively strong.
- Claude generates good "thinking partner" responses when you give it the full note context plus the system prompt with skills defined.
- The "Why this matters" field really does matter for context quality — helps the model understand which items were saved intentionally.
  > **Plain-English restatement:** A note that's just a raw quote is ambiguous — was it saved because it's useful, or just interesting? The "Why this matters" field tells the model (and future-you) *why* a piece of content was worth keeping, which shapes how it should be used in an answer.
- API deprecation warnings appear but don't block execution.

**Open questions for next session:**
- Want to add semantic search for better retrieval? (Currently keyword-only.)
- Should we add a way to search by specific topic folder?
- Should responses be saved to a log file for reference?
- Ready to start bulk-importing more notes, or add features first?

---
### Session 2 — 2026-06-21

**Phase/step completed:** Phase 0 complete. Phase 1 Steps 1.1–1.3 complete. First real notes added.

**Where to pick up next:** Phase 1, Step 1.4 — set up Python. Open terminal in VS Code inside the `knowledge-retriever` folder and run `pip install anthropic python-dotenv`, then create `requirements.txt`.

**What worked:**
- Taxonomy finalised: 10 topic folders, 4 cross-cutting tags
- All 10 `notes/` subfolders created
- Note format settled: YAML frontmatter + blockquote for "Why this matters"
- `template.md` created in `notes/` — duplicate and delete options to create new notes
- Added `url` as a separate field for article sources (keeps `source` clean for display)
- Three real notes added: `the-mom-test.md`, `lean-start-up.md`, `pm-playbook-shipping-ai-features.md`
- `notes/` and `system/` moved into `knowledge-retriever/`, `plan.md` moved in too — project is now self-contained

**What didn't work / got stuck on:**
- Two notes (Mom Test, PM Playbook) were lost because VS Code hadn't saved them to disk before we renamed/moved them. Had to restore from conversation history.
- Fix: always press **Cmd+S** immediately after creating a new file, before doing anything else

**Learnings:**
- The `type` field is a single value — cannot be a list. Keep one file per source.
  > **Plain-English restatement:** A note can be "an article" or "a quote," but not both at once in the `type` field — if one piece of content is genuinely two things, it needs to become two separate note files rather than one file trying to wear two labels.
- Tags format: all inside one bracket `[tag1, tag2]` — not separate brackets per tag (a small YAML syntax convention, not a design decision — noted here mainly so future notes stay consistent)
- `quote` cannot be both a content type and a cross-cutting tag — they clash. Removed it from tags.
  > **Plain-English restatement:** Having "quote" available both as a `type` value and as a `tag` value created ambiguity — should a quote be filed by its `type` or found by its `tag`? Removing it from one list (tags) forces every quote to be found the same way, avoiding notes that are inconsistently labeled depending on which field someone happened to use.
- Lazy annotation strategy: don't force "Why this matters" on bulk imports — let it fill in through use. Only required on `own-note` and `quote` types.
  > **Plain-English restatement:** When importing many notes at once, stopping to write a thoughtful "why this matters" for every single one would slow bulk imports to a crawl. The rule instead: leave it blank on bulk-imported content and only require it for your own original notes/quotes, where the reflection is the whole point of saving it.
- For articles, split source and URL into separate fields so the display label stays clean
  > **Plain-English restatement:** If the source field had to hold both a name and a link (e.g. "Article Title (https://...)"), every display of that note would show a long, cluttered string. Splitting them means the label shown to a reader can stay short and clean ("Article Title"), while the URL is still stored and available when needed.

**Open questions for next session:**
- None blocking — ready to move to Phase 1.4 (Python setup)
---

---
### Session 1 — 2026-06-16

**Phase/step completed:** Full planning session — read NN/g Context Architecture article, designed and iterated the project plan, set up the system folder and session log, confirmed all content sources are covered.

**Where to pick up next:** Phase 0, Step 0.1 — design your taxonomy on paper (no VS Code needed). Decide your top-level topic folders before touching anything. Then Phase 0.2: confirm which content types you'll use.

**What worked:**
- Understood the core concept: context architecture = IA principles (structure, labelling, findability, memory) applied to AI systems
- Settled on a clean project approach: markdown files in folders as the knowledge base, keyword search first, semantic search later
- Confirmed all three content sources are covered: Kindle, Apple Notes, Instapaper

**What didn't work / got stuck on:**
- N/A — planning session only, no code

**Learnings (context architecture):**
- Context architecture is design work, not engineering work — naming, structure, and relationships are decided before any code is written
  > **Analogy:** This is like an architect designing a building's floor plan before a single brick is laid — deciding where rooms go, how they connect, and what each is called happens on paper first. Context architecture is that floor-plan work for an AI system: deciding your topic folders and naming conventions before any Python code exists.
- The labelling problem is concrete: `credential-recovery-workflow` vs `reset-password` — system language must match user language or retrieval fails
  > **Plain-English restatement:** If your system stores something under the formal name "credential-recovery-workflow" but a real user searches "reset password," a literal-match system won't connect the two — even though they mean the same thing to a human. This is the same underlying problem as the "organize" vs. "organising" gap found later in Session 6's evaluation: the label you choose has to match how people actually ask for the thing, not just how you'd formally describe it.
- More context ≠ better results; models suffer from information overload just like people — structure and prioritisation matter as much as content
  > **Analogy:** Handing someone a 500-page manual to answer a simple question is worse than handing them the one relevant paragraph — even though the manual technically "contains" the answer somewhere. Dumping everything into a model's context window can bury the relevant part in noise, the same way a human reader gets lost in too much material.
- The distinction between context engineering (pipelines, plumbing) and context architecture (structure, meaning, behaviour) — engineers build the infrastructure, architects define what lives on top of it
  > **Analogy:** Plumbers install the pipes that carry water through a building (the infrastructure); architects decide which rooms need a sink and where the bathroom goes (the structure and meaning). Context engineering is the pipes — the code that moves information around; context architecture is deciding what information matters and how it's organized in the first place.
- Context is never neutral: every naming and structural decision shapes how the system interprets tasks and produces outputs
  > **Plain-English restatement:** Calling a folder "AI Products" versus "Machine Learning" isn't a cosmetic choice — it changes what kinds of notes naturally get filed there and what queries will successfully find them. Every organizational decision quietly steers the system's behavior, even when it feels like "just naming."
- Memory needs explicit rules: what to retain, how long, when to surface — without this, systems either forget critical things or surface irrelevant noise
  > **Analogy:** A filing cabinet with no rules about what to keep, for how long, or when to pull a folder back out eventually becomes useless — either overflowing with irrelevant paper, or missing the one document you actually needed. A knowledge system needs the same explicit rules, or it drifts toward one of those two failure modes.

**Open questions for next session:**
- What should my taxonomy look like? Start broad (8–10 folders) and resist the urge to go narrow
- Which of my existing notes are worth adding as the first 10 seed items?
- What's my honest "Why this matters" discipline going to be — will I actually write it for every item?
---
