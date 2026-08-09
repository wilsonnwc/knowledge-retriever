---
name: bulk-import-notes
description: Agent instructions for bulk-importing articles, quotes, and books into the knowledge base
metadata:
  type: project
---

# Agent Instructions: Bulk-Importing Notes & Sources

## Your Task
You are helping the user organize and import multiple quotes, excerpts, or articles into their personal PM/AI knowledge base. Your goal is to create well-structured, properly-tagged markdown files that are ready for retrieval.

## Key Principles

1. **Consolidate by source, not by topic.** Keep one file per authoritative source (book, article, author), organized internally by theme. Only split when sources cover genuinely independent use cases (rare).

2. **Preserve narrative structure.** Don't fragment coherent thinking. If a source has a unified thesis, keep it together.

3. **Tag for interview readiness.** The user is preparing for AI PM interviews. Apply "job-application" only to concepts specifically relevant to AI product management roles, not generic PM knowledge.

4. **Organize internally by theme, with self-contained sections.** Use `## Section Headers` to group related concepts within a file. Each `##` section must be understandable on its own (no "as mentioned above") and capped at roughly 40–60 lines — this is deliberate prep for semantic search chunking later (see `system/semantic-search-chunking-plan.md`). Sections become the retrieval unit; the file stays the citation unit.

   > **Why this matters:** Later, semantic search will break each file into these `##` sections and search them individually — so if a section only makes sense alongside the section before it ("as discussed above"), the search engine will retrieve it in isolation and it'll read as confusing or incomplete. Writing each section to stand alone now avoids having to rewrite everything later.

5. **No speculation.** If you don't know the source, mark it as "source unknown" or ask the user. Don't guess or invent sources.

6. **Never finalize AI-drafted "Why this matters" without user confirmation.** See the dedicated workflow below — this field is meant to capture the user's authentic reasoning, not the agent's inferred rationale.

   > **Why this matters:** If Claude guesses at why a note mattered and the user never checks it, the note ends up carrying a plausible-sounding rationale that isn't actually the user's own thinking — which defeats the point of a personal knowledge base and could read as rehearsed rather than understood if quoted back in an interview.

---

## Step-by-Step Workflow

### Step 1: Analyze the Input
Before creating files, understand what you're working with:
- [ ] Is this from a single authoritative source (book, article, podcast, person)?
- [ ] Does it have a unified thesis or methodology?
- [ ] Would this be cited as a whole in an interview?
- [ ] Are all sections interconnected, or are some truly independent?

### Step 2: Apply the Split/Consolidate Decision
**Ask yourself:**
```
Is this one coherent source with a unified thesis?
  ├─ YES → Keep as ONE FILE (go to Step 3A)
  └─ NO → Are the sections genuinely independent?
         ├─ NO → Keep as ONE FILE (go to Step 3A)
         └─ YES → Split into 2-3 thematic files max (go to Step 3B)
```

**Examples:**
- "Design of Everyday Things" → ONE FILE (unified theory)
- "PM Playbook for Shipping AI Features" → ONE FILE (all sections needed to ship)
- "The Mom Test" → ONE FILE (one methodology, multiple techniques)
- [Very rare] "Random newsletter with unrelated tips" → Consider splitting by theme, but only if truly independent

### Step 3A: Create ONE Consolidated File

**Filename:** `{topic-folder}/{source-slug}.md`

**Example:** `notes/design/design-of-everyday-things.md`

**YAML frontmatter:**
```yaml
---
type: book | article | podcast | video | quote | own-note
source: "Full Title — Author or Publication"
url: [if available]
date: YYYY-MM-DD
tags: [foundational-knowledge, revisit, job-application, favourite]
---
```

**Structure:**
1. Brief intro (1-2 sentences on what this source covers)
2. `## Section Headers` organizing content by theme
3. For each section: quote/excerpt + `> **Why this matters:** [one sentence]`
4. Final `> **Why this matters (overall):** [one comprehensive sentence]`

**Example structure:**
```markdown
---
type: book
source: "The Mom Test — Rob Fitzpatrick"
date: 2026-08-02
tags: [foundational-knowledge, job-application]
---

Foundational methodology for conducting customer interviews without false positives.

## Section 1: The Three Rules
[content]
> **Why this matters:** [insight]

## Section 2: Bad Questions vs. Good Questions
[content]
> **Why this matters:** [insight]

> **Why this matters (overall):** This is the definitive guide to customer interview methodology.
```

### Step 3B: Split into 2-3 Thematic Files (Rare)

Only if sections are genuinely independent. Create files like:
- `{source-slug}-topic-1.md`
- `{source-slug}-topic-2.md`

Keep the same source attribution in all files. Example:
- `four-questions-for-executives.md`
- `stakeholder-identification-framework.md`

Both have source: "Product Management Framework" with shared origin.

---

## Tagging Rules

These definitions are precise on purpose — they're rules an agent can apply consistently, not vague vibes.

### foundational-knowledge
✓ Apply to: Something a quality **senior** product manager — aspiring to **principal or director** level — should know well and be able to **execute daily**. The test is competence, not trivia: could this person be expected to actually apply this in their day-to-day work, not just recognize the term?

### favourite
✓ Apply ONLY when the user explicitly says so while processing a source. This is a matter of personal judgment, never an agent inference. If the user hasn't specified it, do not apply this tag — do not guess based on how "good" a quote seems.

### revisit
✓ Apply to: In-depth knowledge with real density/nuance — content the user may need to **re-read** to properly internalize. Often goes beyond what a typical PM is expected to be good at (i.e., it's a stretch skill, not baseline competence). Distinguish from `foundational-knowledge`: foundational = daily-use competence; revisit = deep material worth returning to.

### job-application
✓ Apply to content that does ONE of the following:
1. Answers a question an **AI product manager specifically** would need to be comfortable answering (AI shipping, evaluation, model behavior, AI product sense, AI-era judgment)
2. Illustrates **mature leadership, communication, or strategic thinking** at the level a **senior PM interviewing for principal/director** would need to demonstrate

✗ Do NOT apply to: generic PM competence that doesn't meet either bar above, even if foundational. Example: "Five Whys" is solid PM methodology but doesn't answer an AI-specific question or demonstrate principal/director-level judgment — tag it `foundational-knowledge`, not `job-application`.

**Note:** Tags are not mutually exclusive. A concept can be both `foundational-knowledge` and `job-application` if it clears both bars independently — check each definition on its own merits rather than picking just one.

---

## "Why This Matters" Workflow (confirm/edit, every time)

The point of this field is to capture the **user's own reasoning** for saving something. An agent inferring that reasoning after the fact and silently saving it undermines the field's purpose — it stops being authentic recall and becomes an AI's guess dressed up as the user's judgment. This matters especially for interview prep: reciting an AI-inferred rationale under interview pressure reads as rehearsed rather than understood.

**Process for every note, long or short:**

1. **Agent drafts a proposed "Why this matters"** for each section/note being created.
2. **Agent presents the draft(s) to the user for confirmation or edit** before writing the file — do not save a draft as final without this step, regardless of source length.
3. **User has three options for each draft:**
   - **Confirm as-is** — the draft accurately reflects their reasoning
   - **Edit** — user rewrites it in their own words
   - **Defer** — user says "TODO: review later." In this case, write the file with:
     `> **Why this matters:** [TODO — user to review]`
     and flag it clearly in the end-of-task summary so it's easy to find later.

**Do not:**
- Silently finalize an AI-drafted rationale without presenting it for confirmation first
- Leave a "Why this matters" blank without the explicit `[TODO — user to review]` marker (a truly blank field is easy to forget existed)
- Batch-confirm many drafts at once without the user actually seeing each one — present them clearly enough that a real yes/no/edit decision is possible per item

---

## Quality Checklist

Before finalizing files:

- [ ] **Cohesion check:** Does this source have a unified thesis or methodology?
- [ ] **Citation check:** Could I cite this as a whole in an interview?
- [ ] **Fragmentation check:** Are concepts scattered unnecessarily across folders?
- [ ] **Tag check:** Each tag independently passes its own definition test (see Tagging Rules); `job-application` and `favourite` are not applied by default/inference
- [ ] **Structure check:** Sections are self-contained, ~40–60 lines each, clear internal organization
- [ ] **Why this matters:** User has confirmed, edited, or explicitly deferred (TODO) each one — none silently finalized by the agent
- [ ] **Overall summary:** File ends with comprehensive "Why this matters (overall)"
- [ ] **Spelling/formatting:** YAML frontmatter is valid, markdown is clean
- [ ] **Source tracking:** Author/publication is clear and accurate

---

## Common Mistakes to Avoid

❌ **Creating 10+ files from one source** (e.g., 14 files from Design of Everyday Things)
✓ Fix: Consolidate into one file organized by theme

❌ **Splitting when there's no good reason** (e.g., "Strategy" and "Prioritization" are connected)
✓ Fix: Keep sections together; use `## Headers` to organize

❌ **Tagging generic PM concepts as "job-application"** (e.g., "Analytics Framework")
✓ Fix: Reserve job-application for AI PM-specific or interview-critical concepts

❌ **Multiple "Why this matters" that repeat the same point**
✓ Fix: One "Why this matters" per section, one comprehensive summary at end

❌ **Losing track of the source** (e.g., quotes attributed to "unknown")
✓ Fix: Always document source. If truly unknown, mark as "Source unknown" and note in user message

---

## Example: Consolidation Done Right

**Input:** User provides 10 quotes from "Design of Everyday Things"

**Wrong approach:** Create 10 separate files
```
affordances-signifiers.md
conceptual-models.md
error-messages.md
...
```

**Right approach:** Create 1 consolidated file
```
design-of-everyday-things.md
├── Part 1: Fundamental Principles
│   ├── Affordances & Signifiers
│   ├── Conceptual Models
│   └── Human-Centered Design
├── Part 2: Human Psychology
│   ├── Cognition & Emotion
│   ├── Flow State
│   └── Seven Stages of Action
├── Part 3: Practical Patterns
│   ├── Error Messages
│   ├── Request for Confirmation
│   └── Good Enough
└── Part 4: Systems & Resilience
    ├── Five Whys
    ├── Swiss Cheese Model
    ├── Resilience Engineering
    └── Checklists
```

**Benefit:** One source, easy to cite, proper narrative structure, ready for semantic search upgrade.

---

## When to Ask the User

- [ ] Source is unclear or you're unsure about attribution
- [ ] Content spans multiple genuinely independent topics and you're unsure whether to split
- [ ] User has specific preferences on how to organize certain sources
- [ ] File is getting very long (>150 lines) and you're unsure whether to split

**Ask format:** "Should I consolidate X and Y into one file, or would you prefer them separate for [reason]?"

---

## After Creating Files

1. **Commit to git** with message referencing the source and the number of files created
2. **Summarize back to the user** what was created, organized by topic folder
3. **Note any sources marked "unknown"** that the user should verify later
4. **Flag any tagging decisions** you made (e.g., "I tagged X as job-application because...")
5. **Ask whether to check for related notes.** If the new note carries a `projects:` tag, ask: "Want me to check for related notes in [project name(s)]?" If yes: re-run `scripts/embed.py` first (the new note must be embedded before it can be compared), then run `scripts/chat.py --suggest-related <path-to-new-note>` and present the results. Skip this step silently if the note has no `projects:` tag — don't ask.

---

## Success Criteria

✓ Files are consolidated by source, not fragmented by topic
✓ Each file has clear structure with `## Section Headers`
✓ All "Why this matters" lines are specific and valuable
✓ Tags are accurate and conservative (especially job-application)
✓ Frontmatter is complete and valid YAML
✓ Source attribution is clear and accurate
✓ Files are organized into correct topic folders
✓ User can cite sources coherently in interviews

---

## Reference Documents
- See `system/split-vs-consolidate-guide.md` for decision framework and reasoning
- See `system/semantic-search-chunking-plan.md` for why sections are capped/self-contained and how that supports future semantic search
- See `CLAUDE.md` for taxonomy, note format, and project principles
- See `system/project-management/taxonomy.md` for controlled vocabulary
