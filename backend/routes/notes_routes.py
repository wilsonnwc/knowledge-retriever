"""
Notes management routes.

Endpoints:
- GET /api/notes — List all notes with metadata
- GET /api/notes/{note_id} — Fetch full markdown content
- PATCH /api/notes/{note_id} — Update tags for a note
- GET /api/topics — List available topic folders
- GET /api/tags — List all tags in use
"""

import sys
from pathlib import Path

from flask import Blueprint, request, jsonify

sys.path.insert(0, str(Path(__file__).parent.parent))
import notes_store  # noqa: E402

notes_bp = Blueprint('notes', __name__, url_prefix='/api')


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
def update_note_tags(note_id):
    """
    Update tags for a note.

    Expected JSON:
    {
      "tags": ["job-application", "revisit", "favourite"]
    }
    """
    data = request.get_json(silent=True) or {}
    tags = data.get('tags')
    if tags is None or not isinstance(tags, list):
        return jsonify({
            "status": "error",
            "message": "Expected JSON body with a 'tags' array",
            "code": "invalid_request"
        }), 400

    try:
        note = notes_store.update_note_tags(note_id, tags)
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e), "code": "invalid_note_id"}), 400

    if note is None:
        return jsonify({"status": "error", "message": "Note not found", "code": "not_found"}), 404

    return jsonify({"status": "success", **note}), 200


@notes_bp.route('/topics', methods=['GET'])
def list_topics():
    """List available topic folders (derived from notes/ directory structure)."""
    return jsonify({"status": "success", "topics": notes_store.list_topics()}), 200


@notes_bp.route('/tags', methods=['GET'])
def list_tags():
    """List all tags currently in use across notes."""
    return jsonify({"status": "success", "tags": notes_store.list_tags()}), 200
