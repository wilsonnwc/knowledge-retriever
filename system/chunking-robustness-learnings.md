---
name: chunking-robustness-learnings
description: Why a hand-tuned chunking rule is fragile at scale, how commercial RAG systems actually handle content variety, and what we chose to build now vs. defer
metadata:
  type: project
---

# Chunking Robustness: Learning Record

This document exists because the chunking rule we built (`scripts/chunking.py`) was hand-tuned against 26 known notes — a reasonable first step, but a real gap from how production RAG systems handle content they've never seen before. This is the record of that gap, how commercial systems close it, and what we chose to build now vs. defer.

> **Analogy:** Building a chunking rule against 26 known notes is like a tailor who makes a suit that fits one specific person perfectly, by measuring that exact person. It works beautifully — for that one person. The moment a different-shaped customer walks in (a note with a totally different structure), the suit doesn't fit, because the tailor never designed for "bodies in general," only for the one body they measured. "Overfit" is the technical name for that same trap in software: a rule tuned so precisely to the examples you tested that it silently breaks on anything slightly different.

---

## The Problem: Our Rule Is Overfit

The chunking rule (30-line threshold, split at `##` or bold-labels) works because we tested it against exactly the 26 notes it was designed for. Real-world content — including notes we haven't written yet — will break it in predictable ways:

- A note with numbered headers (`1. Introduction`) instead of `##` or bold-labels
- A pasted email, Slack thread, or meeting transcript with no structure at all
- A PDF-extracted research paper where "structure" is visual (font size, whitespace), not markdown syntax
- Code blocks, tables, or blockquotes that shouldn't be split mid-element
- Non-English content, where "N lines" doesn't map to "amount of meaning" the same way

Before this session, our rule had no answer for "long note, no `##`, no detectable bold-label" — it would have silently kept such a note as one large, diluted chunk, exactly the failure mode chunking exists to prevent.

> **Analogy:** Think of "silently keeping one large diluted chunk" as trying to summarize an entire 40-minute meeting into a single Post-it note. You *can* technically fit words on it, but cram five different topics onto one note and the note becomes useless for finding any one of them again — the embedding equivalent of a Post-it so crowded no single idea stands out.

---

## How Commercial RAG Systems Actually Handle This

**1. Token-based sizing, not line-based.** Production systems size chunks by token count (using the embedding model's actual tokenizer, e.g. `tiktoken`), not visual line breaks — because the real constraint is the model's context/attention budget, which doesn't correlate cleanly with lines of prose. We kept line-based sizing deliberately (see "What We Chose Not to Build" below) since our corpus is small and short.

> **Plain-English restatement:** A "token" is roughly a word-chunk (not exactly a word, not exactly a character — often about ¾ of a word). Embedding models and chat models don't actually read "lines," they read tokens, so a line with one long sentence and a line with three short sentences can be wildly different sizes in the units that actually matter to the model. Line-count is a convenient human-readable proxy that only stays accurate as long as your notes are written in a fairly consistent style — which is true for a 26-note personal corpus, but wouldn't be true at scale or across different authors.

**2. Recursive/structural splitting with graceful fallback.** This is the actual industry-standard pattern (LangChain's `RecursiveCharacterTextSplitter`, LlamaIndex's node parsers): try the most meaningful boundary first, and fall back down a hierarchy if it's absent or a resulting chunk is still too large:
```
## headers → paragraphs (\n\n) → sentences → hard token-count split (last resort)
```
Every document gets a reasonable outcome without hand-writing a rule for every possible structure — the fallback chain absorbs unknown formats automatically. **This is the piece we built this session** (see below).

> **Analogy:** This is like a GPS with a route-planning fallback chain — try the highway first (fastest, most structured route); if it's closed, try the main roads; if those are blocked too, fall back to "just drive toward the destination street by street." You never get *no* route, you just get a progressively less elegant one. Chunking works the same way: try the cleanest boundary (`##` headers) first, and only fall back to blunter methods (paragraphs, then raw sentence/token cuts) when the cleaner option isn't available — so no document is ever left completely unhandled.

**3. Format-aware parsers per content type.** Commercial pipelines (LlamaIndex, Unstructured.io, LangChain document loaders) route each document to a parser suited to its format — Markdown, PDF, HTML, code each get different structural logic (e.g. a PDF parser reads heading font size/position; a code parser splits along the language's syntax tree). Directly relevant to the Elsevier/LeapSpace case: research articles and personal notes should get *different* chunking logic, not one rule stretched across both.

> **Analogy:** This is like having a different set of scissors for fabric, paper, and metal instead of trying to cut everything with one all-purpose blade. A PDF doesn't have `##` markdown headers at all — its "structure" is visual (a bigger, bolder font at the top of a section) — so a PDF-aware parser has to look for those visual cues instead, the same job as a Markdown parser but reading completely different signals.

**4. Metadata-driven overrides.** Some systems let specific documents declare their own chunking hints (e.g. "respect the author's manual section breaks") as an escape hatch for content that defies automatic detection.

> **Plain-English restatement:** This is a manual override button — a way for a specific document to say "trust me, I already know how I should be split, don't guess." Useful as a last resort for the rare document that breaks every automatic rule.

**5. Continuous evaluation via a canary set, not manual spot-checks.** This is the biggest structural difference from what we did by hand. We spot-checked ~4 notes by eye. Production systems can't do that at the scale they operate at — instead:
- A small, fixed, held-out set of test queries with known-good answers (our locked 28-query test set is exactly this — a "canary set," named after the canary-in-a-coal-mine early-warning idea) is re-run automatically whenever the ingestion pipeline changes (new chunking rule, new embedding model, new batch of documents).
- The metric (precision@5, in our case) is compared against the last known-good score.
- If it drops below tolerance, the pipeline fails loudly (blocks deploy, alerts someone) instead of silently shipping degraded retrieval.
- This is the retrieval-quality equivalent of a unit test suite: the philosophy shifts from "prove the chunking rule is correct upfront" to "make bad chunking cheap and fast to detect after the fact."

---

## What We Chose to Build Now vs. Defer

Two levers exist for handling content variety long-term, and they solve different failure modes:

- **Ingestion-time fix (upfront):** an AI-assisted step that normalizes a new note's structure (adds `##` headers, flags unclear structure) *before* it's saved. High leverage because the note's author (you) controls creation — but this only works when you control the source, which LeapSpace largely does not (researchers upload arbitrary third-party PDFs, and future integrations with tools like Notion/Obsidian would mean even less control over source formatting).
- **Read-time fix (fallback robustness):** make the chunker itself degrade gracefully on content it doesn't recognize, rather than requiring the source to already be well-formed.

> **Analogy:** This is the difference between "check IDs at the door" (ingestion-time — fix the problem before it enters the building) and "have security cameras and staff who can handle whatever walks in" (read-time — cope gracefully with whatever actually shows up, unchecked). A venue that fully controls its guest list only needs the first. A venue that can't control who walks in — like LeapSpace, which can't dictate the format of a researcher's uploaded PDF — needs the second, regardless of how good the first would be in theory.

**Decision (2026-08-04): built the read-time fallback first, deferred the ingestion agent.**

**Why:** this project doubles as interview preparation for a role where the product (LeapSpace) mostly *can't* control source content structure — researchers upload arbitrary PDFs, and a plausible future direction involves connecting to researchers' existing tools (see `system/job-ad-reference.md`'s Notion/Obsidian/MCP discussion). The read-time robustness path is the closer analog to that actual constraint, so it's the more directly relevant thing to have built and be able to discuss. The ingestion-agent idea is recorded as a future roadmap item in `CLAUDE.md` for when the project is used for genuine ongoing personal note-taking, where — unlike LeapSpace — the author *does* control the source.

**What we chose not to build (yet), and why:**
- **Token-based sizing:** unnecessary complexity for ~26 short notes where line count and token count rarely diverge meaningfully; would require adding a tokenizer dependency for no measurable benefit at this scale.
- **Format-aware parsers per content type:** not needed while every note is authored as Markdown by the same person (you) — this becomes relevant if/when the project ever ingests PDFs or externally-sourced formats.
- **Automated canary-set re-run on every ingestion change:** a real, buildable upgrade (we already have the eval script and the test set), but treated as a near-future addition rather than done this session — see Open Questions.

---

## What Was Built: The Fallback Path

`scripts/chunking.py` now has a 4th rule: if a note is over the line threshold, has no `##` headers, and no bold-label lines are detected, it falls back to splitting at paragraph breaks (blank lines), capping each resulting chunk at roughly 15 non-blank lines, and never splitting inside a paragraph. Verified against synthetic unstructured content (a fake 36-line note with no headers or labels) — correctly produced 3 balanced chunks instead of one diluted 36-line chunk. Re-ran against the real 26-note corpus afterward and confirmed zero regressions — identical chunk counts and boundaries to before the fallback was added.

> **Plain-English restatement:** Rules 1–3 in `chunking.py` are the "does this note have obvious structure?" checks (headers, bold labels, etc.). Rule 4 is the new safety net: if none of those checks find anything to split on, instead of giving up and keeping the whole note as one blob, it just cuts at blank lines (paragraph breaks) — the one structural signal almost every piece of writing has, even totally unformatted text. And "zero regressions on the real 26-note corpus" is the important verification step here: adding a new fallback for edge cases could have accidentally changed behavior on notes that were already working fine — confirming it didn't is what makes this a safe change, not just a hopeful one.

---

## Interview-Ready Framing

"I built a chunking rule that worked well for my own 26 notes, then deliberately stress-tested it against content it wasn't designed for — a long note with no headers and no labels — and found it would silently produce one diluted chunk instead of failing safely. I added a paragraph-based fallback so degradation is graceful rather than silent, which is the same 'recursive splitting with fallback' pattern used in production RAG frameworks like LangChain. I also mapped out the two ways to solve content variety long-term — fix structure at ingestion time (when you control the source) versus build robustness at read time (when you don't) — and prioritized the read-time fix first because it's the closer match to a product like LeapSpace, which can't control how a third-party PDF or a researcher's own Notion workspace is structured."

---

## Open Questions to Come Back To

- Build the automated canary-set re-run: wire `run_evaluation.py` to run automatically whenever `chunking.py` or the notes corpus changes, and compare precision@5 against the last recorded score, so silent retrieval regressions get caught the way production systems catch them.
- The ingestion agent (future roadmap item, tracked in `CLAUDE.md`) — design once this project is in genuine daily-use mode, not just interview-prep mode.
- Should the fallback's paragraph cap (currently 15 lines) be tuned once the eval pipeline can score it, the same way the 30-line threshold was?

> **Big picture:** The core lesson of this whole document is that a rule which works perfectly on the data you tested it against tells you nothing about how it'll behave on data you haven't seen yet — the only way to find out is to deliberately throw unfamiliar content at it and watch what breaks, then build a graceful fallback instead of assuming the happy path is the only path.
