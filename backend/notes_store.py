"""
Shared file-based note storage helpers used by import_routes.py and
notes_routes.py.

Reuses scripts/chunking.py's parse_frontmatter() (the same hand-rolled,
non-YAML parser embed.py/chat.py already build the retrieval index on) so
listing/reading notes stays consistent with how they're actually chunked
and embedded — rather than introducing a second, different frontmatter
parser that could disagree with it on messy real notes.

Real notes in this project have inconsistent frontmatter (see
system/documentation/chunking-robustness-learnings.md): most have no
`title` field at all (the `source` field doubles as the title), a few
have a redundant `topic:` field, `date` mixes `YYYY-MM-DD` and
`YYYY.MM.DD`, `url` is sometimes absent/empty/quoted. This module derives
what it can (title, topic-from-folder) and passes the rest through as-is
rather than silently "fixing" real data.
"""

import re
import secrets
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
NOTES_DIR = PROJECT_ROOT / "notes"
TRASH_DIR = NOTES_DIR / ".trash"
TRASH_RETENTION_DAYS = 7

sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from chunking import parse_frontmatter  # noqa: E402

# Folders that exist under notes/ but aren't topic folders.
_NON_TOPIC_ENTRIES = {"template.md", ".trash"}


def _parse_list_field(raw: str) -> list:
    """
    Frontmatter list fields are written flow-style, e.g. "[a, b, c]" or
    "[]". parse_frontmatter() returns the raw string; this turns it into
    an actual list, stripping stray quotes around individual items.
    """
    if not raw:
        return []
    raw = raw.strip()
    if raw.startswith("[") and raw.endswith("]"):
        raw = raw[1:-1]
    items = [item.strip().strip('"').strip("'") for item in raw.split(",")]
    return [item for item in items if item]


def _clean_scalar(raw: str) -> str:
    """Strip optional surrounding quotes from a scalar frontmatter value."""
    if raw is None:
        return ""
    raw = raw.strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in ('"', "'"):
        return raw[1:-1]
    return raw


def slugify(text: str) -> str:
    """Matches the slug logic the frontend already uses in SuccessScreen."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def list_topics() -> list:
    """Topic folders, derived from the actual notes/ directory structure —
    the folder layout is the authoritative taxonomy (see CLAUDE.md)."""
    if not NOTES_DIR.exists():
        return []
    return sorted(
        p.name for p in NOTES_DIR.iterdir()
        if p.is_dir() and p.name not in _NON_TOPIC_ENTRIES
    )


def _note_id_for(file_path: Path) -> str:
    return str(file_path.relative_to(NOTES_DIR))


def _note_summary(file_path: Path) -> dict:
    content = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(content)

    title = _clean_scalar(frontmatter.get("title", ""))
    if not title:
        title = _clean_scalar(frontmatter.get("source", "")) or file_path.stem

    preview = body.strip()
    if len(preview) > 220:
        preview = preview[:220].rsplit(" ", 1)[0] + "…"

    return {
        "id": _note_id_for(file_path),
        "path": f"notes/{_note_id_for(file_path)}",
        "title": title,
        "author": _clean_scalar(frontmatter.get("author", "")),
        "source": _clean_scalar(frontmatter.get("source", "")),
        "date": _clean_scalar(frontmatter.get("date", "")),
        "type": _clean_scalar(frontmatter.get("type", "")),
        "topic": file_path.parent.name,
        "tags": _parse_list_field(frontmatter.get("tags", "")),
        "projects": _parse_list_field(frontmatter.get("projects", "")),
        "preview": preview,
    }


def list_notes(topic: str = None, tag: str = None) -> list:
    if not NOTES_DIR.exists():
        return []

    notes = []
    for file_path in NOTES_DIR.rglob("*.md"):
        if file_path.name in _NON_TOPIC_ENTRIES or ".trash" in file_path.relative_to(NOTES_DIR).parts:
            continue
        summary = _note_summary(file_path)
        if topic and summary["topic"] != topic:
            continue
        if tag and tag not in summary["tags"]:
            continue
        notes.append(summary)

    notes.sort(key=lambda n: n["title"].lower())
    return notes


def list_tags() -> list:
    """Actual union of tags in use across notes — not the documented
    controlled vocabulary in template.md, since real usage has drifted
    from it (see notes with topic-specific tags like
    "trust-calibration"). Reflects real data rather than the spec."""
    tags = set()
    for note in list_notes():
        tags.update(note["tags"])
    return sorted(tags)


def _find_note_path(note_id: str) -> Path:
    """note_id is the path relative to notes/, e.g.
    'design/error-recovery-patterns.md'."""
    candidate = (NOTES_DIR / note_id).resolve()
    if NOTES_DIR.resolve() not in candidate.parents:
        raise ValueError("Invalid note id")
    return candidate


def get_note(note_id: str) -> dict:
    file_path = _find_note_path(note_id)
    if not file_path.exists() or not file_path.is_file():
        return None

    content = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(content)
    summary = _note_summary(file_path)
    summary["content"] = body
    summary["frontmatter"] = frontmatter
    return summary


_SCALAR_FRONTMATTER_FIELDS = ("title", "author", "source", "date", "type")


def update_note(note_id: str, updates: dict) -> dict:
    """
    Updates any combination of a note's scalar frontmatter fields (title,
    source, url, date, type), tags, projects, content, and/or topic. Only
    keys present in `updates` are changed; everything else is left
    untouched.

    `topic` is not itself a frontmatter field — it's derived from which
    folder the file lives in (see _note_summary) — so changing it moves
    the file to the new topic folder rather than rewriting a line.
    """
    file_path = _find_note_path(note_id)
    if not file_path.exists() or not file_path.is_file():
        return None

    raw = file_path.read_text(encoding="utf-8")
    lines = raw.split("\n")
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"Note has no frontmatter block: {note_id}")

    end_idx = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end_idx is None:
        raise ValueError(f"Note has an unterminated frontmatter block: {note_id}")

    frontmatter_lines = lines[1:end_idx]
    body_lines = lines[end_idx + 1:]

    def _upsert(key: str, value_line: str):
        for i, line in enumerate(frontmatter_lines):
            if line.split(":", 1)[0].strip() == key:
                frontmatter_lines[i] = value_line
                return
        frontmatter_lines.append(value_line)

    for key in _SCALAR_FRONTMATTER_FIELDS:
        if key in updates:
            _upsert(key, f"{key}: {updates[key]}")

    if "tags" in updates:
        _upsert("tags", f"tags: [{', '.join(updates['tags'])}]")

    if "projects" in updates:
        _upsert("projects", f"projects: [{', '.join(updates['projects'])}]")

    if "content" in updates:
        body_lines = updates["content"].strip("\n").split("\n")

    new_text = "\n".join(["---", *frontmatter_lines, "---", *body_lines]).rstrip("\n") + "\n"
    file_path.write_text(new_text, encoding="utf-8")

    if "topic" in updates and updates["topic"] != file_path.parent.name:
        new_topic = updates["topic"]
        if new_topic not in list_topics():
            raise ValueError(f"Unknown topic folder: {new_topic}")
        new_path = NOTES_DIR / new_topic / file_path.name
        if new_path.exists():
            raise FileExistsError(f"A note already exists at notes/{new_topic}/{file_path.name}")
        file_path.rename(new_path)
        file_path = new_path

    return get_note(_note_id_for(file_path))


def _format_frontmatter(fields: dict) -> str:
    """Serializes in the same flow-style used across real notes:
    `key: value` scalars, `key: [a, b]` lists, blank line omitted for
    empty optional fields rather than writing `key:` with nothing after."""
    lines = ["---"]
    for key, value in fields.items():
        if isinstance(value, list):
            lines.append(f"{key}: [{', '.join(value)}]")
        else:
            value = value or ""
            # Quote scalars containing a colon so they don't get
            # misread as a second key on the same line.
            if ":" in value:
                value = f'"{value}"'
            lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines)


def _generate_note_id() -> str:
    """Short random id, stamped once at creation and never touched again.
    Not used as a lookup key anywhere yet — the filename/path is still
    the real identity everywhere in this codebase today. This exists so
    a future citation system (e.g. the planned Verifier Agent, or any
    other durable reference into a specific note) has something stable
    to point at instead of a path that can change whenever notes get
    reorganized — see system/session-log.md Session 28 for the full
    reasoning on why a full path-to-id migration wasn't done now."""
    return secrets.token_hex(4)


def save_new_note(topic_folder: str, frontmatter_fields: dict, content: str) -> str:
    """Writes a new note to notes/{topic_folder}/{slug}.md. Raises
    ValueError if topic_folder isn't an existing taxonomy folder, or if
    the target file already exists (never silently overwrite). Stamps a
    stable `id:` field (see _generate_note_id) unless the caller already
    supplied one."""
    if topic_folder not in list_topics():
        raise ValueError(f"Unknown topic folder: {topic_folder}")

    title = frontmatter_fields.get("title") or frontmatter_fields.get("source") or "untitled"
    slug = slugify(title)
    if not slug:
        raise ValueError("Could not derive a filename from the note's title/source")

    target_dir = NOTES_DIR / topic_folder
    target_path = target_dir / f"{slug}.md"
    if target_path.exists():
        raise FileExistsError(f"A note already exists at notes/{topic_folder}/{slug}.md")

    frontmatter_fields = {"id": _generate_note_id(), **frontmatter_fields}
    frontmatter_block = _format_frontmatter(frontmatter_fields)
    file_text = f"{frontmatter_block}\n\n{content.strip()}\n"
    target_path.write_text(file_text, encoding="utf-8")

    return _note_id_for(target_path)


def _set_frontmatter_line(file_path: Path, key: str, value: str = None):
    """Adds/updates/removes a single frontmatter line in place. value=None
    removes the line entirely (used to strip trashed_at on restore)."""
    lines = file_path.read_text(encoding="utf-8").split("\n")
    end_idx = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    frontmatter_lines = lines[1:end_idx]
    body_lines = lines[end_idx + 1:]

    frontmatter_lines = [l for l in frontmatter_lines if l.split(":", 1)[0].strip() != key]
    if value is not None:
        frontmatter_lines.append(f"{key}: {value}")

    new_text = "\n".join(["---", *frontmatter_lines, "---", *body_lines]).rstrip("\n") + "\n"
    file_path.write_text(new_text, encoding="utf-8")


def trash_note(note_id: str) -> str:
    """Moves a note's file into notes/.trash/<topic>/<filename>, tagging it
    with a trashed_at timestamp so purge_expired_trash() knows its age.
    Returns the note's trash id (same relative path, rooted at .trash/)."""
    file_path = _find_note_path(note_id)
    if not file_path.exists() or not file_path.is_file():
        return None

    trash_path = TRASH_DIR / note_id
    trash_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.rename(trash_path)
    _set_frontmatter_line(trash_path, "trashed_at", datetime.now(timezone.utc).isoformat())

    return note_id


def list_trash() -> list:
    if not TRASH_DIR.exists():
        return []

    trashed = []
    for file_path in TRASH_DIR.rglob("*.md"):
        summary = _note_summary(file_path)
        summary["id"] = str(file_path.relative_to(TRASH_DIR))
        summary["path"] = f"notes/.trash/{summary['id']}"
        summary["topic"] = file_path.parent.relative_to(TRASH_DIR).as_posix()
        content = file_path.read_text(encoding="utf-8")
        frontmatter, _ = parse_frontmatter(content)
        summary["trashed_at"] = _clean_scalar(frontmatter.get("trashed_at", ""))
        trashed.append(summary)

    trashed.sort(key=lambda n: n["trashed_at"], reverse=True)
    return trashed


def restore_note(trash_id: str) -> dict:
    """Moves a note back from notes/.trash/<topic>/<filename> to its
    original notes/<topic>/<filename> location, stripping trashed_at."""
    trash_path = (TRASH_DIR / trash_id).resolve()
    if TRASH_DIR.resolve() not in trash_path.parents:
        raise ValueError("Invalid trash id")
    if not trash_path.exists() or not trash_path.is_file():
        return None

    restored_path = NOTES_DIR / trash_id
    if restored_path.exists():
        raise FileExistsError(f"A note already exists at notes/{trash_id} — can't restore over it")

    restored_path.parent.mkdir(parents=True, exist_ok=True)
    trash_path.rename(restored_path)
    _set_frontmatter_line(restored_path, "trashed_at", None)

    return get_note(trash_id)


def purge_expired_trash(days: int = TRASH_RETENTION_DAYS) -> list:
    """Permanently deletes trashed notes older than `days`. Called lazily
    (on backend startup) rather than on a schedule — this is a local
    single-user tool with no background worker, so "purge weekly" means
    "purge anything old enough, next time the app happens to start."
    Returns the note ids that were purged, so callers can also drop their
    embeddings (already removed at trash-time, but kept here for safety)."""
    if not TRASH_DIR.exists():
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    purged = []
    for file_path in TRASH_DIR.rglob("*.md"):
        content = file_path.read_text(encoding="utf-8")
        frontmatter, _ = parse_frontmatter(content)
        trashed_at = _clean_scalar(frontmatter.get("trashed_at", ""))
        try:
            trashed_dt = datetime.fromisoformat(trashed_at)
        except ValueError:
            continue
        if trashed_dt < cutoff:
            note_id = str(file_path.relative_to(TRASH_DIR))
            file_path.unlink()
            purged.append(note_id)

    return purged
