"""
Single source of truth for shared paths/constants. Both embed.py (writes
the Chroma index) and retrieval_service.py (reads it) import from here —
the 2026-08-09 bug that caused three weeks of silently stale search
results was exactly this constant defined twice, in two files, updated
in only one of them during a refactor. A single definition can't drift
out of sync with itself.
"""

from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
NOTES_DIR = PROJECT_ROOT / "notes"
CHROMA_DIR = PROJECT_ROOT / "system" / "_data" / "chroma_db"
COLLECTION_NAME = "notes"
EMBEDDING_MODEL = "text-embedding-3-small"
