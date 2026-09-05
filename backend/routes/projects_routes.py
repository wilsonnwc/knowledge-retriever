"""
Project registry routes — list/create/rename/archive. All the actual
logic lives in backend/projects_store.py; this file just adapts it to
HTTP (JSON error responses instead of exceptions).

Endpoints:
- GET /api/projects — list all projects with status and note count
- POST /api/projects — create a new active project
- PATCH /api/projects/{name} — rename and/or archive
"""

import sys
from pathlib import Path

from flask import Blueprint, request, jsonify

sys.path.insert(0, str(Path(__file__).parent.parent))
import projects_store  # noqa: E402

projects_bp = Blueprint('projects', __name__, url_prefix='/api')


@projects_bp.route('/projects', methods=['GET'])
def list_projects():
    return jsonify({"status": "success", "projects": projects_store.list_projects()}), 200


@projects_bp.route('/projects', methods=['POST'])
def create_project():
    data = request.get_json(silent=True) or {}
    try:
        project = projects_store.create_project(data.get("name", ""))
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    # Nested under "project", not spread — a project's own `status` field
    # (active/archived) would otherwise silently overwrite this response's
    # "success" status marker, since both use the same key.
    return jsonify({"status": "success", "project": project}), 201


@projects_bp.route('/projects/<path:name>', methods=['PATCH'])
def update_project(name):
    """
    Body may include `name` (rename) and/or `status: "archived"` (archive),
    in any combination. Rename is applied first so a combined
    rename+archive in one request lands on the new name.
    """
    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"status": "error", "message": "No changes provided"}), 400

    current_name = name
    try:
        if "name" in data and data["name"] != current_name:
            projects_store.rename_project(current_name, data["name"])
            current_name = data["name"]
        if data.get("status") == "archived":
            projects_store.archive_project(current_name)
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400

    updated = next((p for p in projects_store.list_projects() if p["name"] == current_name), None)
    if updated is None:
        return jsonify({"status": "error", "message": "Project not found after update"}), 404
    return jsonify({"status": "success", "project": updated}), 200
