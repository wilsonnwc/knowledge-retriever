# Spec: <name>

**Status:** DRAFT · **Size:** Full | Light · **Owner (what/why):** PM (the user) · **Builder (how):** Claude
**Created:** YYYY-MM-DD · **Locked:** — · **Shipped:** —
**Repos/areas touched:**

> Sections marked ★ are required for a Light spec. A Full spec fills in all of them.
> Stages: 1 Specify → 2 Lock → 3 Plan → 4 Tasks → 5 Build → 6 Verify → 8 Retro (7, Change control, can happen at any point).

---

## 1. Problem ★
<!-- Whose problem is it, and what goes wrong today? Use evidence (numbers, a QA finding, a real example), not opinion. -->

## 2. Outcome and how we'll know ★
<!-- What changes for the user when this ships. Name the metric or signal, and where it is measured. -->

## 3. Scope ★
**In:**
-

**Out (non-goals):**
<!-- Things someone, or an agent, might reasonably assume are included but aren't. -->
-

## 4. Acceptance criteria ★
<!-- Each AC must be testable. "Verified by" names the evidence before the build starts. -->

| ID | Criterion | Verified by | Result | Evidence |
|---|---|---|---|---|
| AC1 | | | — | |
| AC2 | | | — | |

## 5. Edge cases and failure states
<!-- Empty input, missing data, an API failure, a slow network, the 390px mobile width, a repeat run. What happens in each? -->
-

## 6. Decisions (locked)
<!-- D1, D2… Each decision gets its reason in one line. Settled decisions aren't reopened without a Change log entry. -->
-

## 7. Open questions
<!-- Q1, Q2… Log what the spec doesn't answer. Each has an owner and a status. A blocking question stops the build. -->
-

---

## 8. Plan (Claude, reviewed by the user)
<!-- The technical approach in plain English, the trade-offs, and the alternatives considered. -->

### Agents and automation for this build
<!-- See ~/.claude/global-rules/agent-pipeline.md. For each stage this build touches:
     what checks it automatically, what kind of check (deterministic check, hook, subagent, CI bot, LLM-as-judge),
     whether that exists already or is proposed, and where the human gate is. A new agent is proposed here but built as its own spec. -->
| Stage | Automated help | Kind | Exists / proposed | Human gate |
|---|---|---|---|---|
| | | | | |

## 9. Tasks
<!-- Small and checkable. Each lists the ACs it serves. Mark pause points with ⏸. -->
- [ ] T1 — … (AC1)
- [ ] ⏸ …

---

## 10. Change log
<!-- Spec changes after the lock: date, what changed, why, which ACs are affected, and the user's OK. -->
| Date | Change | Why | ACs affected | OK'd |
|---|---|---|---|---|

## 11. Spec vs reality (retro) ★
<!-- Fill in after Verify. This is the interview evidence. -->
- **What the spec got right:**
- **What it missed (found during build or QA):**
- **What changed and why:**
- **What I'd specify differently next time:**
