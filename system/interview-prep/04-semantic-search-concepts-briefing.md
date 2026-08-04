---
name: semantic-search-concepts-briefing
description: Plain-language briefing on embeddings, vector databases, cosine similarity, and chunking — the core concepts behind Phase 4 (semantic search), written for someone new to RAG
metadata:
  type: interview-prep
---

# Semantic Search Concepts — Plain-Language Briefing

**Context:** Before implementing Phase 4 (semantic search), we paused to build the concept foundation from scratch — no assumed prior knowledge of RAG, embeddings, or chunking. This is that briefing, written to be re-read cold before an interview.

---

## Why semantic search at all?

Phase 3.5 measured keyword search at 82% precision@5 — genuinely good. But the 5 remaining failures all had the same shape: the right answer existed in the notes, just phrased differently than the query. "PM" vs. "product manager." "organize" vs. "organising." Keyword search can only find words that literally appear in the text — it has no concept of two different words meaning the same thing. Semantic search is the technique built specifically to close that gap.

> **Why this matters for interviews:** 82% is a strong number, and the temptation is to say "good enough, ship it." But naming the *shape* of the remaining 18% — always a synonym/rephrasing problem, never a random failure — is what justifies investing in a whole new technique rather than just tweaking the existing one. Precise diagnosis, not just a dissatisfying score, is what earns the next phase of investment.

---

## Concept 1: What is an "embedding"?

An embedding is a way of turning a piece of text into a list of numbers — a "meaning fingerprint." The sentence *"How do I manage my time as a PM?"* becomes something like `[0.12, -0.87, 0.33, ...]` (1536 numbers, for the model we're using).

**The key property:** texts with similar *meaning* get similar numbers, even without sharing any words. "spend my time as a PM" and "managing time as a product manager" produce nearly identical number-lists, because they mean the same thing — even though "spend" never appears in "managing."

You don't write these numbers yourself. You send text to an embedding model (we chose OpenAI's `text-embedding-3-small`), and it returns the numbers.

---

## Concept 2: Who decides what the numbers are?

**Nobody manually decides them — they're learned by training a neural network on huge amounts of real text.**

OpenAI trained a neural network by repeatedly showing it text and asking it tasks like "do these two sentences mean roughly the same thing?" Every wrong answer nudged the model's internal numbers slightly. Repeated billions of times, the model gradually discovers — entirely on its own — that "PM" and "product manager" tend to appear in similar contexts, so it learns to place their fingerprints close together. Nobody hand-coded "PM = product manager"; the model inferred it purely from patterns in how people actually use language.

**Two practical implications:**
1. **The model is frozen once trained.** Calling the API to embed a query doesn't teach the model anything new in real time — it's applying patterns already learned during training. Your notes don't change the model's underlying knowledge.
   > **Plain-English restatement:** Every time you send text to the embedding API, you're not "teaching" it anything about your notes — you're just asking a fixed, already-trained expert to translate that text into its number-fingerprint, the same way it would translate any text, using knowledge it finished learning long before you ever sent your first query.
2. **Embeddings from different model versions aren't comparable.** Always embed your notes *and* your queries with the exact same model — mixing versions is like comparing miles to kilometers without converting.
   > **Why this matters for interviews:** This is a real, concrete gotcha worth naming: if you ever re-embed your notes with a newer model version but forget to also re-embed your queries the same way (or vice versa), search quality silently degrades — not because either embedding is "wrong," just because they're speaking two different number-languages that happen to look similar on the surface (both are just lists of numbers) but aren't actually comparable.

---

## Concept 3: How does search work once everything is numbers?

Once every note (or note section) has its own fingerprint, search becomes a math problem: take the query's fingerprint, and find which notes' fingerprints are *closest* to it in that number-space.

"Closest" is measured by **cosine similarity** — a score from -1 to 1 saying how aligned two fingerprints are, where 1 means identical meaning. You don't need the formula to explain this well; the intuition (closeness in a meaning-space) is what matters for a PM-level explanation.

> **Analogy:** Picture a giant 3D star map where each star is a note, and stars that mean similar things are clustered near each other — a cluster for "time management," a separate cluster for "customer research," and so on. When a query comes in, it also gets plotted as a point on that map. Search just means: look around that point and see which stars are nearest. Cosine similarity is simply the ruler used to measure "near" — you don't need to know how the ruler is machined, just that it measures closeness in meaning-space.

> **Plain-English restatement:** A cosine similarity of 1 means "these two mean essentially the same thing." A score near 0 means "unrelated." A negative score means "roughly opposite in meaning." In practice, you almost never talk about the raw number in an interview — you talk about the *result* of using it: "the system returns whichever notes score highest against the query."

---

## Concept 4: Why do we need a vector database (Chroma)?

Once you have hundreds of these fingerprints, you need somewhere to store them and a fast way to ask "which fingerprint is closest to this new query's fingerprint?" That's literally what Chroma does — a storage system purpose-built for "find nearest fingerprints," so you don't write that search logic from scratch.

**Chroma is free and runs locally** (like SQLite) — no account, no API key, no usage fees. The only cost in the whole setup is the OpenAI embedding API calls that generate the fingerprints in the first place — at this project's scale (~26 notes, low hundreds of chunks), that's a fraction of a cent total.

**Cost split worth remembering:** "free/open-source" and "has a cost" are usually two separate axes in AI tooling. The vector database (storage/search infrastructure) is commonly free and local; the embedding model (turning text into vectors) is the part that costs money, because it's an API call to a hosted model.

> **Analogy:** Chroma is like a filing cabinet with an extremely good sense of "which folder is closest to this one" — but the filing cabinet itself is free, off-the-shelf hardware. What costs money is the service that reads each document and writes the summary card that goes in each folder (the embedding API call). You pay for the labor of creating the fingerprints, not for the shelf that stores them.

---

## Concept 5: Why can't we just embed each whole file?

If a whole file — say, Design of Everyday Things, which covers affordances, error handling, feedback loops, all in one document — gets turned into *one* fingerprint, that fingerprint has to represent every one of those ideas simultaneously. It ends up as a blurry average that doesn't strongly match any single query well. This is called **semantic dilution**.

The fix is **chunking**: break the file into smaller pieces first, and embed each piece separately, so each fingerprint represents one coherent idea rather than a blur of several.

*(Note: exactly how to chunk this project's notes — by `##` header, by fixed size, with overlap or not — is a separate decision, deliberately not covered in this briefing. That gets its own design discussion before any code is written, since a prior version of that decision was written up without being properly discussed and reviewed first.)*

---

## Quick-Recall Summary (for interview cold-recall)

| Concept | One-line definition |
|---|---|
| Embedding | Text turned into a list of numbers ("meaning fingerprint") such that similar meanings produce similar numbers |
| Who creates embeddings | A neural network trained by the model provider (e.g. OpenAI) on huge text datasets — not manually assigned, learned from patterns |
| Cosine similarity | A score (-1 to 1) measuring how aligned two fingerprints are — the basis for "nearest meaning" search |
| Vector database (Chroma) | Storage + fast search for "find the closest fingerprints to this one" — free, runs locally |
| Semantic dilution | What happens when one fingerprint has to represent too many different ideas at once — it becomes a blurry average that matches nothing well |
| Chunking | Splitting a document into smaller pieces *before* embedding, so each fingerprint represents one coherent idea |

**Interview-ready framing:** "Semantic search works by converting text into numerical 'meaning fingerprints' called embeddings, generated by a neural network trained on huge text datasets — not hand-coded rules. Search becomes a math problem: find which fingerprints are closest to the query's fingerprint, using cosine similarity. A vector database like Chroma stores these fingerprints and makes that search fast. One subtlety I learned early: you can't just embed a whole multi-topic document as one fingerprint, because it dilutes the meaning into a blur — you have to chunk the document into focused pieces first."

---

**Big picture:** Every concept in this briefing is really one idea, applied at a different layer — meaning can be represented as position in space, so anything that's *close in meaning* ends up *close in that space*, and the entire semantic search system (embeddings, cosine similarity, Chroma, chunking) exists just to create that space accurately and search it fast.
