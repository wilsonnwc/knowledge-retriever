"""
today_app.py — the hosted (Render) app: the Today page and its API only, behind the password.

Deliberately slim: no notes, search, Chroma or Anthropic key, so it fits Render's free 512 MB and
exposes nothing but the Today page. It serves the React build from the same origin, so the login
cookie is first-party. Locally, the full app (app.py) serves the Today page too.

    gunicorn --chdir backend today_app:app      (Render start command; RENDER is set by Render)
"""

import sys
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix

sys.path.insert(0, str(Path(__file__).parent))
from auth import init_auth  # noqa: E402
from routes.today_routes import today_bp  # noqa: E402

BUILD = Path(__file__).resolve().parent.parent / "frontend" / "build"

app = Flask(__name__, static_folder=None)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)  # Render terminates HTTPS in front of us
init_auth(app)
app.register_blueprint(today_bp)


@app.route("/api/health")
def health():
    # mode tells the React app to show only the Today page
    return jsonify({"status": "ok", "mode": "today"}), 200


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def frontend(path):
    if path.startswith("api/"):
        return jsonify({"status": "error", "message": "not found"}), 404
    if path and (BUILD / path).is_file():
        return send_from_directory(BUILD, path)
    return send_from_directory(BUILD, "index.html")
