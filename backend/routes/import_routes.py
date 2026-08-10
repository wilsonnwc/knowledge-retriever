"""
Import & file handling routes.

Endpoints:
- POST /api/import — Upload file, run agent extraction, suggest frontmatter
- POST /api/import/confirm — Confirm/edit frontmatter and save note
"""

from flask import Blueprint, request, jsonify

import_bp = Blueprint('import', __name__, url_prefix='/api')


@import_bp.route('/import', methods=['POST'])
def import_file():
    """
    Upload file and run agent extraction.

    Expected JSON:
    {
      "file_type": "markdown|pdf|text",
      "content": "<file content>",
      "topic_folder": "<optional>",
      "user_prompt": "<optional>"
    }

    Returns frontmatter suggestions for user confirmation.
    """
    data = request.get_json()

    # TODO: Implement import logic
    # 1. Extract content based on file_type
    # 2. Run agent to suggest frontmatter
    # 3. Return preview + frontmatter_prompts

    return jsonify({
        "status": "not_implemented",
        "message": "Import endpoint will be implemented in Session 2"
    }), 501


@import_bp.route('/import/confirm', methods=['POST'])
def confirm_import():
    """
    Confirm/edit frontmatter and save note.

    Expected JSON:
    {
      "note_path": "notes/ai-products/example.md",
      "frontmatter_updates": { ... },
      "topic_folder": "ai-products",
      "tags": ["job-application"]
    }

    Saves the note and embeds it.
    """
    data = request.get_json()

    # TODO: Implement confirm logic
    # 1. Update frontmatter
    # 2. Save note to correct topic folder
    # 3. Call embed.py to embed the note
    # 4. Return success

    return jsonify({
        "status": "not_implemented",
        "message": "Confirm import endpoint will be implemented in Session 2"
    }), 501
