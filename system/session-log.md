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
- **Semantic search's biggest wins were on "hard" queries requiring synonymy** (e.g. "stop users from making mistakes" → design-of-everyday-things' error-handling content, zero literal keyword overlap) — exactly the retrieval gap semantic search is supposed to close, and exactly the kind of concrete example worth having ready for an interview.
- **A good evaluation should still produce failures.** 96% with one legitimately ambiguous miss is a more credible, interview-ready result than 100% would have been — it shows the eval set isn't rigged and that ambiguous queries are being called out as ambiguous, not silently "fixed."

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
- **Fixing data quality at the source is usually cheaper than compensating for it downstream — but only when you control the source.** Discussed two ways to handle content variety long-term: an ingestion-time agent that normalizes structure before saving (high leverage, but requires control over how content is created) vs. read-time chunker robustness (works regardless of source, but harder to get right). Chose read-time robustness first specifically because it's the closer analog to LeapSpace's actual constraint — the product can't control how a third-party PDF or a researcher's own external tool is structured.
- **A "canary set" is just our existing 28-query eval set, re-run automatically on every pipeline change.** Production systems catch silent retrieval regressions by re-scoring a held-out test set whenever ingestion/chunking changes and comparing to the last known-good score — the retrieval-quality equivalent of a unit test suite. We already have the pieces (`run_evaluation.py`, the locked test set) to build this; just haven't wired it to run automatically yet.
- **A synthetic test can fail silently if the test data itself doesn't actually exercise the code path being tested.** Two attempts at testing the fallback path produced "passing" results (1 chunk, no crash) before realizing the test note was simply too short to trigger the threshold — a reminder to check *why* a test produced a given result, not just whether it ran without error.

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
- **A documented "requirement" in a job ad can be about the candidate, not the product.** The Zotero/Obsidian/Notion line reads as a personal-fluency bar ("you understand this tool category"), not a confirmed integration target — separate from the "richer integrations" line elsewhere in Responsibilities, which *is* a real (if still vague) roadmap signal. Worth reading job ad lines for which section they're in, not just their content.
- **A chunk needs to be self-contained, not just short.** Length alone doesn't determine whether a section should be split — a 25-line note with 2 bold labels can be one indivisible argument (claim → limitation → caveat), while a 52-line note with 7 bold labels can be a compilation of unrelated ideas. The real test is "would this fragment make sense read in isolation," which length + label-count only approximates.

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
- **Embeddings vs. vector databases sit on different cost axes.** The vector database (Chroma) is free/local infrastructure; the embedding model (OpenAI API) is the part that costs money because it's a hosted model call. Conflating "vector search" as one single cost line is a common simplification worth avoiding.

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
- **Design choice vs. method limitation is worth distinguishing precisely.** Keyword search *can* use metadata (Google, Elasticsearch, email search all do) — this implementation just didn't, as a deliberate simplicity choice for a clean baseline.
- **Test set correctness is itself a design decision.** `expected_source` values must reference real filenames (not folders, not imagined files), and fixing them only after seeing failures needs to be done transparently (grounded in file content, not adjusted to make numbers look better) and the set explicitly locked before the next comparison.
- Full bug-by-bug detail lives in `system/interview-prep/03-three-bugs-that-hid-the-baseline.md`; compressed cross-project version in `/Users/wilsonnwc/Tech/AI/learnings.md`.

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
- **The chunking strategy works bidirectionally.** Section-aware retrieval for keyword search is exactly the prep work semantic search needs. We're not building two separate systems; the section discipline serves both.
- **Tagging precision prevents drift.** Moving from vague definitions ("foundational = important stuff") to testable rules ("foundational = what a senior PM aspiring to principal should know and execute daily") makes multi-session consistency possible.
- **Job context sharpens decisions.** LeapSpace's job requirements (RAG, chunking, researcher knowledge bases, evaluation of AI reasoning) directly validated which problems in this project matter most. The retrieval bug we just fixed is the exact class of problem LeapSpace solves.

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
- Note quality doesn't suffer from speed; frontmatter discipline (YAML structure) enforces consistency automatically
- Source tracking can be lazy too — users naturally remember or find sources later when notes matter
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
- Claude generates good "thinking partner" responses when you give it the full note context plus the system prompt with skills defined.
- The "Why this matters" field really does matter for context quality — helps the model understand which items were saved intentionally.
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
- Tags format: all inside one bracket `[tag1, tag2]` — not separate brackets per tag
- `quote` cannot be both a content type and a cross-cutting tag — they clash. Removed it from tags.
- Lazy annotation strategy: don't force "Why this matters" on bulk imports — let it fill in through use. Only required on `own-note` and `quote` types.
- For articles, split source and URL into separate fields so the display label stays clean

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
- The labelling problem is concrete: `credential-recovery-workflow` vs `reset-password` — system language must match user language or retrieval fails
- More context ≠ better results; models suffer from information overload just like people — structure and prioritisation matter as much as content
- The distinction between context engineering (pipelines, plumbing) and context architecture (structure, meaning, behaviour) — engineers build the infrastructure, architects define what lives on top of it
- Context is never neutral: every naming and structural decision shapes how the system interprets tasks and produces outputs
- Memory needs explicit rules: what to retain, how long, when to surface — without this, systems either forget critical things or surface irrelevant noise

**Open questions for next session:**
- What should my taxonomy look like? Start broad (8–10 folders) and resist the urge to go narrow
- Which of my existing notes are worth adding as the first 10 seed items?
- What's my honest "Why this matters" discipline going to be — will I actually write it for every item?
---
