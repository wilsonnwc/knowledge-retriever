# Research-Goal UX Testing Checklist

A structured feedback template for manual testing of `research_goal()` feature. Fill this out as you test with each goal.

---

## Instructions

- **Structural checks (✓/✗):** Mark YES/NO for objective, verifiable criteria
- **UX Quality (1–5):** Rate subjective experience (1 = broken/confusing, 5 = natural/delightful)
- **Notes:** Capture surprises, confusions, delights, or anything worth remembering

---

## Test Sessions

### Session: 1  | Date: 9 Aug 2026 | Goal: Improve communication with all stakeholders — including senior leadership, my team, and other cross functional teams.

#### **ESTABLISH PHASE: Upfront Expectations**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **01** Expectation prompt | Does the initial prompt clearly state: (1) what it does (searches *your notes*, not web), (2) what you should do (type a goal), (3) what output will be? | YES | No | 1 | Not showing these.  Besides, the first response "That goal is broad enough that the gap list would look similar with or without your notes.
Suggested narrower framing: "Identify communication breakdowns or misunderstandings documented in recent notes with senior leadership, my team, or cross-functional partners, and determine what patterns or root causes emerge."
Use this (y), keep current and stop narrowing (n), or type your own to keep refining: " only came after 3 seconds. |
| **02** Process flow explanation | After you enter a goal, does it explain: rounds of searching, what happens each round, estimated time? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |
| **03** Prompt clarity & tone | Does the upfront text feel natural/conversational, or does it read like a technical spec? | — | — | ☐ ☐ ☐ ☐ ☐ | |

#### **EVOLVE PHASE: Real-Time Progress**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **04** Every-step streaming | After each round completes, does the result appear on screen (not lost), and does the new round start on a fresh line? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |
| **05** Step timing | From when a round starts, how many seconds until first output? (target: <5s, or note if longer) | MEASURE | ___s | — | |
| **06** Progress update clarity | When Round N completes, can you immediately tell: (1) how many gaps were found, (2) if more rounds will happen, (3) what happens next? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |
| **07** Fallback notification | If a fallback triggers (e.g., Round 2 finds 0 gaps and stops early), does the system tell you immediately in plain language? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |

#### **RECOVER PHASE: Error Handling & Recovery**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **08** Error message clarity | If an error occurs, is it explained in your terms (not "NoneType error"), and do you understand what went wrong? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |
| **09** Recovery suggestions | After an error, does the system suggest next steps (retry, modify goal, report)? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |
| **10** Stop functionality | Can you interrupt/stop mid-process? Does it exit cleanly? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |

#### **COMPLETION PHASE: Summary & Follow-Up**

| Item | Test | Structural? | ✓/✗ | UX Quality (1–5) | Notes |
|------|------|-------------|-----|------------------|-------|
| **11** Summary accuracy | Does the final summary accurately show: (1) what was covered, (2) what's open, (3) which sources were cited? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |
| **12** Summary clarity | Is the summary easy to scan and understand at a glance? | — | — | ☐ ☐ ☐ ☐ ☐ | |
| **13** Follow-up prompts | After the research completes, are you offered the follow-up sequence: New goal → Modify goal → Online search? | YES/NO | ☐ | ☐ ☐ ☐ ☐ ☐ | |
| **14** Follow-up UX | Do the follow-up options feel natural, or forced? | — | — | ☐ ☐ ☐ ☐ ☐ | |

#### **Overall Observations**

- Most natural moment(s):
- Most confusing moment(s):
- Would change:
- Would keep:

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
