"""
Search/chat route — the first Flask endpoint to expose retrieval_service's
functions (previously only reachable from the CLI). Implements the Session
19/29 UX decisions: sources elaboration is templated arithmetic over the
retrieved matches, not a second LLM call — zero new API cost or eval
surface beyond the one answer-generation call this endpoint already needs.
"Go to article" is handled entirely by the frontend (opens the real Notes
read view via noteId); this endpoint doesn't need to know about that.

The answer streams as Server-Sent Events rather than one JSON response:
real streaming from Claude (not a client-side animation over an
already-complete answer) so the first text appears in under a second
instead of after the full multi-second generation. `delta` events carry
text chunks as they're generated; one final `done` event carries the
sources data, which doesn't depend on streaming. `error` on failure.

Endpoints:
- POST /api/search — streamed real-answer search, replacing the
  frontend's mock.
"""

import json
import os
import re
import sys
from pathlib import Path

from flask import Blueprint, request, jsonify, Response
import anthropic

sys.path.insert(0, str(Path(__file__).parent.parent))
import notes_store  # noqa: E402

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from retrieval_service import semantic_search_matches  # noqa: E402
from config import PROJECT_ROOT  # noqa: E402

search_bp = Blueprint('search', __name__, url_prefix='/api')

ANSWER_MODEL = "claude-haiku-4-5-20251001"  # same model chat.py's CLI already uses

_SYSTEM_PROMPT_PATH = PROJECT_ROOT / "prompts" / "system.txt"
_SYSTEM_PROMPT = _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8") if _SYSTEM_PROMPT_PATH.exists() else ""

# Display-only filler words dropped from the "matched on:" summary text so
# it reads naturally — separate from any real search scoring. The keyword
# baseline's actual relevance weighting is BM25's IDF (see retrieval_service
# docs); this list only shapes how the UI phrases what matched.
_DISPLAY_FILLER_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "do", "does", "did",
    "to", "of", "in", "on", "for", "and", "or", "i", "my", "me",
    "what", "how", "should", "would", "could", "can", "you", "your",
}


def _get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    return anthropic.Anthropic(api_key=api_key)


def _tokenize_for_display(text: str) -> set:
    return set(re.findall(r"[a-z0-9']+", text.lower()))


def _sources_summary(matches: list) -> str:
    n = len(matches)
    topics = sorted({m["topic"] for m in matches if m["topic"]})
    topic_str = ", ".join(topics) if topics else "your notes"
    return f"{n} result{'s' if n != 1 else ''} across {topic_str}"


def _sources_elaboration(query_terms: set, matches: list) -> str:
    matched = set()
    for m in matches:
        matched |= query_terms & _tokenize_for_display(m["text"])
    if not matched:
        return None
    return "Matched on: " + ", ".join(sorted(matched))


def _build_sources(matches: list) -> list:
    note_titles = {n["id"]: n["title"] for n in notes_store.list_notes()}
    return [
        {
            "noteId": m["path"],
            "title": note_titles.get(m["path"], m["path"]),
            "path": f"notes/{m['path']}",
            "chunk": m["text"],
        }
        for m in matches
    ]


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@search_bp.route('/search', methods=['POST'])
def search():
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()
    if not query:
        return jsonify({"status": "error", "message": "query is required"}), 400

    matches = semantic_search_matches(query)

    def generate():
        if not matches:
            yield _sse("delta", {"text": "I couldn't find anything in your notes about that. Try rephrasing, or it may just not be covered yet."})
            yield _sse("done", {"sourcesSummary": None, "sourcesElaboration": None, "sources": []})
            return

        context = "\n".join(f"=== {m['path']} ===\n{m['text']}\n" for m in matches)
        context_message = f"""
RETRIEVED NOTES (relevant to this query):
{context}

USER QUERY:
{query}

---

Please respond based on the retrieved notes above. If no relevant notes exist, say so clearly.
"""
        try:
            with _get_client().messages.stream(
                model=ANSWER_MODEL,
                max_tokens=1024,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": context_message}],
            ) as stream:
                for text in stream.text_stream:
                    yield _sse("delta", {"text": text})
        except anthropic.APIError as e:
            yield _sse("error", {"message": f"Claude API error: {e}"})
            return

        query_terms = _tokenize_for_display(query) - _DISPLAY_FILLER_WORDS
        yield _sse("done", {
            "sourcesSummary": _sources_summary(matches),
            "sourcesElaboration": _sources_elaboration(query_terms, matches),
            "sources": _build_sources(matches),
        })

    return Response(generate(), mimetype="text/event-stream")
