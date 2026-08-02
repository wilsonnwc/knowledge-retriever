---
name: leapspace-job-ad
description: Senior Product Manager, Knowledge Management & AI at LeapSpace (Elsevier) — reference for project context and interview narrative
metadata:
  type: reference
---

# LeapSpace Job: Senior PM, Knowledge Management & AI

**Role:** Senior Product Manager, Knowledge Management & AI at LeapSpace  
**Company:** LeapSpace (part of Elsevier)  
**Location:** London or Amsterdam (hybrid)  
**Key Requirements:**
- 8+ years product management experience
- **Hands-on experience with AI/ML products, especially generative AI, RAG, or agentic workflows** (central to role)
- Demonstrated delivery leadership with squads
- Comfortable with data science and evaluation
- User of knowledge management tools (Zotero, Obsidian, Notion, Mendeley, etc.)
- Strong customer discovery instincts

---

## Why This Matters for This Project

The job is building an **AI-assisted research workspace** where researchers organize and reason over their own knowledge base. The core problems this project directly addresses:

**From the job ad:**
- "Researchers should spend less time wrangling information and more time thinking"
- "The product's memory of a researcher's projects, the personalisation around it, and how AI reasons over the knowledge researchers bring with them"
- "A living knowledge base that the AI builds and maintains with the researcher: structured, current, and grown from every project, source, and finding they work through"
- "Make LeapSpace reason across that personal knowledge as well as the wider scientific corpus"
- "Partner with the team that owns core retrieval on how the AI reasons across a researcher's knowledge"

**Exact mapping to this knowledge-retriever project:**
1. **Knowledge base organization** — how to structure researcher knowledge (this project's taxonomy, consolidation vs. fragmentation)
2. **RAG retrieval strategy** — how to organize files so AI can reason over them (the consolidation + chunking tradeoff we just hit)
3. **Semantic search and chunking** — "how LeapSpace reads the documents" (the semantic-search-chunking-plan we documented)
4. **Evaluation of AI reasoning** — "Work with embedded data scientists to evaluate response accuracy, relevance, and trust" (the exact retrieval quality issue we discovered in testing)
5. **Personal knowledge management UX** — how users interact with their saved knowledge (we're doing this firsthand)

---

## The Retrieval Problem We Hit (Directly Relevant)

**What happened:** We consolidated 14 fragmented files into one coherent Design of Everyday Things file to preserve narrative and citeability — good for humans, bad for AI retrieval.

**Why it matters for this role:** This is the exact tension LeapSpace will face at scale. Researchers want their knowledge organized coherently (one research project space, one author's complete work), but the AI needs to be able to reason over it precisely. This is the "parent-child chunking" / "citation unit vs. retrieval unit" problem.

**What we're doing about it:** Fixing the retrieval pipeline to handle consolidated files properly, which involves:
1. Increasing the preview window beyond first 15 lines
2. Implementing smart truncation at section boundaries (respecting `##` headers)
3. Evaluating whether retrieval quality improves
4. Documenting the tradeoff and resolution

**Interview angle:** "I built a personal knowledge base with the same constraints LeapSpace faces — how to organize knowledge for human coherence and AI reasoning simultaneously. I hit the retrieval problem firsthand, diagnosed why it was happening (naive preview truncation), and fixed it with section-aware chunking. That experience taught me the real-world complexity of 'how the AI reasons across a researcher's knowledge' beyond the theory."

---

## Key Concepts to Demonstrate in Interview

Based on this job ad, this knowledge-retriever project demonstrates:

- **RAG from first principles** — built a working retrieval system, identified a real failure mode, fixed it
- **Chunking strategy** — understands the tradeoff between citation coherence and retrieval precision
- **Semantic search readiness** — planned for future embeddings by enforcing section discipline today
- **Knowledge organization UX** — lived with a real taxonomy, tagging, and metadata discipline
- **Evaluation discipline** — tested the system, found it broken, didn't ship it
- **Cross-disciplinary reasoning** — can talk about both human UX (researchers organizing knowledge) and technical constraints (embeddings, chunking, retrieval)

---

## Reference: Job Ad Full Text

[Job ad saved 2026-08-02]

**About the Role (key excerpt):**
> This is a strategy-first role, but a pragmatic one. Researchers don't start from a blank page. They come with papers they've saved, drafts they've written, and questions they've chased for months. Your job is to make LeapSpace reason across that personal knowledge as well as the wider scientific corpus, and to turn today's scattered features into one experience that gets more useful the longer someone uses it.

> The destination is ambitious. Think of a living knowledge base that the AI builds and maintains with the researcher: structured, current, and grown from every project, source, and finding they work through. From there the work points toward goal-oriented research, where a researcher states what they are trying to achieve and LeapSpace runs iterative research loops against that goal, drawing on everything it already knows about their work.

**Requirements (AI/ML focus):**
> Experience with AI/ML products, especially generative AI, RAG, or agentic workflows. This is central to the role.

> Work with embedded data scientists to evaluate response accuracy, relevance, and trust. Commission the evaluations, read the results, and turn them into prioritised improvements.

> Comfortable reasoning about architecture and technical trade-offs with a cross-disciplinary team, without writing production code. Hands-on prototyping with AI coding tools is a plus, not a requirement. It's something you'll grow into here.
