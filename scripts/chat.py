#!/usr/bin/env python3
"""
Personal Knowledge Retriever — Chat interface
Loads your notes and talks with you about them.
"""

import argparse
import os
import re
import sys
import time
from datetime import date
from pathlib import Path
from dotenv import load_dotenv
import anthropic
import chromadb
from openai import OpenAI

# Load API key from .env
load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in .env")
    sys.exit(1)

client = anthropic.Anthropic(api_key=api_key)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
NOTES_DIR = PROJECT_ROOT / "notes"
PROMPTS_DIR = PROJECT_ROOT / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "system.txt"
CHROMA_DIR = PROJECT_ROOT / "system" / "_data" / "chroma_db"
PROJECTS_PATH = PROJECT_ROOT / "system" / "_data" / "projects.md"
GOALS_DIR = PROJECT_ROOT / "system" / "_data" / "goals"
COLLECTION_NAME = "notes"
EMBEDDING_MODEL = "text-embedding-3-small"
PROJECTS_START = "<!-- PROJECTS_START -->"
PROJECTS_END = "<!-- PROJECTS_END -->"

if not SYSTEM_PROMPT_PATH.exists():
    print(f"ERROR: System prompt not found at {SYSTEM_PROMPT_PATH}")
    sys.exit(1)

with open(SYSTEM_PROMPT_PATH, "r") as f:
    SYSTEM_PROMPT = f.read()


def load_projects() -> dict:
    """
    Parse the project registry between the PROJECTS_START/END markers.
    Returns {name: {"status": str, "line": str}} — "line" is the full
    detail text after "name: " (e.g. "active, created 2026-08-05"),
    preserved verbatim so rewriting one project's line never drops
    another project's date detail.
    """
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
    """
    Rewrite the registry block from {name: {"status": ..., "line": ...}}.
    """
    text = PROJECTS_PATH.read_text(encoding="utf-8")
    start = text.find(PROJECTS_START) + len(PROJECTS_START)
    end = text.find(PROJECTS_END)

    body = "\n".join(f"- {name}: {info['line']}" for name, info in projects.items())
    new_block = f"\n{body}\n" if projects else "\n"
    PROJECTS_PATH.write_text(text[:start] + new_block + text[end:], encoding="utf-8")


def new_project(name: str) -> None:
    """
    Register a new active project. Refuses to create a duplicate.
    """
    projects = load_projects()
    if name in projects:
        print(f"ERROR: project '{name}' already exists (status: {projects[name]['status']})")
        sys.exit(1)

    projects[name] = {
        "status": "active",
        "line": f"active, created {date.today().isoformat()}",
    }

    save_projects(projects)
    print(f"Created project '{name}' (active).")


def archive_project(name: str) -> None:
    """
    Flip a project's status to archived. Leaves every note's `projects:`
    label untouched — this only affects the registry entry.
    """
    projects = load_projects()
    if name not in projects:
        print(f"ERROR: project '{name}' not found in {PROJECTS_PATH}")
        sys.exit(1)
    if projects[name]["status"] == "archived":
        print(f"Project '{name}' is already archived.")
        return

    projects[name] = {
        "status": "archived",
        "line": f"archived, closed {date.today().isoformat()}",
    }

    save_projects(projects)
    print(f"Archived project '{name}'. Note labels are unchanged.")


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


def search_notes(query: str, project: str = None) -> tuple:
    """
    Keyword search across all notes with section-aware preview.
    Respects ## section boundaries for consolidated files.

    Returns (context_string, top_note_path). top_note_path is the
    relative path (str) of the highest-ranked match, or None if there
    were no matches — lets callers offer follow-on actions (e.g.
    suggest_related()) on the single best result without re-parsing
    the formatted context string.
    """
    if not NOTES_DIR.exists():
        return "[No notes directory found]", None

    relevant_items = []
    # Strip punctuation so "goals?" matches "goals" in content
    query_words = re.findall(r"[a-z0-9']+", query.lower())

    for note_file in NOTES_DIR.rglob("*.md"):
        with open(note_file, "r", encoding="utf-8") as f:
            content = f.read()

        if project and project not in _note_projects(content):
            continue

        # Count keyword matches
        matches = sum(1 for word in query_words if word in content.lower())
        if matches > 0:
            # Extract a section-aware preview: frontmatter + intro + first section
            lines = content.split("\n")
            preview_lines = []
            section_count = 0

            # Pull content: frontmatter (---), intro text, and first full section
            for i, line in enumerate(lines):
                preview_lines.append(line)

                # Count section headers (##)
                if line.startswith("## "):
                    section_count += 1
                    # Stop after capturing the first section
                    if section_count > 1:
                        break

                # Safety limit: don't pull entire file even if no second header
                if i > 120:
                    break

            relevant_items.append({
                "file": note_file.name,
                "path": note_file.relative_to(NOTES_DIR),
                "matches": matches,
                "preview": "\n".join(preview_lines)
            })

    # Sort by match count
    relevant_items.sort(key=lambda x: x["matches"], reverse=True)

    if not relevant_items:
        return "[No matching notes found]", None

    # Build context
    context_parts = []
    for item in relevant_items[:5]:  # Top 5 matches
        context_parts.append(f"=== {item['path']} ===\n{item['preview']}\n")

    top_note_path = str(relevant_items[0]["path"])
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
    if not CHROMA_DIR.exists():
        return "[No Chroma index found — run scripts/embed.py first]", None

    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

    query_embedding = openai_client.embeddings.create(
        model=EMBEDDING_MODEL, input=[query]
    ).data[0].embedding

    n_results = 25 if project else 5
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)

    if not results["ids"] or not results["ids"][0]:
        return "[No matching notes found]", None

    context_parts = []
    top_note_path = None
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        if project and project not in _note_projects(f"projects: {meta.get('projects', '')}"):
            continue
        source_path = meta.get("source_file", "unknown")
        if top_note_path is None:
            top_note_path = source_path
        context_parts.append(f"=== {source_path} ===\n{doc}\n")
        if len(context_parts) == 5:
            break

    if not context_parts:
        return "[No matching notes found]", None

    return "\n".join(context_parts), top_note_path


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


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60]


def _ask_claude(prompt: str, max_tokens: int = 1024, temperature: float = None) -> str:
    """
    temperature=None leaves the API default (1) — used for exploratory
    steps like goal-scoping, where some variation in phrasing/suggestions
    is fine. Pass temperature=0 for judgment/classification steps (e.g.
    "is this item covered, yes or no") where a consistent answer matters
    more than variety.
    """
    kwargs = {"model": "claude-haiku-4-5-20251001", "max_tokens": max_tokens,
              "messages": [{"role": "user", "content": prompt}]}
    if temperature is not None:
        kwargs["temperature"] = temperature
    response = client.messages.create(**kwargs)
    return response.content[0].text


def _closest_match(candidate: str, valid_items: list, threshold: float = 0.6):
    """
    Find the item in valid_items that candidate most likely refers to, using
    word-overlap similarity — not an exact string match, since Claude may
    paraphrase an item slightly even when "re-checking" the same list.
    Returns None if nothing clears the threshold, which is the case that
    matters here: it means Claude invented an item outside the real list,
    and it must be discarded rather than silently counted.
    """
    candidate_words = set(re.findall(r"[a-z0-9']+", candidate.lower()))
    if not candidate_words:
        return None

    best_item, best_score = None, 0.0
    for item in valid_items:
        item_words = set(re.findall(r"[a-z0-9']+", item.lower()))
        if not item_words:
            continue
        overlap = len(candidate_words & item_words)
        score = overlap / min(len(candidate_words), len(item_words))
        if score > best_score:
            best_item, best_score = item, score

    return best_item if best_score >= threshold else None


def _validate_against(items_with_sources: list, valid_items: list, valid_sources: list = None) -> list:
    """
    Keep only the items that genuinely match something in valid_items,
    mapped to that item's exact original wording — enforces in code what
    the prompt only requests, since a model asked to "only use items from
    this list" will still sometimes invent new ones. Returns (item, source,
    caveat) tuples; a cited source is dropped (set to None) unless it's a
    path we actually retrieved this round — a citation to a file that was
    never shown to the model can't be trusted any more than an invented
    item. caveat passes through unchanged — it's Claude's own quality
    flag, not something code can verify.
    """
    validated = []
    for item, source, caveat in items_with_sources:
        match = _closest_match(item, valid_items)
        if not match or match in [v[0] for v in validated]:
            continue
        if source and valid_sources and source not in valid_sources:
            source = None
        validated.append((match, source, caveat))
    return validated


def _parse_labeled_list(text: str, label: str) -> list:
    """
    Pull items out of a "LABEL:" block in Claude's response, one per
    numbered/bulleted line, up to the next all-caps "WORD:" header or
    end of text. A line may carry a trailing "[source: <path>]" and/or
    "[caveat: <text>]" tag, in either order; each is split off into its
    own field (None if absent). caveat is Claude's own flag that a
    "covered" match is thin/generic rather than a solid, on-topic hit —
    e.g. a generic discovery-methodology note answering an AI-specific
    question. Returns (item, source, caveat) tuples.
    """
    block_match = re.search(rf"{label}:\s*\n(.*?)(?:\n[A-Z ]+:|\Z)", text, re.DOTALL)
    if not block_match:
        return []
    items = []
    for line in block_match.group(1).split("\n"):
        line = line.strip()
        m = re.match(r"^(?:[-*]|\d+\.)\s+(.+)", line)
        if not m:
            continue
        item_text = m.group(1).strip()

        caveat = None
        caveat_match = re.search(r"\[caveat:\s*(.+?)\]\s*$", item_text)
        if caveat_match:
            item_text = item_text[:caveat_match.start()].strip()
            caveat = caveat_match.group(1).strip()

        source = None
        source_match = re.search(r"\[source:\s*(.+?)\]\s*$", item_text)
        if source_match:
            item_text = item_text[:source_match.start()].strip()
            source = source_match.group(1).strip()

        items.append((item_text, source, caveat))
    return items


def _extract_retrieved_paths(context: str) -> list:
    """Pull the source-file paths out of search_notes_semantic()'s '=== path ===' headers."""
    return re.findall(r"^=== (.+?) ===$", context, re.MULTILINE)


def scope_goal(goal: str, max_exchanges: int = 4, auto_narrow: bool = False) -> str:
    """
    Iteratively narrow a stated goal until Claude judges it specific enough
    for gap-finding against a personal notes corpus to be diagnostic (i.e.
    actually about what's IN or MISSING from the notes, not generic
    advice-giving Claude would produce the same way with zero notes at
    all) — OR the user says to stop narrowing and use the current version.

    Like research_goal()'s own stopping condition, the real end state is
    "the model judges this specific enough" or "the user says stop"; the
    max_exchanges cap is a safety net against endless back-and-forth, not
    the real termination condition.

    If auto_narrow=True, auto-accepts the first narrowing suggestion instead
    of prompting the user (used for eval/non-interactive contexts).
    """
    current = goal
    for _ in range(max_exchanges):
        prompt = f"""A user wants to run a gap-analysis of their personal notes against this goal:

GOAL: {current}

A goal is "too broad" for this purpose if answering it would rely mostly on
general knowledge of the topic rather than on what's actually inside a
specific person's notes — i.e. the gap list would look about the same
whether or not their notes existed at all.

If the goal is too broad, respond with exactly one line:
SUGGESTION: <a narrower, still-plausible version of this same goal, scoped
to something a personal notes collection could realistically be checked
against>

If the goal is already specific enough, respond with exactly:
SPECIFIC"""

        print("⏳ Analyzing your goal...")
        response_text = _ask_claude(prompt, max_tokens=200)
        if "SUGGESTION:" not in response_text:
            return current

        suggestion = response_text.split("SUGGESTION:", 1)[1].strip()
        print(f"\nThat goal is broad enough that the gap list would look similar with or without your notes.")
        print(f"Suggested narrower framing: \"{suggestion}\"")

        if auto_narrow:
            choice = "y"
        else:
            choice = input("Use this (y), keep current and stop narrowing (n), type your own to refine, or '.' to use original goal as-is: ").strip()

        if choice.lower() == "n":
            return current
        if choice.lower() in [".", "original", "use original"]:
            # User override: use the original goal as stated, stop narrowing
            return goal
        if choice.lower() == "y" or not choice:
            current = suggestion
        else:
            current = choice
        # loop again — Claude re-judges whichever goal we now have

    print(f"Reached {max_exchanges} rounds of narrowing — using the current version.")
    return current


def research_goal(goal: str, max_rounds: int = 3, auto_narrow: bool = False) -> str:
    """
    Layer 4 taste: an iterative research loop against a stated goal.

    Round 1 asks Claude to lay out the FULL set of things the goal needs
    (the denominator) and mark each covered/open against retrieved notes —
    not just a one-sided "what's missing" list, which has no real total to
    report a coverage tally against. Later rounds re-search only on the
    open items and re-ask against the SAME original list, so the
    denominator stays stable across rounds. Stops early if a round closes
    zero additional items (diminishing returns) — the max_rounds cap is a
    safety net against noisy output looping forever, not the real stopping
    condition.

    Explicitly a small personal prototype, not a claim this role would
    build Layer 4 — the job ad names it as the company's long-term
    destination, built by a later stage, not this squad's near-term scope.

    If auto_narrow=True, auto-accepts narrowing suggestions instead of
    prompting the user (used for eval/non-interactive contexts).
    """
    # Feature 1: Upfront expectation-setting prompt
    print("\n" + "="*60)
    print("📚 Personal Goal Research — Powered by Your Notes")
    print("="*60)
    print("""
This tool searches YOUR NOTES (not the web) for gaps against a goal you define.

How it works:
  1. You describe a goal or question
  2. I refine it with you to make sure I understand your focus
  3. I search your notes across multiple rounds, narrowing gaps each time
  4. You see what's covered and what's still missing in your notes

Your notes capture YOUR thinking and experience — so gaps that aren't
covered often mean you need external sources (books, articles, interviews)
or that's an area you haven't explored yet.
""")

    scoped_goal = scope_goal(goal, auto_narrow=auto_narrow)

    # Feature 2: Process flow explanation
    print("\n" + "─"*60)
    print("Starting Research Loop...")
    print("─"*60)
    print(f"""
Now I'll search your notes to find what's covered vs. open for your goal:

📍 GOAL: {scoped_goal}

HOW THE SEARCH WORKS:

  Round 1: Search your notes for items that directly match your goal
           → Show you what's covered and what's missing

  Round 2: Search specifically for the gaps found in Round 1
           → Find new coverage. If nothing new appears, stop early.

  Round 3: Final pass on remaining gaps (if Round 2 found new items)
           → Compile your final results

Why multiple rounds? Each search refines based on what's already covered,
helping me avoid missing notes by searching too broadly the first time.

Estimated time: 1-2 minutes. Watch for progress updates below.
""")
    print("─"*60 + "\n")

    GOALS_DIR.mkdir(parents=True, exist_ok=True)
    goal_path = GOALS_DIR / f"{_slugify(scoped_goal)}.md"

    round_log = []
    all_items = []          # the full, stable requirements list (the denominator)
    covered_sources = {}    # item -> (source file path or None, caveat or None)
    open_items = []

    for round_num in range(1, max_rounds + 1):
        queries = open_items if round_num > 1 else [scoped_goal]

        # Feature 3: Show query terms being used
        round_start_time = time.time()
        if round_num == 1:
            print(f"Round {round_num}: Searching for: '{scoped_goal}'")
        else:
            query_preview = ", ".join([f"'{q}'" for q in queries[:3]])
            if len(queries) > 3:
                query_preview += f", ... and {len(queries) - 3} more"
            print(f"Round {round_num}: Searching for gaps like: {query_preview}")

        seen_context = set()
        combined_context = []
        for query in queries:
            context, _ = search_notes_semantic(query)
            if context not in seen_context:
                seen_context.add(context)
                combined_context.append(context)
        retrieved = "\n".join(combined_context)
        note_count = len(combined_context)
        retrieved_paths = _extract_retrieved_paths(retrieved)

        if round_num == 1:
            prompt = f"""GOAL: {scoped_goal}

RETRIEVED NOTES:
{retrieved}

List the full set of things someone would need to know or have in order to
achieve this goal — not just what's missing, everything, including what IS
already covered by the retrieved notes above.

Mark an item COVERED only if the retrieved notes substantively address it
(real detail, not a passing one-word mention). If a note only briefly
touches on something without real depth, list it under OPEN instead.
For every COVERED item, cite the exact "=== path ===" it came from, in the
format shown below.

Additionally, if a COVERED item's source note is generic — i.e. it answers
the general topic but isn't specific to the goal's actual subject (for
example, a general product-discovery note "covering" a question that asks
specifically about AI products) — add a caveat tag noting that, in the
format shown below. Leave the caveat tag off if the note is genuinely
on-topic, not just generically related.

Respond in exactly this format:
COVERED:
- <item substantively covered by the retrieved notes> [source: <path>] [caveat: <why this is thin or off-topic, if applicable>]
OPEN:
- <item NOT covered, or only mentioned in passing>"""
        else:
            prompt = f"""GOAL: {scoped_goal}

FULL REQUIREMENTS LIST (established in round 1):
{chr(10).join(f"- {item}" for item in all_items)}

NEWLY RETRIEVED NOTES (searched using the previously-open items as queries):
{retrieved}

Re-check each item in the full requirements list above against these newly
retrieved notes. Mark an item COVERED only if the notes substantively
address it, not just mention it in passing. For every COVERED item, cite
the exact "=== path ===" it came from.

Additionally, if a COVERED item's source note is generic — i.e. it answers
the general topic but isn't specific to the goal's actual subject — add a
caveat tag noting that. Leave the caveat tag off if the note is genuinely
on-topic.

Respond in exactly this format, using the SAME items from the full
requirements list — do not invent new items:
COVERED:
- <item now substantively covered, from the full list above> [source: <path>] [caveat: <why this is thin or off-topic, if applicable>]
OPEN:
- <item still not covered, from the full list above>"""

        response_text = _ask_claude(prompt, temperature=0)
        round_covered = _parse_labeled_list(response_text, "COVERED")
        round_open = _parse_labeled_list(response_text, "OPEN")

        if round_num == 1:
            all_items = [item for item, _, _ in round_covered] + [item for item, _, _ in round_open]
            # Deduplicate while preserving order (in case model stated same item twice)
            all_items = list(dict.fromkeys(all_items))

        # Enforce in code what the prompt only requests: discard anything
        # that isn't a genuine match to the round-1 list, so covered can
        # never exceed len(all_items). A cited source is only trusted if
        # it's a path actually retrieved this round. An uncited "covered"
        # claim is no more trustworthy than an invented item, so it's
        # demoted — dropped here, meaning it falls through to open below.
        validated_covered = _validate_against(round_covered, all_items, retrieved_paths)
        covered_sources.update({item: (source, caveat) for item, source, caveat in validated_covered if source})

        # open_items is always computed fresh from the two things already
        # trusted (all_items, covered_sources) rather than patched together
        # from this round's lists — anything not covered is open, full
        # stop, so nothing can be double-counted or silently dropped.
        open_items = [i for i in all_items if i not in covered_sources]

        round_log.append({
            "round": round_num,
            "queries": list(queries),
            "notes_retrieved": note_count,
            "covered_count": len(covered_sources),
            "open_count": len(open_items),
        })

        # Feature 4 & 5: Add timing to output and explicit fallback notification
        elapsed_time = time.time() - round_start_time
        print(f"  └─ Retrieved: {note_count} note section(s)")
        print(f"  └─ Coverage: {len(covered_sources)}/{len(all_items)} ({len(open_items)} gaps remain)")
        print(f"  └─ [completed in {elapsed_time:.1f}s]\n")

        if round_num > 1 and len(covered_sources) == round_log[-2]["covered_count"]:
            print(f"⚠️  Round {round_num} found zero new items. Stopping here.")
            print("Why? Searching further would hit diminishing returns—your notes likely don't cover these gaps.")
            print("What this means: The remaining gaps probably need external sources or aren't in your notes.\n")
            break
        if not open_items:
            print("✓ All items covered — stopping early.\n")
            break

    # Persist goal + round history to a markdown file
    lines = [f"# Research Goal: {scoped_goal}", ""]
    if scoped_goal != goal:
        lines.append(f"(Originally stated as: \"{goal}\")")
        lines.append("")
    lines.append(f"Last run: {date.today().isoformat()}")
    lines.append("")
    lines.append(f"## Coverage: {len(covered_sources)}/{len(all_items)}")
    lines.append("")
    lines.append("### Covered (with source notes — review these again as part of your goal process)")
    for item in sorted(covered_sources):
        source, caveat = covered_sources[item]
        line = f"- {item} — *{source}*" if source else f"- {item} — *(source not cited)*"
        if caveat:
            line += f" — caveat: *{caveat}*"
        lines.append(line)
    lines.append("")
    lines.append("### Still Open")
    for item in open_items:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## Round History")
    for r in round_log:
        lines.append(f"### Round {r['round']}")
        lines.append(f"Searched: {', '.join(r['queries'])}")
        lines.append(f"Notes retrieved: {r['notes_retrieved']}")
        lines.append(f"Coverage after this round: {r['covered_count']}/{len(all_items)}")
        lines.append("")
    goal_path.write_text("\n".join(lines), encoding="utf-8")

    # Build structured result (for eval and programmatic use)
    result = {
        "original_goal": goal,
        "narrowed_goal": scoped_goal,
        "all_items": all_items,
        "covered_items": covered_sources,  # dict: item -> (source, caveat)
        "open_items": open_items,
        "coverage_count": len(covered_sources),
        "total_count": len(all_items),
        "round_log": round_log,
        "markdown_path": str(goal_path.relative_to(PROJECT_ROOT)),
    }

    # Build human-readable summary (for CLI output)
    summary = [
        "",
        f"Research loop for goal: '{scoped_goal}'",
        f"Ran {len(round_log)} round(s). Saved to {goal_path.relative_to(PROJECT_ROOT)}.",
        "",
        f"Coverage: {len(covered_sources)}/{len(all_items)}",
    ]
    if covered_sources:
        summary.append("Covered (review these notes again as part of your goal process):")
        for item in sorted(covered_sources):
            source, caveat = covered_sources[item]
            line = f"  - {item} — {source}" if source else f"  - {item} — (source not cited)"
            if caveat:
                line += f" [caveat: {caveat}]"
            summary.append(line)
    if open_items:
        summary.append("Remaining gaps:")
        for g in open_items:
            summary.append(f"  - {g}")
    else:
        summary.append("No remaining gaps — goal is fully covered by current notes.")

    # Print summary for CLI, return structured result
    print("\n".join(summary))

    # Feature 6: Follow-up prompts
    print("\n" + "="*60)
    print("What would you like to do next?")
    print("="*60)
    print("""
1. Research a new goal
2. Modify this goal and re-search
3. Search online for more information
q. Quit
""")

    while True:
        choice = input("Enter your choice (1-3 or q): ").strip().lower()

        if choice == "1":
            print()
            new_goal = input("Enter your new goal: ").strip()
            if new_goal:
                return research_goal(new_goal, max_rounds=max_rounds, auto_narrow=auto_narrow)
            else:
                print("No goal entered. Exiting.\n")
                break

        elif choice == "2":
            print()
            print(f"Current goal: {scoped_goal}")
            refined_goal = input("How would you like to refine it? ").strip()
            if refined_goal:
                return research_goal(refined_goal, max_rounds=max_rounds, auto_narrow=auto_narrow)
            else:
                print("No refinement entered. Exiting.\n")
                break

        elif choice == "3":
            print("\n" + "─"*60)
            print("Top gaps to research online:")
            print("─"*60)
            for i, gap in enumerate(open_items[:5], 1):
                print(f"  {i}. {gap}")
            print("\nTry searching these terms on Google, books, articles, or in your field's literature.")
            print()
            break

        elif choice == "q":
            print("\nGoodbye!")
            break

        else:
            print("Invalid choice. Please enter 1, 2, 3, or q.\n")

    return result


def chat(project: str = None):
    """
    Main chat loop.
    """
    print("\n🧠 Personal Knowledge Retriever")
    print("─" * 50)
    if project:
        print(f"Scoped to project: {project}")
    print("Ask me anything about your saved notes.")
    print("Type 'quit' to exit.\n")

    conversation_history = []

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() in ["quit", "exit", "q"]:
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        # Search for relevant notes
        retrieved_context, top_note_path = search_notes_semantic(user_input, project=project)
        
        # Build the message with retrieved context
        context_message = f"""
RETRIEVED NOTES (relevant to this query):
{retrieved_context}

USER QUERY:
{user_input}

---

Please respond based on the retrieved notes above. If no relevant notes exist, say so clearly.
"""
        
        # Add to conversation
        conversation_history.append({
            "role": "user",
            "content": context_message
        })
        
        # Call Claude
        try:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=conversation_history
            )
            
            assistant_message = response.content[0].text
            conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            print(f"\nAssistant: {assistant_message}\n")

            if top_note_path:
                check = input(f"Check for notes related to '{top_note_path}'? (y/n): ").strip().lower()
                if check == "y":
                    print("\n" + suggest_related(str(NOTES_DIR / top_note_path)) + "\n")

        except anthropic.APIError as e:
            print(f"\nERROR: {e}\n")
            # Remove the last user message if API call failed
            conversation_history.pop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Personal Knowledge Retriever")
    parser.add_argument("--new-project", metavar="NAME", help="Register a new active project")
    parser.add_argument("--archive-project", metavar="NAME", help="Archive an existing project")
    parser.add_argument("--project", metavar="NAME", help="Scope chat search to one project")
    parser.add_argument("--suggest-related", metavar="NOTE_PATH", help="Suggest notes related to NOTE_PATH")
    parser.add_argument("--research-goal", metavar="GOAL", help="Run a multi-round gap-finding loop against a stated goal")
    args = parser.parse_args()

    if args.new_project:
        new_project(args.new_project)
    elif args.archive_project:
        archive_project(args.archive_project)
    elif args.suggest_related:
        print(suggest_related(args.suggest_related))
    elif args.research_goal:
        research_goal(args.research_goal)  # prints summary internally
    else:
        chat(project=args.project)
