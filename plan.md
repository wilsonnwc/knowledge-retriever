# Personal Knowledge Retriever
*A context architecture learning project*

---

## What you're building

A personal AI assistant you can have a conversation with:

> *"What have I saved about decision-making?"*
> *"Find me quotes relevant to building AI products."*
> *"What do I actually think about context architecture?"*

It searches your own notes, highlights, and insights — and responds like a thinking partner who has read everything you've ever saved.

---

## Why this teaches context architecture

Every design decision in this project maps directly to the article you just read:

| What you'll do | Concept from the article |
|---|---|
| Design your folder structure | Structuring context — hierarchy and categorisation |
| Write a consistent note template | Labeling — aligning system language to user language |
| Define which tags are allowed | Controlled vocabulary and findability |
| Write the system prompt | Context architecture — skills, rules, memory |
| Diagnose retrieval failures | How context quality shapes AI output |

You are not just building a tool. You are practising context architecture hands-on.

---

## Tools you need

| Tool | Why | How to get it |
|---|---|---|
| **VS Code** | Editor, terminal, and Copilot Chat in one place | Already installed |
| **GitHub Copilot** | Writes all the code for you | Already active |
| **Python** | Runs the scripts | Open a terminal in VS Code, type `python --version`. If you see a version number, you're good. If not, go to python.org and install. |
| **Anthropic API key** | Powers the AI responses | Go to console.anthropic.com → create account → API Keys → create one. Add ~$5 credit. Keep the key safe. |

---

## Project structure

When complete, the project looks like this:

```
knowledge-retriever/
├── notes/                    ← your knowledge base (markdown files)
│   ├── ai-systems/
│   ├── mental-models/
│   └── ... (you'll design this)
├── scripts/
│   └── chat.py               ← the conversation interface
├── prompts/
│   └── system.txt            ← the agent's instructions
├── system/
│   └── session-log.md        ← progress log and session learnings
├── .env                      ← your API key (never share this)
├── .gitignore
└── requirements.txt
```

Build this step by step. Don't create it all upfront.

---

## Phase 0 — Design your structure (before any code)

This is the most important phase. Pure context architecture work — no code, no setup, just thinking.

### Step 0.1 — Design your taxonomy

Your taxonomy is the folder structure that organises your notes. It is your controlled vocabulary. It directly determines retrieval quality.

**Bad taxonomy** (too many, too narrow — becomes unusable):
```
ai-agents/
ai-context-windows/
ai-rag-systems/
ai-prompts/
```

**Good taxonomy** (broad enough to stay durable):
```
ai-systems/
mental-models/
product-strategy/
communication/
learning/
design/
leadership/
behaviour-change/
```

**The rule:** When you add a note and it doesn't fit an existing folder, you must either fit it into an existing one or add a new folder to this list first. Never create ad-hoc folders on the fly. Inconsistency is what breaks retrieval — this is the core lesson of the article.

Write your final taxonomy before moving to Step 0.2.

### Step 0.2 — Define your content types

Every note has a type. Types tell the system how to treat and present the content.

| Type | When to use |
|---|---|
| `quote` | Verbatim text from an external source |
| `insight` | Your own synthesis or conclusion |
| `note` | Raw observation, half-formed thought |
| `summary` | Condensed version of a source |
| `reference` | A pointer to something worth revisiting |

### Step 0.3 — Understand the note format

Every note is a markdown file with this structure:

```markdown
---
type: quote
source: "NN/g — Context Architecture"
date: 2026-06-16
tags: [ai-systems, information-architecture]
---

"Context is never neutral."

<!-- Why this matters: the framing idea of the whole article — naming and structure choices have consequences -->
```

The frontmatter (between `---`) is metadata. The `<!-- Why this matters -->` comment is the single most important field for retrieval quality — it captures your intention when you saved the item. Notes without it are harder to surface accurately.

---

## Phase 1 — Set up the project

### Step 1.1 — Create the project folder

Create a folder called `knowledge-retriever` on your computer (Documents or Desktop is fine). In VS Code: **File → Open Folder** → select it.

### Step 1.2 — Create your notes folders

Using the taxonomy you designed in Phase 0, create your topic subfolders inside a `notes/` folder. In VS Code: click the new folder icon in the left sidebar.

### Step 1.3 — Add your first notes manually

**Before writing any code**, add 5–10 notes by hand. This is important: you're designing the system around your actual content, not a hypothetical.

In VS Code, create a new file inside one of your topic folders. Name it descriptively (e.g. `context-is-never-neutral.md`). Use the format from Step 0.3.

**Starter notes to create, drawn from the article you just read:**

1. The "context is never neutral" quote → `notes/ai-systems/`
2. The labelling problem: `credential-recovery-workflow` vs `reset-password` → `notes/ai-systems/`
3. The distinction between context engineering (pipelines) and context architecture (structure, meaning, behaviour) → `notes/ai-systems/`
4. Your own reaction or takeaway from the article → `notes/ai-systems/`

### Step 1.4 — Set up Python

Open the terminal in VS Code (**Terminal → New Terminal**). Run:

```
pip install anthropic python-dotenv
```

Create a file called `requirements.txt` in the project root and paste into it:

```
anthropic
python-dotenv
```

### Step 1.5 — Store your API key

Create a file called `.env` in the project root:

```
ANTHROPIC_API_KEY=your-key-here
```

Create a file called `.gitignore` and add this line to it:

```
.env
```

This prevents your key from ever being accidentally shared if you push to GitHub.

---

## Phase 2 — Write the system prompt

No code here either. This is your second context architecture exercise. The system prompt is where you define:

- What content types the agent knows about
- What *skills* (modes of response) it can activate
- What it should never do

### Step 2.1 — Create the system prompt

Create the folder `prompts/`. Inside it, create `system.txt`. Paste this starter and edit it to match your actual taxonomy:

```
You are a personal knowledge assistant. You have access to a 
curated collection of notes, quotes, insights, summaries, and 
references the user has saved over time, organised by topic.

YOUR ROLE
You are a thinking partner, not a search engine. Surface 
relevant ideas, make connections the user hasn't seen, and 
help them think — don't just list items back at them.

CONTENT TYPES
- quote: verbatim text from an external source. Always cite 
  the source.
- insight: the user's own synthesis. Prioritise these when 
  the user asks what they think.
- note: raw, half-formed thoughts. Surface when the user is 
  exploring openly.
- summary: condensed source material.
- reference: pointers to things worth revisiting.

SKILLS
Select the right mode based on what the user is trying to do:

explore-topic
  User wants to think broadly about a subject. Retrieve 
  across all types. Surface connections.

find-quotes
  User wants verbatim lines from sources. Prioritise 
  type:quote only.

recall-my-thinking
  User wants their own notes and insights. Prioritise 
  type:insight and type:note.

compile-everything
  User wants all saved material on a topic assembled together. 
  Retrieve broadly. Group output by sub-theme.

connect-to-work
  User describes a current problem and wants relevant past 
  learnings applied to it. Use the work context they provide 
  to weight the response for this session.

RETRIEVAL RULES
- Strongly prefer items that have a "Why this matters" comment 
  — these were saved with intention and carry more signal.
- If fewer than 3 relevant items exist, say so clearly. Do 
  not pad with loosely related content.
- Never invent content not present in the retrieved notes.

OUTPUT FORMAT
- Lead with the most relevant item.
- Group by sub-theme when returning more than 4 items.
- Always include source and date for quotes.
- End with one connection or question the user might not 
  have considered.
- Keep the tone conversational, not list-heavy.
```

This prompt will evolve. Whenever retrieval surfaces the right notes but the response feels wrong, the fix lives here.

---

## Phase 3 — Build the chat script

This is where Copilot does the engineering. You describe what you want; it writes the code.

### Step 3.1 — Create scripts/chat.py

Create a folder called `scripts/`. Inside it, create a file called `chat.py`. Leave it empty for now.

Open Copilot Chat (**Ctrl+Shift+I** or the chat icon in the sidebar) and paste this prompt:

```
I'm building a personal knowledge retriever. I have markdown 
notes in a notes/ folder, organised in subfolders by topic. 
Each note has YAML frontmatter with: type, source, date, tags.
Notes may also contain an HTML comment "Why this matters: ..."

I need a Python script scripts/chat.py that:

1. Loads all markdown files from the notes/ folder recursively
2. Parses the frontmatter and plain text content of each file
3. Loads a system prompt from prompts/system.txt
4. Starts a terminal conversation loop
5. For each user message:
   a. Does a keyword search across note content, tags, and 
      source fields to find the most relevant notes (top 8)
   b. Formats those notes as context
   c. Sends system prompt + context + user message to 
      claude-sonnet-4-5 via the anthropic Python library
   d. Prints the response
   e. Maintains conversation history within the session
6. User types 'quit' to exit

The context block for each note should look like:
[{type}] {source} | {date} | tags: {tags}
{content}

Load the API key from .env using python-dotenv.
Keep the script simple — this is a personal tool.
```

Copilot will produce the script. Read through it before running it. If anything looks obviously wrong, paste it back with a question.

### Step 3.2 — Run it

In the terminal:

```
python scripts/chat.py
```

First question to ask it:

```
What have I saved about context architecture?
```

If it retrieves the right notes and gives a useful response — the system is working.

---

## Phase 4 — Seed your knowledge base

The system is only as good as what's in it. Before testing it seriously, you need 20–30 real items.

### Step 4.1 — Add notes from the article

Go back through the NN/g article and create notes for:
- Any quote you found striking
- Any framework or distinction you want to remember
- Your own reaction or questions it raised

Each one becomes a separate `.md` file in the right topic folder.

### Step 4.2 — Add notes from other sources

Look through:
- Your recent reading highlights (books, articles)
- Any notes app you use (Apple Notes, Notion, Obsidian)
- Saved links you remember clearly

Don't try to import everything at once. Start with the 20 things you most want to be able to retrieve.

### Step 4.3 — Run three test queries

Test each one and note what happens:

**Test 1 — Precise recall**
```
What did I save about the labelling problem in AI systems?
```
Expected: retrieves the specific note about `credential-recovery-workflow` vs `reset-password`. If it doesn't, your tags or content text may not match how you're querying.

**Test 2 — Fuzzy intent**
```
I'm thinking about how AI systems fail. What's relevant?
```
Expected: surfaces related items even without exact word matches. If it retrieves unrelated things, your "Why this matters" comments may need to be more specific.

**Test 3 — Your own thinking**
```
What do I actually think about context architecture?
```
Expected: the agent distinguishes your own notes (type:insight, type:note) from external sources (type:quote) and synthesises your perspective.

---

## Phase 5 — Upgrade to semantic search (optional)

The keyword search in Phase 3 works well for 20–50 notes. When your collection grows beyond that, semantic search (which finds relevance by meaning, not just matching words) becomes important.

Do this phase only after Phase 3 is working reliably.

### Step 5.1 — Install ChromaDB

Add `chromadb` to requirements.txt and run:

```
pip install chromadb
```

### Step 5.2 — Build the index

Open Copilot Chat and paste:

```
I have a personal knowledge retriever with markdown notes in 
a notes/ folder. I want to upgrade from keyword search to 
semantic search using ChromaDB.

Write a script scripts/index.py that:
1. Reads all markdown notes recursively from notes/
2. Creates a ChromaDB collection called "knowledge"
3. Adds each note as a document, with its frontmatter 
   as metadata
4. The text to index should combine: tags, content, and 
   the "Why this matters" comment if present
5. Uses the file path as the document ID
6. Skips notes already in the collection (for incremental 
   updates)
7. Prints progress as it goes

Use ChromaDB's default embedding function (no extra API needed).
```

Run it once with `python scripts/index.py` to build the initial index. Re-run it any time you add new notes.

### Step 5.3 — Update chat.py to use the index

Open Copilot Chat and paste:

```
Update my scripts/chat.py to use ChromaDB for retrieval instead 
of keyword search. Query the "knowledge" collection for the 
top 8 most similar documents for each user message. 
Everything else — system prompt loading, Claude API call, 
conversation history — stays the same.
```

---

## Phase 6 — Import your existing content

Once the system works well with your hand-crafted notes, bring in your existing content.

### Kindle highlights

Connect your Kindle via USB. Find `My Clippings.txt` in its documents folder.

**Copilot Chat prompt:**

```
Write a Python script scripts/import_kindle.py that:
1. Reads a Kindle My Clippings.txt file
2. Creates one markdown file per highlight in notes/reading/
3. Uses this frontmatter format:
   ---
   type: quote
   source: "{Book Title} — {Author}"
   date: {highlight date}
   tags: [reading]
   ---
   {highlight text}
4. Skips entries marked "Your Bookmark"
5. Names files as slugs from the first 6 words of the highlight
```

### Apple Notes

In the Notes app on Mac: select all notes → **File → Export as HTML**. You'll get a folder of HTML files.

**Copilot Chat prompt:**

```
Write a Python script scripts/import_apple_notes.py that:
1. Reads a folder of HTML files exported from Apple Notes
2. Creates one markdown file per note in notes/imported/
3. Uses this frontmatter format:
   ---
   type: note
   source: "Apple Notes"
   date: {today's date}
   tags: []
   ---
   {plain text content}
4. Names files as slugs from the note title
```

### Instapaper highlights

In Instapaper: go to **Settings → Export** and download your export. You'll get an HTML file containing all your saved articles and any highlights you made.

**Copilot Chat prompt:**

```
Write a Python script scripts/import_instapaper.py that:
1. Reads an Instapaper export HTML file
2. Parses each saved article entry
3. Creates one markdown file per item in notes/reading/
4. Uses this frontmatter format:
   ---
   type: reference
   source: "{Article Title} — {URL}"
   date: {date saved}
   tags: [reading, instapaper]
   ---
   {highlight text or article description if present}
5. If the item has a highlight/note attached, set type to
   "quote" instead of "reference" and use the highlight 
   as the content
6. Names files as slugs from the first 6 words of the title
```

After any bulk import, run `python scripts/index.py` to re-index everything.

---

## Diagnosing failures

When something goes wrong, the problem is almost always in the context — not the code.

| Symptom | Likely cause | Fix |
|---|---|---|
| Wrong notes retrieved | Tags don't match your query language | Update the tags on those notes |
| Relevant notes missing | Content too sparse, no "Why this matters" | Add the comment to those notes |
| Right notes, weak response | System prompt skill doesn't match intent | Refine that skill description in system.txt |
| Response invents content | System prompt doesn't explicitly forbid it | Add a clear prohibition |
| Nothing retrieved at all | Index out of date | Re-run index.py |

---

## Ongoing workflow

| Task | When |
|---|---|
| Add a note | Whenever you read something worth keeping |
| Run `python scripts/index.py` | After adding a batch of new notes (Phase 5+) |
| Edit `prompts/system.txt` | When responses feel off, not when retrieval is off |
| Extend your taxonomy | When a topic genuinely doesn't fit — add to the list first |
| Update `system/session-log.md` | At the end of every session |
| Import Kindle highlights | After finishing a book |
| Import Instapaper highlights | Monthly, or when you've accumulated a batch |

---

## What you're learning at each phase

| Phase | Context architecture lesson |
|---|---|
| 0 — Taxonomy | Why structure comes before technology; controlled vocabulary matters |
| 1 — Note format | The labelling problem: system language must match user language |
| 2 — System prompt | How skills, content types, and rules shape agent behaviour |
| 3 — Keyword retrieval | Why content quality determines retrieval quality, not query cleverness |
| 4 — Seeding & testing | How to evaluate AI output critically — retrieval failure vs reasoning failure |
| 5 — Semantic search | What embeddings actually do and why RAG exists |

---

## When to ask Copilot Chat for help

Any time you're stuck:

- *"I ran this script and got this error: [paste error]. What's wrong?"*
- *"The retrieval is returning irrelevant notes. Here's an example note and query. What might be causing this?"*
- *"I want to add a new skill to my system prompt for [use case]. How should I write it?"*

You design. Copilot engineers. That's the workflow.
