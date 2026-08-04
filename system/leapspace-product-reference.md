---
name: leapspace-product-reference
description: Summary of LeapSpace product demo videos (Elsevier) — actual product capabilities, for comparison against this project and interview prep
metadata:
  type: reference
---

# LeapSpace Product Reference (from Elsevier demo videos, watched 2026-08-03)

Source: two YouTube demo videos posted by Elsevier — "LeapSpace Demo Video" (overview) and "LeapSpace End-to-End Demo" (full workflow walkthrough).

## Video 1: Overview

LeapSpace = "research-grade AI workspace" supporting R&D professionals from discovery through impact.

- **AI-Assisted Exploration** — verifiable, grounded responses across peer-reviewed content from multiple publishers. System automatically decides whether to analyze abstracts, full text, or both.
- **Deep Research** — scans hundreds of sources, produces a report highlighting patterns, contradictions, and gaps in evidence.
- **Trust Cards** — every AI insight is backed by a card showing sources, confidence level, and risks for deeper analysis.
- **Compare & Reading Assistant** — rapid comparison of evidence across papers.
- **Author Search** — surfaces leading researchers and citation metrics for collaboration.
- **Summarization & Export** — findings compiled into a shareable document.
- **Data & Privacy** — combines Scopus abstracts + ScienceDirect full text. Users can upload up to 5 of their own PDFs per conversation. Prompts/uploads are private, not used for model training.

## Video 2: End-to-End Workflow

1. **Search and Setup** — natural conversational interface; users can ground the AI with uploaded files or resume past searches; "Temporary Conversation" toggle for sensitive/exploratory queries that shouldn't be saved. LeapSpace shows the exact steps it took to generate a response.

2. **Evidence Comparison ("Explore as a Table")** — turns cited references into a structured grid: one row per paper, AI-extracted key evidence as columns. Users can add columns, refine dimensions, search across papers for specific findings.

3. **Verification Tools**
   - **Trust Cards** — clicking a citation shows bibliographic details + a card labeling the citation's relationship to the AI's claim (Supporting / Contradicting / Neutral), with the exact source passage as proof.
   - **Claim Radar** — checks a specific claim against up to 40 relevant sources drawn from 100M+ Scopus-indexed papers; categorizes broader evidence as supporting/contradicting/mixed, with a clickable evidence trail.

4. **Networking and Funding** — follow-up questions surface experts/collaborators (via Scopus publication data, clickable to see their past work) and relevant funding opportunities/organizations.

5. **Synthesis & Deep Research** — conversations can be pulled into a shareable structured report (executive summary, diagrams, citations). "Deep Research" mode: AI builds a research plan, executes searches across peer-reviewed literature, refines automatically, produces a detailed report (answers, study scopes, limitations, suggested next reads).

6. **The Writing Coach** — separate drafting workspace. Users paste drafts; AI contextualizes claims, checks argument logic, stress-tests evidence. Returns a structural assessment (well-supported / thin / gaps), pulls in peer-reviewed citations, offers sentence-level inline edits (accept/reject). **Draft Verification** — runs Claim Radar against the user's own draft, extracting claims and checking them against the wider literature before publishing.

---

## What This Confirms vs. Corrects About Our Prior Understanding

**Confirmed:**
- Retrieval spans both the wider scientific corpus (peer-reviewed literature via Scopus/ScienceDirect) **and** user-uploaded personal content (PDFs) — a multi-source retrieval problem, as assumed.
- Trust/verifiability is a first-class product concern, not an afterthought — Trust Cards and Claim Radar exist specifically to show *why* the AI said something and let a researcher check it. This is retrieval-quality-as-product-feature, directly resonant with this project's evaluation work.

> **Plain-English restatement:** "Multi-source retrieval" just means the AI has to search two different piles at once — the huge public pile (published papers) and the researcher's own small private pile (their uploaded PDFs) — and blend results from both sensibly. Trust Cards and Claim Radar are the product's way of showing its work, similar to how a good analyst doesn't just give you a conclusion, they hand you the underlying spreadsheet so you can check the math yourself.

**New/sharper than what we'd previously assumed:**
- The demoed product does **not** show a persistent, evolving personal knowledge base UI (notes, tags, taxonomy) the way the job ad's "living knowledge base... grown from every project, source, and finding" implies as the *future* direction. Today's product looks more like: ground a conversation with a handful of uploaded PDFs (max 5) + search the wider corpus — not an ongoing Notion/Obsidian-style personal knowledge repository yet.
- **This means the job ad's "living knowledge base" and "personal knowledge that grows over every project" is describing where the product is headed, not what's shipped today.** The gap between the demoed product (session-scoped uploads) and the job ad's ambition (persistent, structured, self-maintaining knowledge base) *is* the PM problem this role is hired to close.
- Claim-level verification (Trust Cards, Claim Radar) is a retrieval-adjacent feature this project doesn't currently attempt — worth naming as "beyond our current scope" rather than silently ignoring it, if it comes up in interview.
- No explicit mention of Notion/Obsidian integration in the demos — those tools are referenced in the job ad only as tools *researchers already use* (a requirement that the PM be a user of these), not as confirmed integration targets. Worth treating "search across Notion/Obsidian" as an inferred future direction, not a confirmed current or planned feature.

> **Analogy:** It's the difference between a company's current storefront and its five-year vision slide. Today's demoed product is the storefront: upload up to 5 PDFs per conversation, search the literature, done — nothing persists once the session ends. The job ad's "living knowledge base" language is the vision slide: a knowledge base that keeps growing and updating itself across every project a researcher ever works on. The distance between those two is exactly what this PM role is hired to close — that gap is the job, not a flaw in the product.

> **Why this matters for interviews:** Being able to say "here's what's actually shipped vs. what the ad describes as the ambition, and here's the gap between them" is a stronger interview answer than assuming the demo already does everything the ad promises — it shows you read primary sources critically instead of taking marketing copy at face value.
