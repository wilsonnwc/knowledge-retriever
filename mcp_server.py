#!/usr/bin/env python3
"""
Knowledge Retriever — MCP Server (Learning OS Phase 1)

Exposes the existing notes/retrieval service layer to MCP clients (Claude
Desktop, other MCP-compatible assistants) over stdio. A third adapter
alongside the CLI (scripts/chat.py) and the Flask backend (backend/app.py)
— per system/learning-os-plan.md Section B, it calls notes_store/
retrieval_service directly rather than proxying through Flask over HTTP,
so there's one source of truth, not two that can drift.

Read-only by design (system/learning-os-plan.md Section B, "Propose,
don't write"): an AI client can search and browse notes, but writing a
new note always goes through the human-approved import flow, never
through this server.

Deliberately NOT included yet:
- research_goal / list_skill_gaps (named in the plan doc's eventual tool
  list): research_goal's scope_goal() step blocks on input() for
  interactive terminal use and would hang here; list_skill_gaps needs a
  skills_store that doesn't exist until a later Learning OS phase.

Run directly for a local stdio client (e.g. Claude Desktop's config
pointing `command` at this file's interpreter):
    python3 mcp_server.py
"""

import sys
from pathlib import Path

from dotenv import load_dotenv
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

# An MCP client (e.g. Claude Desktop) launches this as a subprocess with
# its own working directory, not necessarily the project root — so the
# bare load_dotenv() retrieval_service.py calls (which searches from the
# *current* working directory) can silently fail to find .env there.
# Loading it explicitly by this file's own location first means the key
# is in os.environ before retrieval_service's own load_dotenv() runs (a
# no-op at that point, since dotenv doesn't override already-set vars).
load_dotenv(Path(__file__).parent / ".env")

sys.path.insert(0, str(Path(__file__).parent / "backend"))
import notes_store  # noqa: E402

sys.path.insert(0, str(Path(__file__).parent / "scripts"))
from retrieval_service import semantic_search_matches, suggest_related as _suggest_related  # noqa: E402

server = MCPServer(
    name="knowledge-retriever",
    instructions=(
        "Search and browse a personal knowledge base of saved articles, "
        "book/podcast notes, and quotes on product management, AI "
        "products, and related topics. Read-only — there is no tool to "
        "create or edit notes."
    ),
)


@server.tool()
def search_notes(query: str, project: str | None = None) -> list[dict]:
    """
    Semantically search the knowledge base and return the top matching
    passages. Use this to answer a question or find notes about a topic.

    Args:
        query: Natural-language question or topic to search for.
        project: Optional project name to restrict results to notes
            tagged with that project (see list_notes for project names
            in use).

    Returns a list of matches (best first), each with the note's path
    (pass as note_id to get_note), title, topic, and the matched excerpt.
    """
    matches = semantic_search_matches(query, project=project)
    if not matches:
        raise ToolError(
            "No matches found — either nothing in the knowledge base "
            "matches this query, or the search index hasn't been built "
            "yet (run `python3 scripts/embed.py`)."
        )

    titles = {n["id"]: n["title"] for n in notes_store.list_notes()}
    return [
        {
            "note_id": m["path"],
            "title": titles.get(m["path"], m["path"]),
            "topic": m["topic"],
            "section_title": m["section_title"] or None,
            "excerpt": m["text"],
        }
        for m in matches
    ]


@server.tool()
def get_note(note_id: str) -> dict:
    """
    Fetch a single note's full content and metadata by its id (the path
    relative to notes/, e.g. "design/error-recovery-patterns.md" — as
    returned by search_notes or list_notes).
    """
    note = notes_store.get_note(note_id)
    if note is None:
        raise ToolError(f"No note found with id '{note_id}'.")
    return note


@server.tool()
def suggest_related(note_id: str, top_n: int = 3) -> str:
    """
    Find notes related to a given note, ranked by similarity and grouped
    by shared project. `note_id` must already be searchable (i.e. its
    note has been embedded via scripts/embed.py).
    """
    return _suggest_related(note_id, top_n=top_n)


@server.tool()
def list_notes(topic: str | None = None, tag: str | None = None) -> list[dict]:
    """
    List notes in the knowledge base, optionally filtered by topic
    (see list_topics for valid values) or by tag. Useful for browsing
    when you don't already have a specific note_id or search query —
    e.g. "what have I saved under discovery?"
    """
    return notes_store.list_notes(topic=topic, tag=tag)


@server.tool()
def list_topics() -> list[str]:
    """List the topic folders in use in the knowledge base."""
    return notes_store.list_topics()


if __name__ == "__main__":
    server.run(transport="stdio")
