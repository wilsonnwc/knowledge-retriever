---
title: Error Recovery Patterns — Take It Into Your Own Product
source: AI UX Design Guide
url: https://www.aiuxdesign.guide/patterns/error-recovery
type: article
topic: design
tags: [foundational-knowledge, job-application]
projects: [leapspace-interview-prep]
date: 2026-08-09
---

# Take it into your own product

### 1. Every error needs an exit, not just an apology.

"'Something went wrong' is where bad UIs stop." The genuine value lies in offering actionable next steps—whether that's retrying with modifications, switching approaches, using partial results, or escalating to human support. Messages without viable paths leave users stranded.

### 2. Degrade, don't collapse.

When optimal solutions aren't available, provide the next-best alternative: previously cached data, a simpler model, or a partial answer with clear gaps noted. This approach delivers honest partial value rather than complete failure, provided you don't misrepresent it as complete.

### 3. Say what happened in the user's terms.

"A stack trace or 'Error 500' just transfers your problem to the user." Describe issues using language users understand, with context about causation when feasible. Reserve technical specifics for internal logs rather than end-user interfaces.

### 4. Make 'try again' actually different.

Retrying identical inputs reproduces identical failures. Either modify the request fundamentally or guide users toward what needs changing. A retry button that repeats the same failure functions as a false solution.

### 5. Catch the error, don't swallow it.

Softening language around unresolved failures obscures problems from monitoring systems—users remain stuck while you lose visibility. Surface the authentic issue to your observability infrastructure while providing graceful user-facing recovery.

> **Why this matters:** These 5 principles directly inform your `research_goal()` failure handling design. When research_goal() fails (no notes available, network issue, goal too broad), you need: (1) an actionable exit path, not just "error occurred," (2) graceful degradation (e.g., suggest online resources), (3) plain-language explanation of what broke, (4) real recovery steps—not just a retry button that repeats the same failure, (5) honest error surfacing to your monitoring while showing grace to the user. This is the PM-level UX discipline, independent of technical implementation.
