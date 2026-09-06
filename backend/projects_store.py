"""
Project registry — active/archived project lifecycle, plus which notes are
currently tagged into each one. Shared by the Flask routes (projects_routes.py)
and the CLI (scripts/chat.py), same single-source-of-truth pattern as
scripts/config.py: one copy of this logic, not two drifting independently.

Rename cascades and rewrites every tagged note's `projects:` frontmatter
in place (Option A from the 2026-09-01 decision) rather than introducing a
stable project ID layer — see CLAUDE.md's "Future roadmap item — stable
project IDs" for why that indirection was rejected as premature at today's
scale (one real active project).
"""

from datetime import date
from pathlib import Path

import notes_store

PROJECT_ROOT = Path(__file__).parent.parent
PROJECTS_PATH = PROJECT_ROOT / "system" / "_data" / "projects.md"
PROJECTS_START = "<!-- PROJECTS_START -->"
PROJECTS_END = "<!-- PROJECTS_END -->"


def load_projects() -> dict:
    if not PROJECTS_PATH.exists():
        return {}

    text = PROJECTS_PATH.read_text(encoding="utf-8")
    start = text.find(PROJECTS_START)
    end = text.find(PROJECTS_END)
    if start == -1 or end == -1:
        return {}

    block = text[start + len(PROJECTS_START):end]
    projects = {}
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("- "):
            continue
        # Format: "- name: status, created YYYY-MM-DD[, archived YYYY-MM-DD]"
        name, _, rest = line[2:].partition(":")
        rest = rest.strip()
        status, _, _ = rest.partition(",")
        projects[name.strip()] = {"status": status.strip(), "line": rest}
    return projects


def save_projects(projects: dict) -> None:
    """Rewrite the registry block from {name: {"status": ..., "line": ...}}."""
    if PROJECTS_PATH.exists():
        text = PROJECTS_PATH.read_text(encoding="utf-8")
    else:
        text = f"{PROJECTS_START}\n{PROJECTS_END}\n"
        PROJECTS_PATH.parent.mkdir(parents=True, exist_ok=True)

    start = text.find(PROJECTS_START) + len(PROJECTS_START)
    end = text.find(PROJECTS_END)

    body = "\n".join(f"- {name}: {info['line']}" for name, info in projects.items())
    new_block = f"\n{body}\n" if projects else "\n"
    PROJECTS_PATH.write_text(text[:start] + new_block + text[end:], encoding="utf-8")


def _note_count(name: str) -> int:
    return sum(1 for n in notes_store.list_notes() if name in n.get("projects", []))


def _validate_name(name: str) -> str:
    """
    Project names are stored and displayed exactly as typed — no
    slugification, no separate display-name-vs-id split. The only real
    constraint is structural: a comma would corrupt the comma-delimited
    `projects: [a, b]` frontmatter list (see notes_store._parse_list_field),
    and a colon would corrupt this registry's own "name: status" line
    format (see load_projects' partition(":")). Everything else, spaces
    and casing included, is safe as-is.
    """
    name = (name or "").strip()
    if not name:
        raise ValueError("Project name is required")
    if "," in name or ":" in name:
        raise ValueError("Project names can't contain a comma or colon")
    return name


def _find_existing(name: str, projects: dict) -> str:
    """Case-insensitive lookup so 'Test Project' and 'test project' can't
    both exist as separate, easily-confused entries — but each project's
    originally-typed casing is still what gets stored and displayed."""
    lower = name.lower()
    for existing in projects:
        if existing.lower() == lower:
            return existing
    return None


def list_projects() -> list:
    projects = load_projects()
    return [
        {"name": name, "status": info["status"], "noteCount": _note_count(name)}
        for name, info in projects.items()
    ]


def create_project(name: str) -> dict:
    name = _validate_name(name)

    projects = load_projects()
    existing = _find_existing(name, projects)
    if existing:
        raise ValueError(f"Project '{existing}' already exists (status: {projects[existing]['status']})")

    projects[name] = {"status": "active", "line": f"active, created {date.today().isoformat()}"}
    save_projects(projects)
    return {"name": name, "status": "active", "noteCount": 0}


def archive_project(name: str) -> dict:
    """
    Flips a project's status to archived. Leaves every note's `projects:`
    label untouched — this only affects the registry entry, matching the
    CLI's existing behavior.
    """
    projects = load_projects()
    if name not in projects:
        raise ValueError(f"Project '{name}' not found")

    projects[name] = {"status": "archived", "line": f"archived, closed {date.today().isoformat()}"}
    save_projects(projects)
    return {"name": name, "status": "archived", "noteCount": _note_count(name)}


def rename_project(old_name: str, new_name: str) -> dict:
    """
    Renames the registry entry and rewrites `projects:` in every note that
    references the old name, so nothing is left pointing at a name that no
    longer exists in the registry. Preserves each note's other project
    tags and their order.
    """
    old_name = (old_name or "").strip()
    new_name = _validate_name(new_name)

    projects = load_projects()
    existing_old = _find_existing(old_name, projects)
    if not existing_old:
        raise ValueError(f"Project '{old_name}' not found")

    if new_name.lower() != existing_old.lower():
        existing_new = _find_existing(new_name, projects)
        if existing_new:
            raise ValueError(f"Project '{existing_new}' already exists")
    elif new_name == existing_old:
        return {"name": existing_old, "status": projects[existing_old]["status"], "noteCount": _note_count(existing_old)}

    projects[new_name] = projects.pop(existing_old)
    save_projects(projects)

    for note in notes_store.list_notes():
        if existing_old in note.get("projects", []):
            updated_projects = [new_name if p == existing_old else p for p in note["projects"]]
            notes_store.update_note(note["id"], {"projects": updated_projects})

    return {"name": new_name, "status": projects[new_name]["status"], "noteCount": _note_count(new_name)}
