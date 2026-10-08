# Specs: index

Every build follows spec-driven development (a global rule: see "Spec-Driven Development" in `claude-brain/CLAUDE.md`). This folder holds one spec per build. Together, they are the evidence that this project was run spec-first: intent was written down and locked, every acceptance criterion was verified, and the retro compares the spec with what really happened.

- New spec: copy `claude-brain/docs/spec-template.md` to `YYYY-MM-DD-<slug>.md`. The template is shared by all projects.
- Add a row below when the spec is created, and update it at retro.

| Spec | Size | Status | ACs passed | Key "spec vs reality" lesson |
|---|---|---|---|---|
| [Phase 2a: digest upgrade + Today page](../phase2a-spec.md) | Full | Shipped (pre-framework) | See `phase2a-progress.md` | Written before this framework existed: locked decisions, locked ACs and pause points were already there. Missing: an AC-by-AC evidence table and a formal change log. Scope changes (e.g. hosting moved from Render to Vercel) are recorded across docs, not in one place. |

## Earlier builds without a written spec (for contrast)
- **Projects UI (Session 34):** the ACs were locked through a structured Q&A in conversation, then the build ran end to end. This was the first step towards spec-first working, but the spec only exists in the session log.
- **Sessions 35–38 QA rounds:** each round turned QA findings into explicit ACs before fixing them. These would be Light specs under this framework.
