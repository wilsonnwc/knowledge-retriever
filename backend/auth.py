"""
auth.py — one shared password guarding every API route (spec: hosted Today page, no domain for
Cloudflare Access). Login sets a signed, HttpOnly session cookie that lasts 30 days, so the phone
stays logged in.

Auth is on whenever APP_PASSWORD is set. A hosted deploy without it refuses to start rather than
serving an open API (the notes API has delete endpoints).
"""

import hmac
import os
from datetime import timedelta

from flask import Blueprint, jsonify, request, session

OPEN_PATHS = {"/api/login", "/api/logout", "/api/session", "/api/health"}
auth_bp = Blueprint("auth", __name__, url_prefix="/api")


def init_auth(app) -> None:
    password = os.environ.get("APP_PASSWORD")
    hosted = bool(os.environ.get("RENDER"))
    if hosted and not password:
        raise RuntimeError("APP_PASSWORD must be set when hosted; refusing to serve an unauthenticated API")
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY") or (os.urandom(32) if not password else None),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=hosted,
        PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    )
    if password and not app.config["SECRET_KEY"]:
        raise RuntimeError("SECRET_KEY must be set alongside APP_PASSWORD (it signs the login cookie)")
    app.config["AUTH_REQUIRED"] = bool(password)
    app.register_blueprint(auth_bp)

    @app.before_request
    def require_login():
        if not app.config["AUTH_REQUIRED"] or request.method == "OPTIONS":
            return None
        if request.path.startswith("/api/") and request.path not in OPEN_PATHS and not session.get("auth"):
            return jsonify({"status": "error", "message": "login required"}), 401
        return None


@auth_bp.route("/login", methods=["POST"])
def login():
    expected = os.environ.get("APP_PASSWORD", "")
    given = (request.get_json(silent=True) or {}).get("password", "")
    if not expected or not isinstance(given, str) or not hmac.compare_digest(given.encode(), expected.encode()):
        return jsonify({"status": "error", "message": "wrong password"}), 401
    session.clear()
    session.permanent = True
    session["auth"] = True
    return jsonify({"status": "success"}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "success"}), 200


@auth_bp.route("/session", methods=["GET"])
def session_status():
    from flask import current_app
    required = current_app.config.get("AUTH_REQUIRED", False)
    return jsonify({"auth_required": required, "authenticated": (not required) or bool(session.get("auth"))}), 200
