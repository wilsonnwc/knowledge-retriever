#!/usr/bin/env python3
"""
Personal Knowledge Retriever — Chat interface
Loads your notes and talks with you about them.
"""

import argparse
import os
import re
import sys
from datetime import date
from pathlib import Path
from dotenv import load_dotenv
import anthropic
import chromadb
from openai import OpenAI

# Load API key from .env
load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in .env")
    sys.exit(1)

client = anthropic.Anthropic(api_key=api_key)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
NOTES_DIR = PROJECT_ROOT / "notes"
PROMPTS_DIR = PROJECT_ROOT / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "system.txt"
CHROMA_DIR = PROJECT_ROOT / "system" / "chroma_db"
PROJECTS_PATH = PROJECT_ROOT / "system" / "projects.md"
COLLECTION_NAME = "notes"
EMBEDDING_MODEL = "text-embedding-3-small"
PROJECTS_START = "<!-- PROJECTS_START -->"
PROJECTS_END = "<!-- PROJECTS_END -->"

if not SYSTEM_PROMPT_PATH.exists():
    print(f"ERROR: System prompt not found at {SYSTEM_PROMPT_PATH}")
    sys.exit(1)

with open(SYSTEM_PROMPT_PATH, "r") as f:
    SYSTEM_PROMPT = f.read()


def load_projects() -> dict:
    """
    Parse the project registry between the PROJECTS_START/END markers.
    Returns {name: {"status": str, "line": str}} — "line" is the full
    detail text after "name: " (e.g. "active, created 2026-08-05"),
    preserved verbatim so rewriting one project's line never drops
    another project's date detail.
    """
    if not PROJECTS_PATH.exists():
        return {}

    text = PROJECTS_PATH.read_text(encoding="utf-8")
    start = text.find(PROJECTS_START)
    end = text.find(PROJECTS_END)
    if start == -1 or end == -1:
        return {}

    block = text[start + len(PROJECTS_START):end]
    projects = {}
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("- "):
            continue
        # Format: "- name: status, created YYYY-MM-DD[, archived YYYY-MM-DD]"
        name, _, rest = line[2:].partition(":")
        rest = rest.strip()
        status, _, _ = rest.partition(",")
        projects[name.strip()] = {"status": status.strip(), "line": rest}
    return projects


def save_projects(projects: dict) -> None:
    """
    Rewrite the registry block from {name: {"status": ..., "line": ...}}.
    """
    text = PROJECTS_PATH.read_text(encoding="utf-8")
    start = text.find(PROJECTS_START) + len(PROJECTS_START)
    end = text.find(PROJECTS_END)

    body = "\n".join(f"- {name}: {info['line']}" for name, info in projects.items())
    new_block = f"\n{body}\n" if projects else "\n"
    PROJECTS_PATH.write_text(text[:start] + new_block + text[end:], encoding="utf-8")


def new_project(name: str) -> None:
    """
    Register a new active project. Refuses to create a duplicate.
    """
    projects = load_projects()
    if name in projects:
        print(f"ERROR: project '{name}' already exists (status: {projects[name]['status']})")
        sys.exit(1)

    projects[name] = {
        "status": "active",
        "line": f"active, created {date.today().isoformat()}",
    }

    save_projects(projects)
    print(f"Created project '{name}' (active).")


def archive_project(name: str) -> None:
    """
    Flip a project's status to archived. Leaves every note's `projects:`
    label untouched — this only affects the registry entry.
    """
    projects = load_projects()
    if name not in projects:
        print(f"ERROR: project '{name}' not found in {PROJECTS_PATH}")
        sys.exit(1)
    if projects[name]["status"] == "archived":
        print(f"Project '{name}' is already archived.")
        return

    projects[name] = {
        "status": "archived",
        "line": f"archived, closed {date.today().isoformat()}",
    }

    save_projects(projects)
    print(f"Archived project '{name}'. Note labels are unchanged.")


def _note_projects(content: str) -> list:
    """
    Pull the `projects:` frontmatter list out of a note's raw text, e.g.
    "projects: [leapspace-interview-prep, job-application]" -> both names.
    Returns [] if the field is absent or empty.
    """
    match = re.search(r"^projects:\s*\[(.*?)\]", content, re.MULTILINE)
    if not match:
        return []
    return [p.strip() for p in match.group(1).split(",") if p.strip()]


def search_notes(query: str, project: str = None) -> str:
    """
    Keyword search across all notes with section-aware preview.
    Respects ## section boundaries for consolidated files.
    """
    if not NOTES_DIR.exists():
        return "[No notes directory found]"

    relevant_items = []
    # Strip punctuation so "goals?" matches "goals" in content
    query_words = re.findall(r"[a-z0-9']+", query.lower())

    for note_file in NOTES_DIR.rglob("*.md"):
        with open(note_file, "r", encoding="utf-8") as f:
            content = f.read()

        if project and project not in _note_projects(content):
            continue

        # Count keyword matches
        matches = sum(1 for word in query_words if word in content.lower())
        if matches > 0:
            # Extract a section-aware preview: frontmatter + intro + first section
            lines = content.split("\n")
            preview_lines = []
            section_count = 0

            # Pull content: frontmatter (---), intro text, and first full section
            for i, line in enumerate(lines):
                preview_lines.append(line)

                # Count section headers (##)
                if line.startswith("## "):
                    section_count += 1
                    # Stop after capturing the first section
                    if section_count > 1:
                        break

                # Safety limit: don't pull entire file even if no second header
                if i > 120:
                    break

            relevant_items.append({
                "file": note_file.name,
                "path": note_file.relative_to(NOTES_DIR),
                "matches": matches,
                "preview": "\n".join(preview_lines)
            })

    # Sort by match count
    relevant_items.sort(key=lambda x: x["matches"], reverse=True)

    if not relevant_items:
        return "[No matching notes found]"

    # Build context
    context_parts = []
    for item in relevant_items[:5]:  # Top 5 matches
        context_parts.append(f"=== {item['path']} ===\n{item['preview']}\n")

    return "\n".join(context_parts)


def search_notes_semantic(query: str, project: str = None) -> str:
    """
    Semantic search across all notes using embeddings stored in Chroma.
    Same output shape as search_notes() so it's a drop-in swap for evaluation.

    Project filtering happens client-side, after retrieval: the `projects`
    frontmatter field is stored by embed.py as a raw string (e.g.
    "[a, b]"), not a list, so Chroma's `where` can't exact-match a single
    project name inside it. Over-fetch before filtering so a project filter
    can't drop below 5 results just because non-matching chunks ranked higher.
    """
    if not CHROMA_DIR.exists():
        return "[No Chroma index found — run scripts/embed.py first]"

    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

    query_embedding = openai_client.embeddings.create(
        model=EMBEDDING_MODEL, input=[query]
    ).data[0].embedding

    n_results = 25 if project else 5
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)

    if not results["ids"] or not results["ids"][0]:
        return "[No matching notes found]"

    context_parts = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        if project and project not in _note_projects(f"projects: {meta.get('projects', '')}"):
            continue
        source_path = meta.get("source_file", "unknown")
        context_parts.append(f"=== {source_path} ===\n{doc}\n")
        if len(context_parts) == 5:
            break

    if not context_parts:
        return "[No matching notes found]"

    return "\n".join(context_parts)


def suggest_related(note_path: str, top_n: int = 3) -> str:
    """
    Suggest existing notes related to `note_path`, grouped by whether they
    share a project with it. `note_path` must already be embedded (run
    embed.py after adding/editing the note, before calling this).

    Chroma stores one entry per chunk, not per note, so a naive top-N query
    could return several chunks from the same other note. To avoid that,
    every chunk of the target note is queried, and for each *other* note
    the single highest-similarity chunk becomes that note's score — then
    notes are ranked by that one score, not by raw chunk count.

    This collection uses Chroma's default distance metric (squared L2, not
    cosine — confirmed by inspecting raw values: a chunk matched against
    itself returns distance 0.0, and unrelated chunks return ~0.8-1.0+,
    which is L2's range, not cosine distance's ~0-2 range). Lower distance
    is more related; there is no clean "similarity score" to report without
    also changing the collection's indexing metric, so results are ranked
    and displayed by raw distance instead of inventing a similarity number.
    """
    if not CHROMA_DIR.exists():
        return "[No Chroma index found — run scripts/embed.py first]"

    rel_path = str(Path(note_path).resolve().relative_to(NOTES_DIR.resolve()))

    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

    target = collection.get(where={"source_file": rel_path}, include=["embeddings"])
    if not target["ids"]:
        return f"[No embeddings found for {rel_path} — run scripts/embed.py first]"

    target_projects = set()
    full_text = (NOTES_DIR / rel_path).read_text(encoding="utf-8")
    target_projects.update(_note_projects(full_text))

    best_by_note = {}  # source_file -> (distance, meta)
    for embedding in target["embeddings"]:
        results = collection.query(query_embeddings=[embedding], n_results=len(target["ids"]) + 10)
        for dist, meta in zip(results["distances"][0], results["metadatas"][0]):
            other_file = meta.get("source_file", "unknown")
            if other_file == rel_path:
                continue
            if other_file not in best_by_note or dist < best_by_note[other_file][0]:
                best_by_note[other_file] = (dist, meta)

    if not best_by_note:
        return "[No other notes to compare against]"

    same_project, other = [], []
    for other_file, (dist, meta) in best_by_note.items():
        other_projects = set(_note_projects(f"projects: {meta.get('projects', '')}"))
        if target_projects and target_projects & other_projects:
            same_project.append((other_file, dist))
        else:
            other.append((other_file, dist))

    same_project.sort(key=lambda x: x[1])  # lower distance = more related
    other.sort(key=lambda x: x[1])

    lines = [f"Related notes for '{rel_path}' (lower distance = more related):\n"]
    if target_projects:
        lines.append(f"Same project ({', '.join(sorted(target_projects))}):")
        if same_project:
            for f, d in same_project[:top_n]:
                lines.append(f"  - {f} (distance: {d:.2f})")
        else:
            lines.append("  (none)")
        lines.append("\nOther projects / unassigned:")
    else:
        lines.append("(no projects tagged — showing closest matches overall)")
    for f, d in other[:top_n]:
        lines.append(f"  - {f} (distance: {d:.2f})")

    return "\n".join(lines)


def chat(project: str = None):
    """
    Main chat loop.
    """
    print("\n🧠 Personal Knowledge Retriever")
    print("─" * 50)
    if project:
        print(f"Scoped to project: {project}")
    print("Ask me anything about your saved notes.")
    print("Type 'quit' to exit.\n")

    conversation_history = []

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() in ["quit", "exit", "q"]:
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        # Search for relevant notes
        retrieved_context = search_notes(user_input, project=project)
        
        # Build the message with retrieved context
        context_message = f"""
RETRIEVED NOTES (relevant to this query):
{retrieved_context}

USER QUERY:
{user_input}

---

Please respond based on the retrieved notes above. If no relevant notes exist, say so clearly.
"""
        
        # Add to conversation
        conversation_history.append({
            "role": "user",
            "content": context_message
        })
        
        # Call Claude
        try:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=conversation_history
            )
            
            assistant_message = response.content[0].text
            conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            print(f"\nAssistant: {assistant_message}\n")
        
        except anthropic.APIError as e:
            print(f"\nERROR: {e}\n")
            # Remove the last user message if API call failed
            conversation_history.pop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Personal Knowledge Retriever")
    parser.add_argument("--new-project", metavar="NAME", help="Register a new active project")
    parser.add_argument("--archive-project", metavar="NAME", help="Archive an existing project")
    parser.add_argument("--project", metavar="NAME", help="Scope chat search to one project")
    parser.add_argument("--suggest-related", metavar="NOTE_PATH", help="Suggest notes related to NOTE_PATH")
    args = parser.parse_args()

    if args.new_project:
        new_project(args.new_project)
    elif args.archive_project:
        archive_project(args.archive_project)
    elif args.suggest_related:
        print(suggest_related(args.suggest_related))
    else:
        chat(project=args.project)
