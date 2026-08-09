# Research-Goal UX Testing Checklist

A structured feedback template for manual testing of `research_goal()` feature. Fill this out as you test with each goal.

---

## Instructions

- **Structural checks (✓/✗):** Mark YES/NO for objective, verifiable criteria
- **UX Quality (1–5):** Rate subjective experience (1 = broken/confusing, 5 = natural/delightful)
- **Notes:** Capture surprises, confusions, delights, or anything worth remembering

---

## Test Sessions

### Session: Test 1 | Date: 2026-08-09 | Goal: "Improve communication with all stakeholders — including senior leadership, my team, and other cross functional teams."

#### **ESTABLISH PHASE: Upfront Expectations**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **01** Expectation prompt | Does the initial prompt clearly state: (1) what it does (searches *your notes*, not web), (2) what you should do (type a goal), (3) what output will be? | YES/NO | NO | — | **MISSING** — went straight to goal-scoping without upfront explanation |
| **02** Process flow explanation | After you enter a goal, does it explain: rounds of searching, what happens each round, estimated time? | YES/NO | NO | 3 | Showed goal-scoping suggestion but didn't explain "what is scoping," rounds, or estimated time |
| **03** Prompt clarity & tone | Does the upfront text feel natural/conversational, or does it read like a technical spec? | — | YES | 4 | Claude's suggestion was conversational and helpful |

#### **EVOLVE PHASE: Real-Time Progress**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **04** Every-step streaming | After each round completes, does the result appear on screen (not lost), and does the new round start on a fresh line? | YES/NO | YES | 4 | Round 1 and 2 both appeared clearly, streamed in <2s |
| **05** Step timing | From when a round starts, how many seconds until first output? (target: <5s, or note if longer) | MEASURE | NO | 1 | Round 1: ~2s, Round 2: ~1s. Times not displayed to user. Need explicit timing shown. |
| **06** Progress update clarity | When Round N completes, can you immediately tell: (1) how many gaps were found, (2) if more rounds will happen, (3) what happens next? | YES/NO | YES (partial) | 2 | Shows gap counts (8/15) and if more rounds will happen, but doesn't explain *why* stopping or *what happens next* |
| **07** Fallback notification | If a fallback triggers (e.g., Round 2 finds 0 gaps and stops early), does the system tell you immediately in plain language? | YES/NO | YES (subtle) | 2 | Message: "No new items covered this round — stopping early" appeared, but not explicit enough. Doesn't explain *why* stopping or that this is expected behavior. |

#### **RECOVER PHASE: Error Handling & Recovery**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **08** Error message clarity | If an error occurs, is it explained in your terms (not "NoneType error"), and do you understand what went wrong? | YES/NO | N/A | — | **NO ERROR OCCURRED** — happy path only. Defer error case testing. |
| **09** Recovery suggestions | After an error, does the system suggest next steps (retry, modify goal, report)? | YES/NO | N/A | — | **NO ERROR OCCURRED** — happy path only. |
| **10** Stop functionality | Can you interrupt/stop mid-process? Does it exit cleanly? | YES/NO | NOT TESTED | — | **NOT TESTED** — deferred for error-case phase. |

#### **COMPLETION PHASE: Summary & Follow-Up**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **11** Summary accuracy | Does the final summary accurately show: (1) what was covered, (2) what's open, (3) which sources were cited? | YES/NO | YES | 4 | Showed all covered items, sources cited, gaps listed. Accurate. |
| **12** Summary clarity | Is the summary easy to scan and understand at a glance? | — | — | 2 | Output dense. Items formatted as "Root cause: xxx" without explanation of what that means or why these items grouped this way. Hard to scan quickly. |
| **13** Follow-up prompts | After the research completes, are you offered the follow-up sequence: New goal → Modify goal → Online search? | YES/NO | NO | 1 | **MISSING** — no follow-up prompts offered. Process ended after summary. |
| **14** Follow-up UX | Do the follow-up options feel natural, or forced? | — | — | — | **NOT APPLICABLE** — follow-ups not implemented. |

#### **Overall Observations**

- **Most natural moment(s):** Round 1/2 progress streaming. Goal-scoping suggestion. Coverage counts.
- **Most confusing moment(s):** No explanation of "what comes next" between scoping and research. Fallback message not explicit. Summary format dense.
- **Would change:** Add upfront explanation prompt. Add "what happens after goal input" explanation. Show query terms used per round. Make fallback notification explicit. Add follow-up prompts.
- **Would keep:** Streaming updates. Gap counts. Accuracy of results.

---

### Session: Retest 1 | Date: 2026-08-09 | Goal: "Improve communication with all stakeholders — including senior leadership, my team, and other cross functional teams."

#### **ESTABLISH PHASE: Upfront Expectations**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **01** Expectation prompt | Does the initial prompt clearly state: (1) what it does (searches *your notes*, not web), (2) what you should do (type a goal), (3) what output will be? | YES/NO | YES | 5 | Much clearer now. **Design note:** When goal passed via CLI arg (e.g., `--research-goal "question"`), upfront explanation is skipped. Suggest: run `--research-goal` with NO arg, show upfront prompt, ask user to type goal, *then* start analysis. |
| **02** Process flow explanation | After you enter a goal, does it explain: rounds of searching, what happens each round, estimated time? | YES/NO | YES | 4 | Now explains rounds + why multiple rounds. Includes why we do this (narrowing + avoiding false negatives). Good. |
| **03** Prompt clarity & tone | Does the upfront text feel natural/conversational, or does it read like a technical spec? | — | YES | 4 | Natural. Keep as-is. |

#### **EVOLVE PHASE: Real-Time Progress**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **04** Every-step streaming | After each round completes, does the result appear on screen (not lost), and does the new round start on a fresh line? | YES/NO | YES | 4 | Works well. Keep as-is. |
| **05** Step timing | From when a round starts, how many seconds until first output? (target: <5s, or note if longer) | MEASURE | YES | 3 | Shows completion time per round (e.g., "[completed in 2.3s]") and total estimated time upfront. Good. *Minor:* Didn't show estimated time *per* round (only total + actual). Acceptable as-is. |
| **06** Progress update clarity | When Round N completes, can you immediately tell: (1) how many gaps were found, (2) if more rounds will happen, (3) what happens next? | YES/NO | YES | 5 | Excellent. Now shows: gap counts, whether stopping early, AND explanation of why. Crystal clear. |
| **07** Fallback notification | If a fallback triggers (e.g., Round 2 finds 0 gaps and stops early), does the system tell you immediately in plain language? | YES/NO | YES | 4 | Much better. Shows ⚠️, explains why stopping (diminishing returns), what it means (gaps need external sources). Can't fully judge without triggering fallback in this test (happy path only). |

#### **RECOVER PHASE: Error Handling & Recovery**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **08** Error message clarity | If an error occurs, is it explained in your terms (not "NoneType error"), and do you understand what went wrong? | YES/NO | N/A | — | **NO ERROR OCCURRED** — happy path only. Defer error case testing. |
| **09** Recovery suggestions | After an error, does the system suggest next steps (retry, modify goal, report)? | YES/NO | N/A | — | **NO ERROR OCCURRED** — happy path only. |
| **10** Stop functionality | Can you interrupt/stop mid-process? Does it exit cleanly? | YES/NO | NOT TESTED | — | **NOT TESTED** — deferred for error-case phase. |

#### **COMPLETION PHASE: Summary & Follow-Up**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **11** Summary accuracy | Does the final summary accurately show: (1) what was covered, (2) what's open, (3) which sources were cited? | YES/NO | YES | 4 | Good accuracy. Sources cited, covered/open items clear. |
| **12** Summary clarity | Is the summary easy to scan and understand at a glance? | — | — | 3 | Items formatted as "Root cause: xxx" or "Pattern: xxx" which reads odd. Why categorize results this way? Consider: simpler list format, or explain what these categories mean. Deferred for now. |
| **13** Follow-up prompts | After the research completes, are you offered the follow-up sequence: New goal → Modify goal → Online search? | YES/NO | YES | 4 | Now offers all three options. **Issue:** "Search online" option ran but didn't produce useful output (likely just printed top 5 gaps). **Suggestion:** Either (a) defer implementation, (b) improve online search to actually search + return results, or (c) make it a simpler "here are your top gaps, search these yourself" prompt. User prefers not to overbuild. |
| **14** Follow-up UX | Do the follow-up options feel natural, or forced? | — | YES | 4 | Feels natural. Keep as-is. |

#### **Overall Observations**

- **Most natural moment(s):** Streaming updates, progress clarity, fallback explanation, follow-up prompts.
- **Most confusing moment(s):** None major. Summary format slightly odd but acceptable.
- **Would change:** (1) CLI arg flow: show upfront prompt *before* asking for goal input, (2) Summary format: simplify or explain "Root cause" / "Pattern" categories.
- **Would keep:** Everything else — streaming, timing, fallback notification, follow-ups all working well.

**Key insight:** When goal is passed via `--research-goal "..."` CLI arg, the flow skips the upfront explanation. For first-time users, recommend running without the arg to let them read the introduction first.

---

### Session: _________________ | Date: _________________ | Goal: _________________

*(Copy template above for additional test sessions)*

---

## Quick Reference: Scoring Guide

**Structural Checks (✓/✗)**
- YES: Feature works as intended, requirement met
- NO: Feature missing or broken, requirement not met

**UX Quality (1–5)**
- 1: Broken/confusing. User has to work to understand it.
- 2: Poor. User understands it, but it feels rough or unnatural.
- 3: Acceptable. Works. Not delightful, but not jarring.
- 4: Good. Feels natural and thoughtful.
- 5: Delightful. Feels exactly right. Zero friction.

---

## Notes for Future Sessions

- Add test cases here if a specific error/scenario should always be tested going forward
- Track patterns across multiple test runs (e.g., "timing is always 8–10s, not <5s target")
