"""
Notes management routes.

Endpoints:
- GET /api/notes — List all notes with metadata
- GET /api/notes/{note_id} — Fetch full markdown content
- PATCH /api/notes/{note_id} — Update tags for a note
- GET /api/topics — List available topic folders
- GET /api/tags — List all tags in use
"""

from flask import Blueprint, request, jsonify

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

    # TODO: Implement list logic
    # 1. Scan notes/ directory
    # 2. Parse YAML frontmatter for each note
    # 3. Filter by topic/tag if specified
    # 4. Return list

    return jsonify({
        "status": "not_implemented",
        "message": "List notes endpoint will be implemented in Session 2"
    }), 501


@notes_bp.route('/notes/<note_id>', methods=['GET'])
def get_note(note_id):
    """
    Fetch full markdown content for a note.

    note_id is the filename (e.g., 'building-production-ai-agents-linear')
    """
    # TODO: Implement fetch logic
    # 1. Find note file by ID
    # 2. Read full content
    # 3. Return with metadata

    return jsonify({
        "status": "not_implemented",
        "message": "Get note endpoint will be implemented in Session 2"
    }), 501


@notes_bp.route('/notes/<note_id>', methods=['PATCH'])
def update_note_tags(note_id):
    """
    Update tags for a note.

    Expected JSON:
    {
      "tags": ["job-application", "revisit", "favourite"]
    }
    """
    data = request.get_json()
    tags = data.get('tags', [])

    # TODO: Implement update logic
    # 1. Find note file by ID
    # 2. Update tags in YAML frontmatter
    # 3. Write back to file
    # 4. Return updated note

    return jsonify({
        "status": "not_implemented",
        "message": "Update note endpoint will be implemented in Session 2"
    }), 501


@notes_bp.route('/topics', methods=['GET'])
def list_topics():
    """
    List available topic folders (from taxonomy).
    """
    # TODO: Implement topics logic
    # Return controlled vocabulary from CLAUDE.md taxonomy section

    return jsonify({
        "status": "not_implemented",
        "message": "List topics endpoint will be implemented in Session 2"
    }), 501


@notes_bp.route('/tags', methods=['GET'])
def list_tags():
    """
    List all tags in use across notes.
    """
    # TODO: Implement tags logic
    # Scan all notes and collect unique tags

    return jsonify({
        "status": "not_implemented",
        "message": "List tags endpoint will be implemented in Session 2"
    }), 501
