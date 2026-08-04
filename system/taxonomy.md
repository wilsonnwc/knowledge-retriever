# Taxonomy

*Your controlled vocabulary. Fill this in before creating any note folders. The system is only as good as the consistency of this list.*

---

## Topic folders

These become the subfolders inside `notes/`. Aim for 8–12. Broad enough to stay durable, specific enough to be meaningful.

> **Analogy:** Think of these folders like the section signs in a library ("Fiction," "History," "Biography") rather than individual book titles. Too granular ("ai-agents," "ai-context-windows," "ai-rag-systems") and you end up with a sign for every single book — no one can browse it, and you'll constantly be unsure which sign a new book belongs under. Too broad ("AI") and the sign is useless because it tells you nothing about what's behind it. The goal is the middle ground: a handful of durable categories that stay meaningful as the collection grows.

**Rules:**
- Never create a `notes/` subfolder that isn't on this list
- If a new topic genuinely doesn't fit, add it here first, then create the folder
- Folder names: lowercase, hyphens only, no spaces (e.g. `ai-systems`, not `AI Systems`)

```
- product-strategy
- design
- discovery
- stakeholder-management
- vibe-coding
- ai-products
- ai-general
- product-organisation
- communication
- leadership
```

---

## Cross-cutting tags

Tags that apply across topics — not folder names, just metadata labels you can add to any note's frontmatter.

```
- favourite
- foundational-knowledge
- revisit
- job-application
```

> **Why folders vs. tags are different tools:** A folder is where a note *lives* (one folder only — like a filing cabinet drawer). A tag is a label you can stick on top of that, and a note can carry several. For example, a note in the `ai-products` folder about evaluation design could also be tagged both `foundational-knowledge` (a senior PM should know this cold) and `job-application` (it's specifically relevant to an AI PM interview) at the same time — see `system/agent-bulk-import-instructions.md` for the precise definition of each tag and how they combine.

---

## What counts as each content type

| Type | Use when | Example |
|---|---|---|
| `quote` | Verbatim text from an external source — copied word for word, nothing changed | A highlighted sentence from a book or article |
| `own-note` | Your own thinking — a reaction, synthesis, conclusion, or half-formed idea | Something you wrote yourself, not copied from anywhere |
| `book` | A key takeaway, summary, or highlight from a book — not necessarily verbatim | A chapter summary or a paraphrased idea from a book you read |
| `article` | A takeaway or highlight from an online article, blog post, or essay | A saved insight from an Instapaper article |
| `podcast` | Something you heard in a podcast — a quote, idea, or moment worth keeping | A point from a guest that you noted down while listening |
| `video` | Something from a talk, YouTube video, or recorded presentation | A framework from a conference talk or a key line from a YouTube video |

---

## Naming conventions

File names should be readable slugs from the main idea. Examples:

```
context-is-never-neutral.md
labelling-problem-ai-systems.md
build-measure-learn-loop.md
```

Not:

```
note1.md
untitled.md
highlight-june-2026.md
```

---

*Once this is filled in, use it as the reference for Phase 1 of the build plan.*
