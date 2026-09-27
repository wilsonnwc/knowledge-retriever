---
type: article
title: You Are Not a Model — Don't Price Per Token
author: a16z
source: https://www.a16z.news/p/you-are-not-a-model-dont-price-per
date: 2026-08-28
tags: [revisit, job-application]
projects: [leapspace-interview-prep]
---

High-level summary only — saved as a starting position on AI pricing, not as deep expertise.

## Core thesis

Price at the **highest layer of value you can reliably measure, attribute, and defend.**

If you are an application company, that layer is almost never tokens. Tokens are the model provider's unit, not yours. Passing that unit through to your customer means charging for your supplier's input rather than for your own output.

## The three-layer pricing framework

The article's most reusable idea — a ladder, where you climb as high as your ability to measure and defend allows:

1. **Layer 1 — Model access:** price per token. Appropriate only if you *are* the model provider selling raw inference.
2. **Layer 2 — Application work:** price recognisable units of work via credits — an account brief, a code implementation, a completed query.
3. **Layer 3 — Business outcomes:** price the result itself — a resolved support conversation, a qualified lead, a booked meeting. Only viable when the outcome is *cleanly attributable* to you.

## Why per-token pricing fails for applications

- **False comparability.** Different applications wrap different models, data, and tools. A token through one product does not do the same work as a token through another, so the unit invites a comparison that is not meaningful.
- **Forecasting burden shifts to the customer.** To budget, a buyer must predict context length, retrieval volume, retries, and reasoning time — separately, per product. Leadership finds it far easier to estimate *volume of work* ("roughly 500 briefs a month") than volume of tokens.
- **Margin erosion hidden by revenue growth.** If each new dollar of revenue is immediately paid back out to model, cloud, and data providers, top-line growth can look healthy while the underlying economics stay weak.
- **Misaligned value signal.** Token cost keeps falling. Anchoring your price to a declining unit means your pricing drifts away from the value you deliver, in the wrong direction.

## The separation principle

Keep two questions apart, and answer them independently:

- **What is the work worth?** → customer value, willingness to pay. This sets the price.
- **What does the work cost to deliver?** → relative cost and complexity. This sets the margin.

Collapsing these two into one meter is what token pricing does. Separating them lets the vendor keep the upside from model routing, caching, and infrastructure improvements, instead of automatically handing every efficiency gain back to the customer as a lower bill.

Related: **transparency does not require the billing meter and the cost meter to be the same.** Being clear about what a customer is buying is not the same as exposing your own cost structure as the price.

## The legibility test

> If customers cannot understand the credit system in a few sentences, it is too complicated.

A useful, cheap heuristic — a pricing model is also a communication artifact, not just a finance one.

## Worked example — Clay

Clay's 2026 model deliberately splits the layers rather than using one blended unit:

- **Data credits** for third-party data (a fixed, known cost)
- **Actions** for orchestration work (fixed value delivered)
- **Token pass-through, at no markup**, only for the volatile reasoning-model portion

Notably, the company has publicly acknowledged mispricing credits in its Pro segment back in 2022 and running that segment at a loss for years before restructuring — evidence that getting this wrong is both common and slow to surface.

## Supporting data point

In a survey of 50 technical buyers, 27 preferred credits tied to recognisable work versus 14 preferring tokens. Small sample, directional only — but it points the same way as the argument.

## What I'd actually say if asked

"Tokens are the model provider's unit of value, not the application's. If you price in tokens you inherit someone else's cost curve, you hand the customer a forecasting problem they can't solve, and you tie your revenue to a unit that's getting cheaper every year. The better move is to price the smallest unit of *work* your customer recognises — and only go all the way to outcome-based pricing if you can genuinely attribute the outcome to your product."

---

> **Why this matters:** I have no background in AI pricing, and it comes up in AI PM roles as a commercial-fluency question. This gives me a defensible high-level position and a concrete example (Clay) without pretending to depth I don't have. The three-layer ladder and the separation principle are the two bits worth remembering cold.
