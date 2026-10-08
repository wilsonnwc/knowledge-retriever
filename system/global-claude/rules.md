# Global rules (all projects)

> The source of truth is `knowledge-retriever/system/global-claude/`. It is loaded into every project via `~/.claude/CLAUDE.md` → `@~/.claude/global-rules/rules.md` (set up by `install.sh`). Edit it there, not in a copy.

## 1. Spec-driven development: every build, every project

I'm practising spec-driven development and want evidence of it. **Guide me through it on every build.** I'm the PM and I own the *what* and *why*. Claude facilitates the spec, owns the *how*, and builds.

**Step 0: size the build, in one line, before anything else.**
- **Full:** a new feature, a schema or data-model change, cross-repo work, an autonomous loop, or anything over one session. Fill in every section of the template.
- **Light:** a small change or a QA fix, one session. Fill in only the ★ sections.
- **None:** docs, typos, config. Say "no spec: <reason>".

**Where specs live:**
- The project's own specs folder, if it has one (e.g. `system/specs/`). Otherwise `docs/specs/`.
- The file name is `YYYY-MM-DD-<slug>.md`, copied from `~/.claude/global-rules/spec-template.md`.
- Each specs folder keeps a `README.md` index (spec, size, status, ACs passed, retro lesson). The indexes are my portfolio.

**Stages.** Name the current one in replies, e.g. "Stage 1, Specify".
1. **Specify (I own it; Claude coaches).**
   - Use structured questions to draw out the problem, the outcome and its metric, the scope and non-goals, the ACs, the edge cases and failure states, and the open questions.
   - Coach in one line each, naming the PM skill. Flag:
     - an AC that can't be tested
     - a vague word an agent would guess at
     - a "how" leaking into the "what"
     - a missing non-goal
   - Every AC gets an ID and a "Verified by" line, written before the build.
2. **Lock.**
   - Only I lock a spec, explicitly. The status becomes `LOCKED (date)`.
   - No production code before the lock. Labelled spikes that answer an open question are allowed.
3. **Plan (Claude; I review it against intent).**
   - The technical approach and its trade-offs, in plain English. Ask about real choices.
   - Include the **Agents and automation** table (see section 2).
4. **Tasks.** Small and checkable. Each lists its AC IDs, with ⏸ pause points marked.
5. **Build.** Work task by task and stop at ⏸. Questions the spec doesn't answer go into Open questions; carry on with unblocked work rather than guessing.
6. **Verify.** Mark every AC pass or fail, with real evidence. A failing AC is never quietly reworded to pass.
7. **Change control (any time).** When reality contradicts the spec, stop. Propose a change-log entry and get my OK. Update the spec, then the code.
8. **Retro.** Fill in "Spec vs reality" (what it got right, what it missed, what changed, what to do next time), then update the index.

The project's own CLAUDE.md wins on conventions (folders, git workflow). These stages are the floor.

## 2. Agents in the build: help me think like a production team

Real production teams run many automated helpers across build and release: spec review, test generation, code review, security scanning, eval gates, deploy checks and post-release monitoring. I want to learn to design that pipeline, sized to each project.

- **At Plan (Stage 3) on every Full build,** fill in the spec's "Agents and automation" table. For each stage the build touches, say:
  - what checks it automatically
  - what kind of check it is (deterministic check, hook, subagent, CI bot, LLM-as-judge)
  - whether that exists already or is being proposed
  - where the human gate sits
  - what the real-world equivalent is, in one line
- **Propose at most one new agent per build.** Only propose one when a real, recurring pain justifies it: a bug class that escaped twice, or a check I keep doing by hand. Never add one "because production teams have one".
- **An agent is a product.** Building one is its own spec'd build, with ACs and an eval: what it must catch, its acceptable false-positive rate, and a labelled set of examples.
- **Order of preference:** deterministic check (test, lint, invariant, schema), then hook, then subagent or LLM judge. Use an LLM only where judgement is genuinely needed.
- **Humans keep the gates:** locking a spec, approving a plan, merging or releasing, migrating data that real users depend on, and anything that sends to other people.
- **Reference:** `~/.claude/global-rules/agent-pipeline.md` covers the stage-by-stage map, how each agent maps onto Claude Code features, and a starter set. Read it at Plan on a Full build, or when I ask about agents.
