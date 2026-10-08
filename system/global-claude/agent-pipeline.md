# Agents across the build and release pipeline

A reference for Stage 3 (Plan) of a spec-driven build: which automated helpers a production team runs at each stage, how to build each one with Claude Code, and which are worth it for a solo project.

> **Mental model:** a production pipeline is a series of **gates**. At each gate, something checks the work against the spec before it moves on. Agents make the gates cheap enough to run on every change. Humans keep the gates that need judgement or accountability.

---

## 1. The stage-by-stage map

| Stage | What production teams automate | Kind | Human gate |
|---|---|---|---|
| **Specify** | **Spec reviewer:** flags untestable ACs, vague terms, missing non-goals and edge cases; checks for conflicts with existing specs | Subagent (LLM) | PM locks the spec |
| **Plan** | **Plan reviewer / architect:** checks the plan covers every AC, flags risky migrations, suggests simpler options | Subagent | PM checks the plan against intent; the engineering lead checks feasibility |
| **Tasks** | **Task splitter:** turns the plan into small tasks linked to ACs, and orders them by dependency | Subagent or skill | None (low risk) |
| **Build** | **Implementer agents** (often several in parallel on separate tasks), **test writer** (tests written from ACs *before* the code), **formatter/linter** on every edit | Subagents; hooks for lint/format | Pause points in the spec |
| **Review** | **Code reviewer** (correctness), **security reviewer** (secrets, injection, auth), **simplifier** (reuse, dead code), **dependency checker** | CI bot / subagent; SAST tools are deterministic | Human approves the PR |
| **Verify** | **Test runner** (CI), **eval runner** (precision@k, LLM-as-judge scores against a threshold), **invariant checks** (e.g. "no repeats", "digest landed"), **UI QA agent** (drives a browser at mobile width, screenshots) | CI (deterministic) and LLM judge | A failing AC goes to the PM, never gets reworded |
| **Release** | **Release notes writer**, **migration checker**, **deploy agent** (preview deploy, smoke test, promote), **feature-flag switch** | CI/CD and a subagent for notes | A human promotes to production and approves migrations on live data |
| **Operate** | **Monitor / alerter** (errors, failed runs), **PR steward** (keeps open PRs green), **eval drift watcher** (re-runs evals on a schedule), **feedback triager** (turns user corrections into eval cases) | Scheduled routine / CI | A human decides on rollbacks and what to prioritise |
| **Learn** | **Retro / doc agent:** updates the changelog, the session log and the spec's "Spec vs reality" | Hook or a step in the workflow | The PM reviews the retro |

---

## 2. How each one maps onto Claude Code

| Mechanism | Best for | Where it lives |
|---|---|---|
| **Deterministic check** (test, lint, schema, invariant script) | Anything with a right answer. Always the first choice. | The repo plus CI |
| **Hook** (`PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`) | Rules that must *always* run with no judgement: format after every edit, block a commit without a spec ID, run the fast tests at Stop | `.claude/settings.json` (the project's) or `~/.claude/settings.json` (global) |
| **Subagent** (`.claude/agents/<name>.md`) | A focused role with its own instructions, tools and context: spec reviewer, security reviewer, QA driver | A project's `.claude/agents/` or a global `~/.claude/agents/` |
| **Skill / slash command** | A repeatable procedure you trigger: `/spec-review`, `/release-notes`, `/retro` | `.claude/skills/` |
| **CI bot** (GitHub Actions, the Claude Code GitHub Action, code-review bots) | Gates on every PR or push, independent of any one session | `.github/workflows/` |
| **Scheduled routine** | Operate-stage watching: nightly eval re-run, checking the morning's run, check-ins on open PRs | Claude Code routines, cron, a scheduled GitHub Actions workflow |
| **LLM-as-judge** inside the product | Classifying with judgement (e.g. a junk filter) | Product code, with its own labelled eval set |

---

## 3. The rules that make agents trustworthy

1. **An agent is a product, so it gets a spec.** Write down what it must catch, what it must never do, and an eval: a labelled set of examples, a catch rate and a false-positive rate. An agent that cries wolf gets ignored, which is worse than having none.
2. **Deterministic first.** If a test, lint rule or invariant can catch it, use that. Use an LLM only for judgement calls.
3. **One agent per real pain.** Add one when a class of bug escaped twice, or when you keep doing the same check by hand. Not because production teams have one.
4. **Narrow scope, narrow tools.** A reviewer reads; it doesn't edit. A QA agent drives the browser; it doesn't push. Least privilege is how a role stays trustworthy.
5. **Humans keep the accountable gates:** locking a spec, merging or releasing, migrating live data, and anything sent to other people.
6. **Measure the pipeline itself.** Track what each gate caught, what slipped past every gate (and which gate should have caught it), and how much time it costs. Review this at retro.

---

## 4. A starter set for a solo project, in order

Each one is its own small spec'd build, added only when the pain shows up:

1. **Fast checks as a `Stop` hook:** lint plus unit tests run before Claude says "done". Deterministic, cheap, and catches the most.
2. **Spec reviewer subagent:** run at Stage 1 before the lock. It reads the draft spec and returns untestable ACs, vague terms, missing non-goals and missing edge cases. This directly trains the PM skill.
3. **Eval gate in CI:** the project's eval script runs on every push and fails below the locked threshold. (knowledge-retriever already has the scripts; the gate is the missing piece.)
4. **Code and security review on PRs:** `/code-review` and `/security-review` locally, or a review bot in CI.
5. **UI QA agent:** drives the app at 390px and desktop width, takes screenshots, checks the UI ACs.
6. **Release and operate:** post-deploy smoke test, a morning run check as a routine, and user corrections fed back into evals as cases.

---

## 5. Where my projects already do this (use these as interview examples)

- **Invariant gates:** ai-chief-of-staff's **Check invariants** step (no repeats, digest landed) runs on every nightly run.
- **LLM-as-judge with an eval loop:** the junk filter, with a hand-labelled set (150 links), a launch bar of 0 real articles dropped and ≥ 90% of junk caught, and "Not junk" corrections becoming regression cases.
- **Eval scripts:** knowledge-retriever's `run_evaluation.py` and `run_evaluation_semantic.py` measure precision@5, plus a staleness tripwire on the expected sources.
- **Autonomous loop with human pause points:** Phase 2a. The loop ran unattended between ⏸ gates.
- **Feature flag as a release gate:** `NEON_STORE`, proven inert when off before it was switched on.
- **Freshness tripwire:** `check_index_freshness()` warns when the search index has drifted from the notes on disk.

These are already pipeline gates. The next step is to name them as such in each spec's "Agents and automation" table, and to add new ones only where a retro shows a gap.
