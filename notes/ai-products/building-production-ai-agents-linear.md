---
type: podcast
source: "Building production AI agents — Nan Yu & Jacob Shumway from Linear"
date: 2026-08-10
tags: [revisit, job-application]
projects: [leapspace-interview-prep]
---

Foundational insights on building AI agents that work in production, from Linear's experience shipping agent workflows.

## How Agents Work

At a high level, an AI agent operates by looping question-and-answer cycles with an LLM. It continuously utilizes tools to gather context autonomously until it considers a predefined goal or milestone accomplished.

## Architecture Principles

**Skills-based architecture over context overload:** Giving an agent access to every possible API action at once causes context overload and hallucinations. A more effective architecture gives the agent the ability to dynamically load only the specific "skills" (and their associated sub-prompts/tools) it needs for a given request.

**Minimalist prompting:** Over-prompting an agent or giving it highly rigid instructions often degrades its performance by causing it to overfit. Give the agent minimalistic instructions and focus on providing it with the tools to fetch its own context.

## Building & Prototyping

**Prototype internally to discover emergent behavior:** Linear began with a basic, hacky internal prototype. Deploying it organically revealed unexpected usage patterns—like users simply tagging the bot in an active Slack thread and telling it to "do the right thing" rather than giving it explicit commands.

**Native agents enable opinionated product design:** Building an agent directly into your own app—instead of just building general API integrations for outside bots—allows you to bake in your company's specific product philosophies and maintain a tighter standard of quality.

## Human-AI Collaboration

**Keep humans in the loop for accountability:** Most autonomous agent actions should ultimately be tied to a human user. When Linear's agent creates an issue or writes code, it goes into a developer's personal backlog to ensure tasks are tracked, reviewed, and not lost.

## Model & Evaluation Strategy

**Start with the largest models, then optimize:** A recommended practice is to start prototyping with the smartest, largest models to prove the concept works and to build your success criteria. Once you have a reliable evaluation framework, you can swap in smaller, cheaper models.

**Balance objective and subjective evaluations:** Linear evaluates its agent using both deterministic checks (e.g., verifying a specific status was applied) and "LLM-as-a-judge" subjective scoring. However, they use subjective checks sparingly because an agent's varied responses can easily trigger false failure signals.

## User Experience & Integration

**Meet users at their natural work entry points:** While having a dedicated chatbot UI is helpful for follow-ups, the most powerful interactions happen natively where the work actually takes place—like inside a Slack thread, a meeting debrief, or a project spec document.

**The future is proactive long-term memory:** The next evolution for enterprise agents is moving from single-turn tasks to long-running memory. Agents will eventually oversee months-long projects, proactively coordinate between team members, and keep documentation up to date automatically.

---

> **Why this matters:** You haven't built any agentic workflows yet. This piece captures the core patterns and tradeoffs that experienced teams have discovered in production—architecture choices (skills vs. context), prototyping discipline (learn from real usage, not design docs), human oversight (accountability), and evaluation rigor. Revisit this when you design your own agent workflows to avoid the patterns that fail in production.
