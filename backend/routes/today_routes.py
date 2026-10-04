"""
Today page routes — HTTP adapter over backend/today_store.py.

- GET  /api/today?date=YYYY-MM-DD   the day's cards (default: latest digest), junk list, metrics
- GET  /api/items/<id>              the reader: full text or the newsletter's own description
- POST /api/events                  a button press {item_id, action, reason?, undoes_event_id?}
- GET  /api/later                   the Later list
"""

import re
import sys
from pathlib import Path

from flask import Blueprint, jsonify, request

sys.path.insert(0, str(Path(__file__).parent.parent))
import today_store  # noqa: E402

today_bp = Blueprint("today", __name__, url_prefix="/api")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


@today_bp.route("/today", methods=["GET"])
def get_today():
    day = request.args.get("date")
    if day and not DATE.match(day):
        return jsonify({"status": "error", "message": "date must be YYYY-MM-DD"}), 400
    return jsonify({"status": "success", "page": today_store.today(day)}), 200


@today_bp.route("/items/<path:item_id>", methods=["GET"])
def get_item(item_id):
    try:
        return jsonify({"status": "success", "item": today_store.item(item_id)}), 200
    except today_store.NotFound:
        return jsonify({"status": "error", "message": "no such item"}), 404


@today_bp.route("/events", methods=["POST"])
def post_event():
    data = request.get_json(silent=True) or {}
    undoes = data.get("undoes_event_id")
    if not data.get("item_id") or not data.get("action") or (undoes is not None and not isinstance(undoes, int)):
        return jsonify({"status": "error", "message": "item_id and action are required"}), 400
    try:
        result = today_store.record_event(data["item_id"], data["action"], data.get("reason"), undoes)
    except today_store.InvalidEvent as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except today_store.NotFound:
        return jsonify({"status": "error", "message": "no such item"}), 404
    # metrics ride along so the page's progress strip updates without refetching the whole day
    return jsonify({"status": "success", **result, "metrics": today_store.metrics()}), 201


@today_bp.route("/later", methods=["GET"])
def get_later():
    return jsonify({"status": "success", "items": today_store.later()}), 200
