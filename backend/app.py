#!/usr/bin/env python3
"""
Knowledge Retriever — Flask API Backend
Exposes existing Python functions as HTTP endpoints for the React frontend.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load API keys from .env
load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in .env")
    sys.exit(1)

# Add parent directory to path so we can import scripts
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file upload

# Register route blueprints
from routes.notes_routes import notes_bp  # noqa: E402
from routes.import_routes import import_bp  # noqa: E402

app.register_blueprint(notes_bp)
app.register_blueprint(import_bp)


# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "message": "Knowledge Retriever API is running"
    }), 200


# Error handler for 404
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Endpoint not found",
        "code": "not_found"
    }), 404


# Error handler for 500
@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "status": "error",
        "message": "Internal server error",
        "code": "internal_error"
    }), 500


if __name__ == "__main__":
    print("🚀 Knowledge Retriever API starting on http://localhost:5050")
    app.run(debug=True, host='0.0.0.0', port=5050)
