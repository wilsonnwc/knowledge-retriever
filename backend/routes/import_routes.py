"""
Import & file handling routes.

Endpoints:
- POST /api/import — Extract content, suggest frontmatter
- POST /api/import/confirm — Save the note (with confirmed frontmatter) and embed it

Deviation from the original plan doc's API contract (system/ui-build-plan.md):
that doc's /api/import/confirm input only carries frontmatter_updates +
topic_folder + tags, not the note content itself — implying /api/import
would persist a server-side draft file for confirm to finish. That adds
statefulness this single-user local tool doesn't need, and doesn't match
how the React import wizard actually works today (all state — including
content — is held client-side across Upload -> Preview -> Frontmatter ->
Confirm, saved once at the end). So here, /api/import is a stateless
extract+suggest step, and /api/import/confirm additionally requires
"content" in its request body to actually write the file.
"""

import base64
import io
import os
import sys
from pathlib import Path

from flask import Blueprint, request, jsonify
import anthropic

sys.path.insert(0, str(Path(__file__).parent.parent))
import notes_store  # noqa: E402

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from embed import embed_all_notes  # noqa: E402

import_bp = Blueprint('import', __name__, url_prefix='/api')

SUGGESTION_MODEL = "claude-haiku-4-5-20251001"


def _get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    return anthropic.Anthropic(api_key=api_key)


def _extract_pdf_text(base64_content: str) -> str:
    try:
        from PyPDF2 import PdfReader
    except ImportError as e:
        raise RuntimeError(
            "PyPDF2 is not installed — run `pip install -r backend/requirements.txt`"
        ) from e

    pdf_bytes = base64.b64decode(base64_content)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages).strip()


def _suggest_frontmatter(content: str, user_prompt: str = None) -> list:
    """
    One Claude call suggests title/source/type/date for content the user
    hasn't already labeled. Returns the frontmatter_prompts shape from the
    plan doc's API contract: [{field, value, confirmed}].
    Today is not known to the model reliably, so date is left for the
    user to confirm rather than guessed.
    """
    excerpt = content[:4000]
    prompt = f"""Suggest metadata for this saved note. Reply with exactly three lines, no extra text:
TITLE: <a concise title for this content>
SOURCE: <author or publication, if inferable from the text; otherwise reuse the title>
TYPE: <one of: article, book, podcast, video, quote, own-note>

{f"Context from the user: {user_prompt}" if user_prompt else ""}

Content:
{excerpt}"""

    client = _get_client()
    response = client.messages.create(
        model=SUGGESTION_MODEL,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text

    suggestions = {"title": "", "source": "", "type": "article"}
    for line in text.splitlines():
        for field, key in (("TITLE:", "title"), ("SOURCE:", "source"), ("TYPE:", "type")):
            if line.strip().upper().startswith(field):
                suggestions[key] = line.split(":", 1)[1].strip()

    return [
        {"field": "title", "value": suggestions["title"], "confirmed": False},
        {"field": "source", "value": suggestions["source"], "confirmed": False},
        {"field": "type", "value": suggestions["type"] or "article", "confirmed": False},
    ]


@import_bp.route('/import', methods=['POST'])
def import_file():
    """
    Extract content and suggest frontmatter for user confirmation.

    Expected JSON:
    {
      "file_type": "markdown|text|pdf",
      "content": "<file content, or base64-encoded bytes for pdf>",
      "topic_folder": "<optional>",
      "user_prompt": "<optional>"
    }
    """
    data = request.get_json(silent=True) or {}
    file_type = data.get('file_type')
    content = data.get('content')
    user_prompt = data.get('user_prompt')

    if not file_type or not content:
        return jsonify({
            "status": "error",
            "message": "Both 'file_type' and 'content' are required",
            "code": "invalid_request"
        }), 400

    if file_type == 'pdf':
        try:
            extracted = _extract_pdf_text(content)
        except RuntimeError as e:
            return jsonify({"status": "error", "message": str(e), "code": "pdf_extraction_unavailable"}), 501
        except Exception as e:
            return jsonify({"status": "error", "message": f"Could not read PDF: {e}", "code": "pdf_extraction_failed"}), 400
    elif file_type in ('markdown', 'text'):
        extracted = content
    else:
        return jsonify({
            "status": "error",
            "message": f"Unsupported file_type: {file_type}",
            "code": "unsupported_file_type"
        }), 400

    if not extracted.strip():
        return jsonify({
            "status": "error",
            "message": "No text could be extracted from the provided content",
            "code": "empty_content"
        }), 400

    try:
        frontmatter_prompts = _suggest_frontmatter(extracted, user_prompt=user_prompt)
    except anthropic.APIError as e:
        return jsonify({"status": "error", "message": f"Frontmatter suggestion failed: {e}", "code": "suggestion_failed"}), 502

    return jsonify({
        "status": "success",
        "preview": extracted,
        "frontmatter_prompts": frontmatter_prompts
    }), 200


@import_bp.route('/import/confirm', methods=['POST'])
def confirm_import():
    """
    Save the note (confirmed frontmatter + content) and embed it.

    Expected JSON:
    {
      "content": "<final note body>",
      "frontmatter_updates": {
        "title": "Final title",
        "author": "<optional>",
        "source": "Final source (book, podcast, publication, URL, or video)",
        "date": "2026-08-10",
        "type": "article"
      },
      "topic_folder": "ai-products",
      "tags": ["job-application", "revisit"]
    }
    """
    data = request.get_json(silent=True) or {}
    content = data.get('content')
    frontmatter_updates = data.get('frontmatter_updates') or {}
    topic_folder = data.get('topic_folder')
    tags = data.get('tags', [])

    if not content or not topic_folder:
        return jsonify({
            "status": "error",
            "message": "'content' and 'topic_folder' are required",
            "code": "invalid_request"
        }), 400

    frontmatter_fields = {
        "type": frontmatter_updates.get("type", "article"),
        "author": frontmatter_updates.get("author", ""),
        "source": frontmatter_updates.get("source", ""),
        "date": frontmatter_updates.get("date", ""),
        "tags": tags,
    }
    # title is only written to frontmatter when it differs from source
    # (matches how most real notes in this project already look — see
    # notes_store.py's title-derivation fallback).
    title = frontmatter_updates.get("title", "")
    if title and title != frontmatter_fields["source"]:
        frontmatter_fields = {"title": title, **frontmatter_fields}

    try:
        note_id = notes_store.save_new_note(topic_folder, frontmatter_fields, content)
    except FileExistsError as e:
        return jsonify({"status": "error", "message": str(e), "code": "note_already_exists"}), 409
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e), "code": "invalid_request"}), 400

    # embed_all_notes() calls sys.exit(1) if OPENAI_API_KEY is missing —
    # that would kill the whole Flask process, not just this request, so
    # check first rather than relying on catching the failure.
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({
            "status": "success",
            "note_path": f"notes/{note_id}",
            "warning": "Note saved but NOT embedded — OPENAI_API_KEY is missing from .env. "
                       "Add it and run `python3 scripts/embed.py` to make this note searchable."
        }), 200

    try:
        embed_all_notes()
    except Exception as e:
        # Note is already saved on disk at this point; embedding failure
        # shouldn't be reported as if the save itself failed.
        return jsonify({
            "status": "success",
            "note_path": f"notes/{note_id}",
            "warning": f"Note saved but embedding failed — run scripts/embed.py manually: {e}"
        }), 200

    return jsonify({
        "status": "success",
        "note_path": f"notes/{note_id}"
    }), 200
