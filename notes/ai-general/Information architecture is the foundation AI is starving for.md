---
type: article
source: Information architecture is the foundation AI is starving for
url: https://uxdesign.cc/information-architecture-is-the-foundation-artificial-intelligence-is-starving-for-1d91fb5bf59f
date: 2026.08.01
tags: [foundational-knowledge, revisit, job-application]
---

AI Summary of the article:

The core argument: Information architecture (IA) spent twenty years as an underfunded, invisible discipline — job titles vanished, and the hard work of getting teams to agree on shared naming and structure kept losing out to feature shipping. AI hasn't created a new problem; it's exposed an old one and made it expensive.
Retrieval only works on structure. Retrieval-augmented generation (RAG) assumes a model can fetch the right document, but without organisation, labelling, and navigation, it just surfaces the "loudest" match — the one sharing the most surface words with the query — regardless of whether it's accurate or current.
Structure tells a model what something is. A price, a policy note, and an outdated draft can read as similar text strings. Without metadata, taxonomy, and controlled vocabularies (so "cancelled," "canceled," and "closed" aren't treated as unrelated concepts), a model has no way to rank authoritative content above speculative or expired content.
Ambiguity used to be absorbed by humans — now it's amplified. People quietly correct a vague label and move on; a model instead reproduces that same ambiguity confidently, at scale, for every person who asks the same question.
Agents raise the stakes from wrong answers to wrong actions. Once a system moves from retrieving information to acting on it (routing tickets, updating records, approving requests), it needs a structural understanding of relationships and permissions — what it's allowed to touch. The piece cites the Moffatt v. Air Canada case, where a chatbot gave bereavement-fare advice that contradicted the airline's own policy page, and a tribunal held Air Canada liable — illustrating what happens when contradictory content isn't reconciled.
This is why IA finally gets funded. Framed as "fewer confused users," IA never won budget. Framed as retrieval accuracy, hallucination rate, or agent reliability, it now maps directly onto AI spend executives already track — the author notes enterprises spent $37 billion on generative AI in 2025, up from $11.5 billion the year before, per Menlo Ventures.
Practical prescription: before buying another model, audit what your AI retrieves from; trace wrong answers back to their source content; type and tag content by currency and authority before indexing; fix taxonomy rather than patching prompts; and give agents explicit permission structures.
Closing line of argument: most AI failures aren't model failures — they're IA failures wearing an AI costume, and the fix is the same toolkit the discipline has always had, now finally worth funding.

---

> **Why this matters:** Useful when being asked what skills are needed in AI era, especially RAG related. Organising and labelling the information properly is needed for RAG to function and surface the most relevant content instead of noisy and outdated info.