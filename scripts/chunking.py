#!/usr/bin/env python3
"""
Personal Knowledge Retriever — Chunking

Splits a note's body into retrieval chunks per the Phase 4 decision
(see system/session-log.md, Session 8 and 9):

1. Notes <= LINE_THRESHOLD lines: keep as one chunk.
2. Notes with real ## headers: split at ## boundaries.
3. Notes > LINE_THRESHOLD lines without ## headers: split at bold-label
   lines (e.g. "**Re: Topic**", "Latency:").
4. Fallback: notes over the threshold with no ## headers and no detected
   bold-labels split at paragraph breaks (blank lines) instead, so long
   unstructured content never silently ships as one diluted chunk. This
   is a real gap our hand-tuned rule would otherwise hit on any note
   whose structure doesn't match the 26 notes it was tuned against
   (pasted emails, Slack threads, plain prose with no labels, etc.).
5. No overlap between chunks.

LINE_THRESHOLD is a starting default (see session log for reasoning),
not yet tuned against the eval set.
"""

import re
from dataclasses import dataclass, field
from pathlib import Path

LINE_THRESHOLD = 30  # non-blank body lines; see system/session-log.md Session 8/9

# A line that functions as a bold-label section header, e.g.:
#   Latency:
#   **Re: Communication**
#   **Critical limitation:**
BOLD_LABEL_RE = re.compile(
    r"^(\*\*[^*\n]{1,80}\*\*:?|[A-Za-z][A-Za-z /-]{0,40}:)\s*$"
)
H2_RE = re.compile(r"^## +(.*)$")

# Fallback split target when no ## headers or bold-labels are found on a
# long note. A paragraph group is capped at roughly this many non-blank
# lines before being cut, so no single fallback chunk still balloons past
# the size that motivated splitting in the first place.
FALLBACK_PARAGRAPH_CAP = 15


@dataclass
class Chunk:
    source_file: str       # relative path, e.g. "ai-products/pm-playbook-shipping-ai-features.md"
    section_title: str      # header/label text, or "" for whole-note / untitled chunks
    text: str                # chunk body (no frontmatter)
    frontmatter: dict = field(default_factory=dict)


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Split YAML frontmatter (first --- ... --- block only) from the body."""
    lines = content.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, content

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break

    if end_idx is None:
        return {}, content

    frontmatter = {}
    for line in lines[1:end_idx]:
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        frontmatter[key.strip()] = value.strip()

    body = "\n".join(lines[end_idx + 1:]).strip("\n")
    return frontmatter, body


def _split_at_matches(body: str, is_boundary) -> list[tuple[str, str]]:
    """
    Split body into (title, text) pairs at lines where is_boundary(line)
    returns a title string, or None if not a boundary line.
    Text before the first boundary (if any) is kept as its own untitled chunk.
    """
    lines = body.split("\n")
    sections: list[tuple[str, list[str]]] = []
    current_title = ""
    current_lines: list[str] = []

    for line in lines:
        title = is_boundary(line)
        if title is not None:
            if current_lines:
                sections.append((current_title, current_lines))
            current_title = title
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_title, current_lines))

    return [(title, "\n".join(text_lines).strip("\n")) for title, text_lines in sections]


def _split_by_paragraph(body: str, cap: int) -> list[tuple[str, str]]:
    """
    Fallback for long notes with no ## headers and no detected bold-labels.
    Groups paragraphs (blank-line-separated blocks) together until the
    running non-blank line count would exceed `cap`, then starts a new
    chunk. Never splits inside a paragraph.
    """
    paragraphs = re.split(r"\n\s*\n", body.strip("\n"))
    paragraphs = [p for p in paragraphs if p.strip()]

    groups: list[list[str]] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len([l for l in para.split("\n") if l.strip()])
        if current and current_len + para_len > cap:
            groups.append(current)
            current = [para]
            current_len = para_len
        else:
            current.append(para)
            current_len += para_len

    if current:
        groups.append(current)

    return [("", "\n\n".join(g)) for g in groups]


def chunk_note(file_path: Path, notes_dir: Path) -> list[Chunk]:
    """Chunk a single note file per the decided rule."""
    content = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(content)
    rel_path = str(file_path.relative_to(notes_dir))

    body_lines = [l for l in body.split("\n") if l.strip()]
    has_h2 = any(H2_RE.match(line) for line in body.split("\n"))

    # Rule 1: short notes stay whole, regardless of internal labels
    if len(body_lines) <= LINE_THRESHOLD and not has_h2:
        return [Chunk(source_file=rel_path, section_title="", text=body, frontmatter=frontmatter)]

    # Rule 2: real ## headers take priority when present
    if has_h2:
        def h2_boundary(line: str):
            m = H2_RE.match(line)
            return m.group(1).strip() if m else None

        sections = _split_at_matches(body, h2_boundary)
    # Rule 3: long notes without ## headers split at bold-label lines
    else:
        def label_boundary(line: str):
            return line.strip().rstrip(":").strip("*").strip() if BOLD_LABEL_RE.match(line.strip()) else None

        sections = _split_at_matches(body, label_boundary)

    # Rule 4 (fallback): no ## headers and no usable bold-labels were found
    # on a note over the threshold — split by paragraph instead of silently
    # keeping a long, unstructured note as one diluted chunk.
    if len(sections) <= 1:
        sections = _split_by_paragraph(body, FALLBACK_PARAGRAPH_CAP)

    # If even the fallback produced only one group (a genuinely short or
    # single-paragraph note that happened to exceed the line threshold),
    # keep it whole.
    if len(sections) <= 1:
        return [Chunk(source_file=rel_path, section_title="", text=body, frontmatter=frontmatter)]

    return [
        Chunk(source_file=rel_path, section_title=title, text=text, frontmatter=frontmatter)
        for title, text in sections
        if text.strip()
    ]


def chunk_all_notes(notes_dir: Path) -> list[Chunk]:
    chunks = []
    for note_file in sorted(notes_dir.rglob("*.md")):
        if note_file.name == "template.md":
            continue
        if ".trash" in note_file.relative_to(notes_dir).parts:
            continue
        chunks.extend(chunk_note(note_file, notes_dir))
    return chunks


if __name__ == "__main__":
    project_root = Path(__file__).parent.parent
    notes_dir = project_root / "notes"

    all_chunks = chunk_all_notes(notes_dir)

    print(f"Chunked {len({c.source_file for c in all_chunks})} notes into {len(all_chunks)} chunks.\n")

    # Spot-check: show every note that got split into more than one chunk
    from collections import defaultdict
    by_file = defaultdict(list)
    for c in all_chunks:
        by_file[c.source_file].append(c)

    split_files = {f: cs for f, cs in by_file.items() if len(cs) > 1}
    print(f"{len(split_files)} notes were split into multiple chunks:\n")
    for f, cs in split_files.items():
        print(f"  {f} -> {len(cs)} chunks")
        for c in cs:
            title = c.section_title or "(untitled)"
            print(f"      - {title!r} ({len(c.text.splitlines())} lines)")
        print()
