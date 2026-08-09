# Research-Goal Feature Spec — Implementation Requirements

Refined based on Session 18 testing (Goal 1). These are the features to build, with specific PM-level requirements.

---

## Feature 1: Upfront Expectation-Setting Prompt (Item 01)

**Trigger:** First time `--research-goal` is called, before anything else.

**Content to display:**
```
This tool searches YOUR NOTES (not the web) for gaps against a goal you define.

How it works:
1. You describe a goal or question
2. I refine it with you to make sure I understand your focus
3. I search your notes across multiple rounds, narrowing the gaps each time
4. You see what's already covered in your notes and what's still missing

Type your goal below and press Enter:
```

**Why this matters:** User should know this isn't a web search and shouldn't expect answers beyond what's in their notes.

---

## Feature 2: Process Flow Explanation (Items 02 + clarified)

**Trigger:** After user enters their initial goal, before goal-scoping loop starts.

**Required content:**

### 2a. Explain "Refine Goal" 
```
Before I search, let me make sure I understand your goal.
You typed: "[original goal]"

My thought: [Claude's assessment]
Suggestion: "[narrower framing]"

Does this narrower framing work for you?
- y = Yes, use this
- n = No, keep my original goal and start searching
- Or type your own refined version to keep narrowing
```

**Why this matters:** User sees Claude's proposal BEFORE execution, understands the reasoning, and has explicit control.

---

### 2b. Explain "Search Up to 3 Rounds"
After goal is locked (user confirms), before Round 1 starts:

```
Now I'll search your notes up to 3 times. Here's how it works:

ROUND 1: Search for items that match your goal
→ Show you what I found (covered items) and what's missing (open gaps)

ROUND 2: Search specifically for the gaps from Round 1
→ Update coverage. If I find new items, keep going. If not, stop early.

ROUND 3 (if needed): Final pass on remaining gaps
→ Compile final results

Why multiple rounds? Each round helps me narrow my search based on what's already covered, so I don't miss relevant notes by casting too wide a net the first time.

Estimated time: 1-2 minutes. Let's go.
```

**Why this matters:** User understands the strategy (iterative narrowing) and why it exists (avoid false negatives).

---

### 2c. Show Query Terms Used Per Round (NEW requirement from testing)
On each round output, add this line BEFORE the gap counts:

```
Round 1: Searching for: [query terms used]
  └─ Retrieved: 1 note section
  └─ Coverage: 8/15 (7 gaps remain)
```

**Example:**
```
Round 2: Searching for gaps like: "communication breakdown", "misalignment patterns", "stakeholder conflict", "unclear expectations"
  └─ Retrieved: 7 note sections
  └─ Coverage: 8/15 (no new items covered this round)
  └─ Stopping early (diminishing returns)
```

**Why this matters:** User sees the search strategy, builds trust that we're looking for the right things, understands why certain notes weren't found.

---

## Feature 3: Make Fallback Notification Explicit (Item 07)

**Current:** "No new items covered this round — stopping early."

**Revised:**
```
⚠️ Round 2 found zero new items. Stopping here.
Why? Searching further would hit diminishing returns—your notes likely don't cover these gaps.
What this means: The 7 remaining gaps probably need external sources (books, articles, interviews) or aren't addressed in your current notes.
```

**Why this matters:** User understands fallback is intentional design (not a failure) and what it signals about their notes.

---

## Feature 4: Follow-Up Prompts (Items 13-14)

**Trigger:** After final summary is printed.

**UI (CLI):**
```
What would you like to do next?

1. Research a new goal
2. Modify this goal and re-search
3. Search online for these gaps (external resources)
q. Quit

Enter your choice:
```

**Behavior:**
- `1` → Clear state, ask for new goal (restart flow)
- `2` → Ask "How would you like to refine this goal?" (modify + re-run)
- `3` → Print: "Try searching: [top 3 open gaps] on Google, books, or articles in your field"
- `q` → Exit cleanly

**Why this matters:** User can act immediately based on results instead of manually restarting the tool.

---

## Feature 5: Step Timing Display (Item 05)

**Current:** Timing calculated but not shown.

**Add to each round output:**
```
Round 1 [completed in 2.3s]: searched 1 query, retrieved 1 note section(s) -> 8/15 covered, 7 still open
```

**Why this matters:** User sees the tool is responsive (not hanging), builds confidence in real-time feedback.

---

## Summary: What's Missing vs. What's Working

**✅ Already working (keep as-is):**
- Streaming updates on each round
- Accurate coverage counts
- Correct source citations
- Goal-scoping loop with Claude's proposals

**❌ Need to build (in priority order):**
1. Upfront expectation-setting prompt
2. Process flow explanation (including "why multiple rounds")
3. Query terms display per round (new requirement from testing)
4. Explicit fallback notification
5. Follow-up prompts (New goal / Modify goal / Online search)
6. Step timing display

---

## Implementation Notes

- All text should match Claude/ChatGPT tone (conversational, not technical spec)
- Use `\n` liberally between sections for readability
- Timing info (`[completed in X.Xs]`) should be added to the main output lines, not separate
- Follow-up prompts should be **interactive CLI prompts** (now), later become **clickable buttons** in lightweight UI
