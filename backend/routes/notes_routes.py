"""
Notes management routes.

Endpoints:
- GET /api/notes — List all notes with metadata
- GET /api/notes/{note_id} — Fetch full markdown content
- PATCH /api/notes/{note_id} — Update a note's fields (frontmatter, tags,
  content, topic)
- GET /api/topics — List available topic folders
- GET /api/tags — List all tags in use
"""

import os
import sys
from pathlib import Path

from flask import Blueprint, request, jsonify

sys.path.insert(0, str(Path(__file__).parent.parent))
import notes_store  # noqa: E402

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from embed import embed_all_notes  # noqa: E402

notes_bp = Blueprint('notes', __name__, url_prefix='/api')

_UPDATABLE_FIELDS = {"title", "author", "source", "date", "type", "tags", "content", "topic"}


@notes_bp.route('/notes', methods=['GET'])
def list_notes():
    """
    List all notes with metadata (title, source, date, topic, tags).

    Query params:
    - topic: filter by topic folder
    - tag: filter by tag
    """
    topic_filter = request.args.get('topic')
    tag_filter = request.args.get('tag')

    notes = notes_store.list_notes(topic=topic_filter, tag=tag_filter)
    return jsonify({"status": "success", "notes": notes}), 200


@notes_bp.route('/notes/<path:note_id>', methods=['GET'])
def get_note(note_id):
    """
    Fetch full markdown content for a note.

    note_id is the path relative to notes/, e.g.
    'ai-products/building-production-ai-agents-linear.md'.
    """
    try:
        note = notes_store.get_note(note_id)
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e), "code": "invalid_note_id"}), 400

    if note is None:
        return jsonify({"status": "error", "message": "Note not found", "code": "not_found"}), 404

    return jsonify({"status": "success", **note}), 200


@notes_bp.route('/notes/<path:note_id>', methods=['PATCH'])
def update_note(note_id):
    """
    Update a note's fields. Only the keys present in the request body are
    changed — everything else on the note is left as-is.

    Expected JSON (all keys optional, at least one required):
    {
      "title": "...", "author": "...", "source": "...", "date": "...",
      "type": "...", "topic": "ai-products", "tags": [...], "content": "..."
    }

    Editing content re-embeds the note (so semantic search stays
    accurate) if OPENAI_API_KEY is set — otherwise the save succeeds
    with a warning, same pattern as /api/import/confirm.
    """
    data = request.get_json(silent=True) or {}
    updates = {k: v for k, v in data.items() if k in _UPDATABLE_FIELDS}

    if not updates:
        return jsonify({
            "status": "error",
            "message": "Expected at least one of: " + ", ".join(sorted(_UPDATABLE_FIELDS)),
            "code": "invalid_request"
        }), 400

    if "tags" in updates and not isinstance(updates["tags"], list):
        return jsonify({"status": "error", "message": "'tags' must be an array", "code": "invalid_request"}), 400

    try:
        note = notes_store.update_note(note_id, updates)
    except (ValueError, FileExistsError) as e:
        return jsonify({"status": "error", "message": str(e), "code": "invalid_request"}), 400

    if note is None:
        return jsonify({"status": "error", "message": "Note not found", "code": "not_found"}), 404

    warning = None
    if "content" in updates:
        if not os.getenv("OPENAI_API_KEY"):
            warning = ("Note saved but NOT re-embedded — OPENAI_API_KEY is missing from .env. "
                       "Add it and run `python3 scripts/embed.py` to keep semantic search accurate.")
        else:
            try:
                embed_all_notes()
            except Exception as e:
                warning = f"Note saved but re-embedding failed — run scripts/embed.py manually: {e}"

    response = {"status": "success", **note}
    if warning:
        response["warning"] = warning
    return jsonify(response), 200


@notes_bp.route('/topics', methods=['GET'])
def list_topics():
    """List available topic folders (derived from notes/ directory structure)."""
    return jsonify({"status": "success", "topics": notes_store.list_topics()}), 200


@notes_bp.route('/tags', methods=['GET'])
def list_tags():
    """List all tags currently in use across notes."""
    return jsonify({"status": "success", "tags": notes_store.list_tags()}), 200
