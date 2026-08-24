---
title: Guidelines for Human-AI Interaction Design
source: Microsoft Research Blog (https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/)
type: article
topic: design
tags: [job-application]
projects: [leapspace-interview-prep]
date: 2026-08-09
author: 
---
# Human-AI Interaction Design Guidelines

## INITIALLY

### 01 Make clear what the system can do.
Help the user understand what the AI system is capable of doing.

### 02 Make clear how well the system can do what it can do.
Help the user understand how often the AI system may make mistakes.

## DURING INTERACTION

### 03 Time services based on context.
Time when to act or interrupt based on the user's current task and environment.

### 04 Show contextually relevant information.
Display information relevant to the user's current task and environment.

### 05 Match relevant social norms.
Ensure the experience is delivered in a way that users would expect, given their social and cultural context.

### 06 Mitigate social biases.
Ensure the AI system's language and behaviors do not reinforce undesirable and unfair stereotypes and biases.

## WHEN WRONG

### 07 Support efficient invocation.
Make it easy to invoke or request the AI system's services when needed.

### 08 Support efficient dismissal.
Make it easy to dismiss or ignore undesired AI system services.

### 09 Support efficient correction.
Make it easy to edit, refine, or recover when the AI system is wrong.

### 10 Scope services when in doubt.
Engage in disambiguation or gracefully degrade the AI system's services when uncertain about a user's goals.

### 11 Make clear why the system did what it did.
Enable the user to access an explanation of why the AI system behaved as it did.

## OVER TIME

### 12 Remember recent interactions.
Maintain short-term memory and allow the user to make efficient references to that memory.

### 13 Learn from user behavior.
Personalize the user's experience by learning from their actions over time.

### 14 Update and adapt cautiously.
Limit disruptive changes when updating and adapting the AI system's behaviors.

### 15 Encourage granular feedback.
Enable the user to provide feedback indicating their preferences during regular interaction with the AI system.

### 16 Convey the consequences of user actions.
Immediately update or convey how user actions will impact future behaviors of the AI system.

### 17 Provide global controls.
Allow the user to globally customize what the AI system monitors and how it behaves.

### 18 Notify users about changes.
Inform the user when the AI system adds or updates its capabilities.

> **Why this matters:** As a PM designing AI features, these 18 principles form a structured framework for decision-making. They cover the full lifecycle: what users should know upfront (initially), how to behave during normal use (during), how to handle failures gracefully (when wrong), and how to build trust over time (over time). This is directly applicable to `research_goal()` UX design — especially guidelines 02 (communicate accuracy), 07-09 (error handling), and 11 (transparency about why it made decisions).
