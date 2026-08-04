# Project Context — Personal Knowledge Retrieval Tool

Use this file to brief Claude at the start of each new session.
Paste the contents into your first message, then update "Where I am now" before doing so.

---

## Session context

I am a Senior Product Manager with limited coding experience,
building a personal knowledge retrieval tool from scratch.
I am using this project to develop hands-on RAG experience
for a job interview. Walk me through everything step by step.

---

## What this project is

A RAG system over my own saved articles, notes, and reading.
I want to be able to ask natural language questions and get
relevant passages back from my own collection.

> **Plain-English restatement:** "RAG" stands for Retrieval-Augmented Generation. In plain terms: instead of an AI model answering purely from what it was trained on, it first *retrieves* the most relevant pieces of your own notes, then *generates* an answer grounded in that retrieved content. It's the difference between asking a well-read friend a question from memory versus asking them to first pull the exact right book off your shelf and then answer using it.

Tech stack: Python, local vector store (Chroma preferred),
simple CLI or script interface. No UI needed.

> **Plain-English restatement:** A "vector store" is a specialized database built to store and search embeddings (the lists of numbers representing meaning — see `system/interview-prep/04-semantic-search-concepts-briefing.md`). Chroma is one such vector store that runs locally on your own machine, free, with no external account needed — the alternative would be a hosted/cloud vector database that costs money and requires setup.

---

## Goal

By end of this build:
- 50+ real articles indexed and queryable
- Natural language retrieval working
- At least one failure diagnosed and fixed
- Honest assessment of where retrieval works and where it fails
- A log of what I tried, what broke, and what I changed

> **Why this matters for interviews:** Notice this goal list explicitly includes "at least one failure diagnosed and fixed" and "honest assessment of where retrieval fails" — not just "build a working system." That's deliberate: a system that never breaks and is never measured critically doesn't teach you anything, and doesn't give you a real story to tell in an interview. The 82% → 96% keyword-vs-semantic comparison and the three-bug eval debugging story (see `system/session-log.md` Session 6 and `system/evaluation/DIAGNOSIS.md`) exist because this goal was set upfront, not because things happened to go wrong.

---

## Where I am now

Session 3 complete. System is live and working:
- Taxonomy designed, 10 note folders created
- 3 real notes indexed (the-mom-test.md, lean-start-up.md, pm-playbook-shipping-ai-features.md)
- chat.py built with keyword search retrieval + Anthropic API integration
- First test query worked — retrieval and response both functioning
- Known issue: keyword-only search, no semantic/embedding search yet

Next session should tackle one of:
1. Add more notes (target: 20+ to reach 50 goal)
2. Upgrade to semantic search with Chroma + embeddings
3. Add evaluation/scoring to measure retrieval quality

---

## Logging requirements — do this every session

At the end of each working step, before we move on, output
a brief log entry in this format:

PROGRESS LOG
Step completed: [what we just built or changed]
Status: [working / partially working / broken]
Next step: [what comes next]

LEARNINGS LOG
New concept learned: [e.g. "chunk size affects retrieval
precision — smaller chunks = more precise but less context"]
Failure encountered: [what broke and why]
How I fixed it: [what change resolved it]
Interview note: [one sentence on how to describe this
in an interview answer]

Save both logs in system/session-log.md in the project root.
Append each session's entries — do not overwrite previous ones.

---

## How to help me

- One step at a time. Do not write the whole system upfront.
- Before writing code, explain what you are about to do and why.
- When there is a design choice (chunking strategy, embedding
  model, retrieval approach), explain the trade-offs briefly
  and ask me which direction I want before proceeding.
- After each working step, tell me what to test or measure
  before moving on.
- If something fails, help me diagnose the root cause — do not
  just patch it. I need to understand failure modes.
- Keep the build simple. I need something real enough to talk
  about in an interview, not production quality.
- Never let me move to the next step without measuring whether
  the current one actually works.

---

## What I want to avoid

- Building something that runs but I cannot explain
- Skipping evaluation — I need scored, measurable output
  quality, not just "it seems to work"
- Overclaiming: I will not say "I built RAG" in an interview
  unless I can explain what chunking strategy I used,
  why I chose it, and what broke when I tried something else

> **Why this matters for interviews:** "I built RAG" is a claim anyone can make; being able to walk through the actual chunking rule (see `system/session-log.md` Session 8), why a 30-line threshold was chosen empirically rather than guessed, and what the eval score showed before and after (see `system/evaluation/DIAGNOSIS.md`) is what separates a real hands-on answer from a buzzword. Interviewers for AI PM roles typically probe past the headline claim precisely to test for this kind of depth.
