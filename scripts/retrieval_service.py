"""
Retrieval service layer — the shared shelf both the CLI (scripts/chat.py)
and the Flask backend read search/related-notes logic from, so there is
one copy of this logic, not two drifting independently.

Deliberately does NOT include research_goal()/scope_goal(): those call
print()/input() for interactive terminal use and would block a web request
if called as-is (a server has no keyboard to read input() from). Moving
them here is a separate piece of work for whenever the website or MCP
server actually needs them — not needed for Search/Chat.
"""

import os
import re
from pathlib import Path

from dotenv import load_dotenv
import chromadb
from openai import OpenAI
from rank_bm25 import BM25Okapi

from chunking import chunk_all_notes
from config import NOTES_DIR, CHROMA_DIR, COLLECTION_NAME, EMBEDDING_MODEL

load_dotenv()


def _note_projects(content: str) -> list:
    """
    Pull the `projects:` frontmatter list out of a note's raw text, e.g.
    "projects: [leapspace-interview-prep, job-application]" -> both names.
    Returns [] if the field is absent or empty.
    """
    match = re.search(r"^projects:\s*\[(.*?)\]", content, re.MULTILINE)
    if not match:
        return []
    return [p.strip() for p in match.group(1).split(",") if p.strip()]


def _tokenize(text: str) -> list:
    """Lowercase, strip punctuation so "goals?" matches "goals". No
    stopword removal — BM25's IDF weighting discounts common words on
    its own, corpus-relative, with no fixed list to maintain. A fixed
    English stopword list can only ever catch generic filler ("what",
    "should"); it can't catch a word like "product" that's ubiquitous
    in *this* PM notes corpus specifically. IDF catches both, the same
    way, because it measures rarity directly from the actual notes."""
    return re.findall(r"[a-z0-9']+", text.lower())


def search_notes(query: str, project: str = None) -> tuple:
    """
    Keyword search across all notes, ranked with BM25 (via rank_bm25)
    over per-section chunks (reusing chunk_all_notes(), the same chunker
    the Chroma embedding pipeline uses).

    Chunking handles what BM25's own length normalization can't: a long,
    multi-topic note (e.g. several merged sections) shouldn't lose *or*
    win purely because of its total length — scoring each section on its
    own lets a short, focused note compete fairly against one section of
    a longer one, and lets the preview show the section that actually
    matched. BM25 itself replaces naive "does this word appear anywhere"
    counting with the standard formula: rare words weighted higher than
    common ones (IDF), repeated mentions counting with diminishing
    returns rather than linearly (term-frequency saturation), and
    normalization for each chunk's own length.

    Returns (context_string, top_note_path). top_note_path is the
    relative path (str) of the highest-ranked match, or None if there
    were no matches — lets callers offer follow-on actions (e.g.
    suggest_related()) on the single best result without re-parsing
    the formatted context string.
    """
    if not NOTES_DIR.exists():
        return "[No notes directory found]", None

    chunks = [
        c for c in chunk_all_notes(NOTES_DIR)
        if not project or project in _note_projects(f"projects: {c.frontmatter.get('projects', '')}")
    ]
    if not chunks:
        return "[No matching notes found]", None

    # Rebuilt on every call — fine at this corpus size (~30 notes); revisit
    # (cache the index) if the corpus grows enough for this to be slow.
    bm25 = BM25Okapi([_tokenize(c.text) for c in chunks])
    scores = bm25.get_scores(_tokenize(query))

    best_by_file = {}  # source_file -> (score, chunk)
    for chunk, score in zip(chunks, scores):
        if score <= 0:
            continue
        current = best_by_file.get(chunk.source_file)
        if current is None or score > current[0]:
            best_by_file[chunk.source_file] = (score, chunk)

    if not best_by_file:
        return "[No matching notes found]", None

    # Sort by each file's best-matching section
    ranked = sorted(best_by_file.items(), key=lambda kv: kv[1][0], reverse=True)

    context_parts = []
    for source_file, (score, chunk) in ranked[:5]:  # Top 5 matches
        preview = f"## {chunk.section_title}\n{chunk.text}" if chunk.section_title else chunk.text
        context_parts.append(f"=== {source_file} ===\n{preview}\n")

    top_note_path = ranked[0][0]
    return "\n".join(context_parts), top_note_path


def search_notes_semantic(query: str, project: str = None) -> tuple:
    """
    Semantic search across all notes using embeddings stored in Chroma.
    Same output shape as search_notes() so it's a drop-in swap for evaluation:
    returns (context_string, top_note_path).

    Project filtering happens client-side, after retrieval: the `projects`
    frontmatter field is stored by embed.py as a raw string (e.g.
    "[a, b]"), not a list, so Chroma's `where` can't exact-match a single
    project name inside it. Over-fetch before filtering so a project filter
    can't drop below 5 results just because non-matching chunks ranked higher.
    """
    matches = semantic_search_matches(query, project=project)
    if not matches:
        return "[No matching notes found]" if CHROMA_DIR.exists() else "[No Chroma index found — run scripts/embed.py first]", None

    context_parts = [f"=== {m['path']} ===\n{m['text']}\n" for m in matches]
    return "\n".join(context_parts), matches[0]["path"]


def semantic_search_matches(query: str, project: str = None) -> list:
    """
    The structured core of semantic search: one Chroma round-trip, returned
    as a list of per-source dicts (path, text, topic, section_title) rather
    than the flattened "=== path ===" string search_notes_semantic() builds
    for the CLI/Claude-prompt use case. search_notes_semantic() is now a
    thin wrapper over this — kept so both callers share one retrieval call
    instead of each querying Chroma independently (the earlier version of
    this function did exactly that duplication).

    Same over-fetch-then-filter behavior as before: project filtering
    happens client-side since embed.py stores `projects` as a raw string,
    not a list Chroma's `where` can exact-match against.
    """
    if not CHROMA_DIR.exists():
        return []

    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

    query_embedding = openai_client.embeddings.create(
        model=EMBEDDING_MODEL, input=[query]
    ).data[0].embedding

    n_results = 25 if project else 5
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)

    if not results["ids"] or not results["ids"][0]:
        return []

    matches = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        if project and project not in _note_projects(f"projects: {meta.get('projects', '')}"):
            continue
        path = meta.get("source_file", "unknown")
        matches.append({
            "path": path,
            "text": doc,
            # topic isn't a frontmatter field, it's the note's parent
            # folder — same convention notes_store.list_notes() uses.
            "topic": Path(path).parent.name if path != "unknown" else None,
            "section_title": meta.get("section_title"),
        })
        if len(matches) == 5:
            break

    return matches


def check_index_freshness() -> list:
    """
    Compares the notes actually on disk against what's embedded in Chroma —
    the same tripwire-over-auto-fix pattern already used in
    run_evaluation.py's validate_expected_sources() for stale eval labels.
    Cheap to check; warn rather than silently trust.

    Catches both directions of drift: a note that exists on disk but was
    never (re-)embedded, and an embedded entry for a note that no longer
    exists (renamed, deleted, or moved to trash). This is exactly the
    class of bug that went undetected for three weeks in the 2026-08-09
    path-mismatch incident — the index and the notes silently disagreed,
    and nothing ever checked. Returns a list of human-readable warning
    strings; an empty list means the index is fresh.
    """
    if not CHROMA_DIR.exists():
        return ["No Chroma index found — run scripts/embed.py first."]
    if not NOTES_DIR.exists():
        return ["No notes directory found."]

    on_disk = {c.source_file for c in chunk_all_notes(NOTES_DIR)}

    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
    all_meta = collection.get(include=["metadatas"])
    embedded = {m["source_file"] for m in all_meta["metadatas"] if m.get("source_file")}

    warnings = []
    missing = sorted(on_disk - embedded)
    if missing:
        preview = ", ".join(missing[:5]) + (f", +{len(missing) - 5} more" if len(missing) > 5 else "")
        warnings.append(f"{len(missing)} note(s) on disk but not embedded — run scripts/embed.py: {preview}")

    stale = sorted(embedded - on_disk)
    if stale:
        preview = ", ".join(stale[:5]) + (f", +{len(stale) - 5} more" if len(stale) > 5 else "")
        warnings.append(f"{len(stale)} embedded entries reference notes no longer on disk — run scripts/embed.py: {preview}")

    return warnings


def suggest_related(note_path: str, top_n: int = 3) -> str:
    """
    Suggest existing notes related to `note_path`, grouped by whether they
    share a project with it. `note_path` must already be embedded (run
    embed.py after adding/editing the note, before calling this).

    Chroma stores one entry per chunk, not per note, so a naive top-N query
    could return several chunks from the same other note. To avoid that,
    every chunk of the target note is queried, and for each *other* note
    the single highest-similarity chunk becomes that note's score — then
    notes are ranked by that one score, not by raw chunk count.

    This collection uses Chroma's default distance metric (squared L2, not
    cosine — confirmed by inspecting raw values: a chunk matched against
    itself returns distance 0.0, and unrelated chunks return ~0.8-1.0+,
    which is L2's range, not cosine distance's ~0-2 range). Lower distance
    is more related; there is no clean "similarity score" to report without
    also changing the collection's indexing metric, so results are ranked
    and displayed by raw distance instead of inventing a similarity number.
    """
    if not CHROMA_DIR.exists():
        return "[No Chroma index found — run scripts/embed.py first]"

    rel_path = str(Path(note_path).resolve().relative_to(NOTES_DIR.resolve()))

    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

    target = collection.get(where={"source_file": rel_path}, include=["embeddings"])
    if not target["ids"]:
        return f"[No embeddings found for {rel_path} — run scripts/embed.py first]"

    target_projects = set()
    full_text = (NOTES_DIR / rel_path).read_text(encoding="utf-8")
    target_projects.update(_note_projects(full_text))

    best_by_note = {}  # source_file -> (distance, meta)
    for embedding in target["embeddings"]:
        results = collection.query(query_embeddings=[embedding], n_results=len(target["ids"]) + 10)
        for dist, meta in zip(results["distances"][0], results["metadatas"][0]):
            other_file = meta.get("source_file", "unknown")
            if other_file == rel_path:
                continue
            if other_file not in best_by_note or dist < best_by_note[other_file][0]:
                best_by_note[other_file] = (dist, meta)

    if not best_by_note:
        return "[No other notes to compare against]"

    same_project, other = [], []
    for other_file, (dist, meta) in best_by_note.items():
        other_projects = set(_note_projects(f"projects: {meta.get('projects', '')}"))
        if target_projects and target_projects & other_projects:
            same_project.append((other_file, dist))
        else:
            other.append((other_file, dist))

    same_project.sort(key=lambda x: x[1])  # lower distance = more related
    other.sort(key=lambda x: x[1])

    lines = [f"Related notes for '{rel_path}' (lower distance = more related):\n"]
    if target_projects:
        lines.append(f"Same project ({', '.join(sorted(target_projects))}):")
        if same_project:
            for f, d in same_project[:top_n]:
                lines.append(f"  - {f} (distance: {d:.2f})")
        else:
            lines.append("  (none)")
        lines.append("\nOther projects / unassigned:")
    else:
        lines.append("(no projects tagged — showing closest matches overall)")
    for f, d in other[:top_n]:
        lines.append(f"  - {f} (distance: {d:.2f})")

    return "\n".join(lines)
