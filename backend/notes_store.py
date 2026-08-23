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
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
NOTES_DIR = PROJECT_ROOT / "notes"

sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from chunking import parse_frontmatter  # noqa: E402

# Folders that exist under notes/ but aren't topic folders.
_NON_TOPIC_ENTRIES = {"template.md"}


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
        if p.is_dir()
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
        "source": _clean_scalar(frontmatter.get("source", "")),
        "url": _clean_scalar(frontmatter.get("url", "")),
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
        if file_path.name in _NON_TOPIC_ENTRIES:
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


def update_note_tags(note_id: str, tags: list) -> dict:
    file_path = _find_note_path(note_id)
    if not file_path.exists() or not file_path.is_file():
        return None

    content = file_path.read_text(encoding="utf-8")
    lines = content.split("\n")
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"Note has no frontmatter block: {note_id}")

    end_idx = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end_idx is None:
        raise ValueError(f"Note has an unterminated frontmatter block: {note_id}")

    new_tags_line = f"tags: [{', '.join(tags)}]"
    replaced = False
    for i in range(1, end_idx):
        if lines[i].split(":", 1)[0].strip() == "tags":
            lines[i] = new_tags_line
            replaced = True
            break
    if not replaced:
        lines.insert(end_idx, new_tags_line)
        end_idx += 1

    file_path.write_text("\n".join(lines), encoding="utf-8")
    return get_note(note_id)


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


def save_new_note(topic_folder: str, frontmatter_fields: dict, content: str) -> str:
    """Writes a new note to notes/{topic_folder}/{slug}.md. Raises
    ValueError if topic_folder isn't an existing taxonomy folder, or if
    the target file already exists (never silently overwrite)."""
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

    frontmatter_block = _format_frontmatter(frontmatter_fields)
    file_text = f"{frontmatter_block}\n\n{content.strip()}\n"
    target_path.write_text(file_text, encoding="utf-8")

    return _note_id_for(target_path)
