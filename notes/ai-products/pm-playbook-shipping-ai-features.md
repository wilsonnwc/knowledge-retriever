---
type: article
source: "PM Playbook for Shipping AI Features — O'Reilly Radar"
url: "https://www.oreilly.com/radar/the-pms-playbook-for-shipping-ai-features-that-actually-work-in-production/"
date: 2026-06-21
tags: [foundational-knowledge, revisit, job-application]
projects: [leapspace-interview-prep]
---

Common problems:
* latency
* hallucinating on edge cases
* Difficulty in AB test 
* Failure cases

Latency:
* Define latency budget by interaction type:
    * Synchronous interactions: user staring at a spinner: need to resolve under 1 second
    * Progresive interactions: output streams token by token: first token in under 500 milliseconds and full response under 5 seconds
    * Asynchronous interactions: user keeps doing other stuff: take up to 20 seconds with progress indicator
* Do not only look at optimising the inference time but ignore the pipeline
    * Inference = time AI model takes to generate a response
    * Full pipeline =
        * Input preprocessing — tokenisation, assembling context, constructing the prompt
        * Model inference — the AI generating the output
        * Output postprocessing — parsing, formatting, safety filtering
        * Response delivery — getting it back to the user

Design fallbacks:
* AI features fail in novel, unpredictable, and occasionally creative ways
* Fallbacks to design as a hierarchy:
    * Model fallback: drop to a simpler and reliable model
    * Cache fallback: serve a cached response
    * Template fallback: when generation fails, fall back to prewritten templates
    * Graceful omission: not show the AI feature rather than a broken one

Quality measurement:
* four-layer quality pyramid:
* 1st: Safety - output has no harmful content, PII (measure with automated classifiers)
* 2nd: factual correctness: domain specific eval suites (eg. grammar for writing tool)
* 3rd: usefulness: acceptance rate, time to task completion, repeat usage
* 4th: delight (hardest to measure)

A/B testing AI features:
* same user doing same thing twice might get different outputs
* intratreatment variance
    * in traditional A/B tests, if you show 1,000 users a new green button (the treatment), every one of those users sees exactly the same green button. The experience within the treatment group is identical — zero variance. The only variance you observe is in how different users respond to it.
    * With an AI feature, the same 1,000 users in the treatment group might each get a subtly different AI-generated response, even if they submitted the same query. Because the model is nondeterministic, it produces varying outputs. So now you have two sources of variance:
        * Differences between users (as in traditional tests)
        * Differences in the AI outputs those users received (the intratreatment variance — variation within the treatment group itself)
* metric selection problem
    * a chatbot generating entertaining but factually wrong responses might show amazing engagement numbers while actively misleading users. You have to measure engagement and quality together. 

Model drift monitoring
* Third-party APIs change without your consent
* The fix: Pin your model versions so updates happen on your schedule, after your testing.
* At minimum you need daily automated quality evaluations on 1% to 5% of production traffic, weekly analysis of input distribution characteristics, and monthly human evaluation of 100 to 500 examples.

Evaluation frameworks:
* Automated evaluation gives you speed. Build a golden dataset of 500 to 2,000 labeled examples (what good looks like), train a classifier (machine learning model trained to make a judgement call) or use a capable model as judge, and validate against human judgment quarterly targeting 85% agreement.
* Human evaluation: Structure it with five to seven evaluators mixing domain experts and representative users. Use a consistent rubric covering accuracy, helpfulness, tone, completeness, and safety. Run weekly during development, monthly in production

Graceful degradation
* Graceful degradation means when capabilities decrease, the experience gets worse smoothly instead of falling off a cliff. 
* Make degradation invisible when possible. Users shouldn't see a "broken" experience. They see a less detailed one. That's a huge difference psychologically. However, when the degradation is significant enough that users will notice, proactive communication like "AI suggestions are temporarily limited" builds trust infinitely more than silently pushing poor-quality outputs.

Prompt engineering
* When you interact with an AI model, you don't just hand it raw user input. You construct a carefully crafted piece of text — the prompt — that frames the task, provides context, sets expectations, and guides the model towards the kind of output you want. Prompt engineering is the discipline of designing, testing, and refining these prompts systematically.
    * Example: The raw user message might be: "My order hasn't arrived.". You wouldn't just pass that bare sentence to the model. A prompt engineer would wrap it in something like: "You are a helpful, professional customer support assistant for [Company]. Always respond in a calm, empathetic tone. Never make promises about refunds without directing the user to the returns policy. Here is the user's message: 'My order hasn't arrived.'"
* In production, prompts are code, and they need version control, testing, monitoring, and maintenance. Version controls every prompt. Parameterize prompts, don't hardcode context. Production prompts should be templates with clearly defined injection points for user context, system state, and dynamic instructions. This makes them testable because you can inject known inputs and verify outputs, and it makes them maintainable because changing how you handle context shouldn't require rewriting the entire prompt from scratch.

---

> **Why this matters:** This article contains key things an AI PM should know — good to read so that I can answer basic questions if an interview comes up.