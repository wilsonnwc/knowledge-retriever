---
name: ui-build-plan
description: Comprehensive plan for building the web UI for the knowledge retriever
metadata:
  type: project
  status: planned
  start_date: 2026-08-10
---

# Knowledge Retriever — Web UI Build Plan

## Objective

Build an all-in-one web UI that enables:
1. **Import & manage articles** — upload files (markdown, PDF, text paste), agent-assisted extraction, markdown preview, tagging, topic folder organization
2. **Project & goal management** — create projects, set goals, define objectives, manage context documents
3. **Semantic search** — leverage LLM to search across database and retrieve relevant documents
4. **Gap analysis** — leverage LLM to identify gaps between project goals and existing saved content
5. **Online research** — extend search to online for articles/content scaffolded within project or goal context

---

## Design Principles

- **Mimic top LLM UIs** — design inspired by Claude App's chat/search experience and Projects layout for user familiarity
- **Front-end rendering** — progress and error messages rendered in the UI, not just backend logs
- **Persistent memory** — retain chat history and research context
- **Build trust** — clear feedback, human-readable explanations, transparent process

---

## MVP Scope

**Import feature only (Phase 1A):**
- File upload (markdown paste, PDF upload, text paste)
- Agent-assisted extraction & frontmatter generation (title, source, date, type if not provided)
- Markdown preview
- Tag management (edit existing tags, create new ones)
- Topic folder organization (for human review; tags are cross-cutting)

**Phases:**
- **Phase 1A (this sprint):** Import/preview/tagging UI
- **Phase 1B (next sprint):** Goal/project management UI
- **Phase 2:** Online search integration

---

## Architecture

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend API** | Flask | Simple, good for this scale, wraps existing Python functions |
| **Frontend** | React | Proper front-end for demo quality, matches Claude App UX feel |
| **Database** | Chroma (existing) | Keep as-is |
| **Embeddings** | OpenAI text-embedding-3-small (existing) | Keep as-is |
| **LLM** | Claude API (existing) | Keep as-is |

### Deployment (local first)
- Flask backend: `localhost:5000`
- React frontend: `localhost:3000`
- Cloud deployment (Vercel + backend service) to be decided later

---

## API Contract (Phase 1A)

### Import & File Handling

**POST /api/import**
- **Purpose:** Upload file, run agent extraction, save note to correct topic folder
- **Input:**
  ```json
  {
    "file_type": "markdown|pdf|text",
    "content": "<file content>",
    "topic_folder": "ai-products|design|... (optional, agent can suggest)",
    "user_prompt": "<optional context from user>"
  }
  ```
- **Process:**
  1. If topic folder not specified, agent suggests based on content
  2. Agent extracts frontmatter (title, source, date, type) if not present
  3. Save to `notes/{topic_folder}/{slug}.md`
  4. Embed the note (call existing `embed.py` logic)
- **Output:**
  ```json
  {
    "status": "success|pending_input",
    "note_path": "notes/ai-products/example.md",
    "preview": "<markdown preview>",
    "frontmatter_prompts": [
      { "field": "title", "value": "...", "confirmed": true },
      { "field": "source", "value": null, "confirmed": false }
    ]
  }
  ```

**POST /api/import/confirm**
- **Purpose:** Confirm/edit frontmatter after agent extraction
- **Input:**
  ```json
  {
    "note_path": "notes/ai-products/example.md",
    "frontmatter_updates": {
      "title": "Final title",
      "source": "Final source",
      "date": "2026-08-10",
      "type": "article"
    },
    "topic_folder": "ai-products",
    "tags": ["job-application", "revisit"]
  }
  ```
- **Output:**
  ```json
  {
    "status": "success",
    "note_path": "notes/ai-products/example.md",
    "preview": "<final markdown>"
  }
  ```

### Notes Management

**GET /api/notes**
- **Purpose:** List all notes with metadata (tags, topic, date)
- **Output:**
  ```json
  {
    "notes": [
      {
        "path": "notes/ai-products/example.md",
        "title": "Example Article",
        "source": "Publication",
        "date": "2026-08-10",
        "topic": "ai-products",
        "tags": ["job-application", "revisit"],
        "preview": "<first 200 chars>"
      }
    ]
  }
  ```

**GET /api/notes/{note_id}**
- **Purpose:** Fetch full markdown content for a note
- **Output:**
  ```json
  {
    "path": "notes/ai-products/example.md",
    "title": "Example Article",
    "metadata": { ... },
    "content": "<full markdown>"
  }
  ```

**PATCH /api/notes/{note_id}**
- **Purpose:** Update tags for a note
- **Input:**
  ```json
  {
    "tags": ["job-application", "favourite", "revisit"]
  }
  ```
- **Output:** Updated note object

**GET /api/topics**
- **Purpose:** List available topic folders (from taxonomy)
- **Output:**
  ```json
  {
    "topics": ["ai-products", "design", "discovery", "stakeholder-management", ...]
  }
  ```

**GET /api/tags**
- **Purpose:** List all tags in use across notes
- **Output:**
  ```json
  {
    "tags": ["job-application", "revisit", "foundational-knowledge", "favourite"]
  }
  ```

### Error Handling

All endpoints return:
```json
{
  "status": "error",
  "message": "<user-friendly error message>",
  "code": "<error_code>"
}
```

Example error codes: `file_upload_failed`, `frontmatter_missing`, `invalid_topic`, etc.

---

## Frontend Components (Phase 1A)

### Main Layout
- **Navigation:** Home / Import / Projects (grayed out) / Search (grayed out) / Goals (grayed out)
- **Primary area:** Import flow or note list

### Import Flow
1. **Upload step:** Drag-drop or file picker (markdown, PDF, text paste)
2. **Preview step:** Show extracted content, markdown preview
3. **Metadata step:** Agent-suggested frontmatter with edit capability (title, source, date, type, topic folder)
4. **Tagging step:** Existing tags + option to create new ones
5. **Confirm step:** Review, then save

### Notes List View
- **Filters:** By topic, by tag, by date
- **List:** Title, source, date, tags, topic folder
- **Actions:** View full note, edit tags, delete (maybe phase 2)

### Note Detail View
- **Markdown preview** (react-markdown or similar)
- **Edit tags** button
- **Metadata display** (source, date, topic, project)

---

## Build Sequence

### Session 1 (Today)
- ✅ Create this plan document
- Finalize API contract (address any questions)
- Set up Flask project structure (app.py, requirements.txt, routes/)

### Session 2
- Implement Flask API endpoints (Phase 1A):
  - POST /api/import
  - POST /api/import/confirm
  - GET /api/notes, GET /api/notes/{id}, PATCH /api/notes/{id}
  - GET /api/topics, GET /api/tags
- Test endpoints via Postman or curl

### Session 3
- Set up React project (create-react-app or Vite)
- Build UI components:
  - Import flow (upload → preview → metadata → tagging → confirm)
  - Notes list view with filters
  - Note detail view

### Session 4
- Wire up React frontend to Flask API
- End-to-end testing (upload file → save → view → edit tags)
- Polish UX (error handling, loading states, confirmations)

### Session 5+
- Phase 1B: Goal/project management UI
- Phase 2: Online search integration
- Bug fixes & iteration

---

## Cost Implications

**None.** The refactor to API endpoints doesn't increase costs:
- Backend logic stays identical (same Claude API calls, same token usage)
- Frontend development is local (no hosting costs until deployment)
- Embedding volume stays the same

**Design decision:** To keep costs predictable, the API will *not* auto-fire searches (e.g., no live-search-on-keystroke). Users must explicitly submit queries.

---

## Success Criteria (Phase 1A)

- [ ] Can upload markdown/PDF/text files via UI
- [ ] Agent extracts & suggests frontmatter; user can confirm or edit
- [ ] Files saved to correct topic folder with proper frontmatter
- [ ] Markdown preview renders correctly
- [ ] Can view all notes in a list with filters (topic, tag)
- [ ] Can edit tags on existing notes
- [ ] Can create new tags
- [ ] Error messages are clear and user-friendly
- [ ] Works end-to-end (upload → save → view → edit tags)

---

## Open Questions

- Should we add a "delete note" feature in Phase 1A, or defer?
- Should PDF extraction use Claude vision or a simpler PDF-to-text library?
- How much of the frontmatter should be optional vs. required?

---

## Reference Documents

- `CLAUDE.md` — project principles and tech stack defaults
- `system/project-management/agent-bulk-import-instructions.md` — AI-assisted import workflow logic
- `scripts/chat.py` — existing backend functions to wrap as API endpoints
