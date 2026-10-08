#!/usr/bin/env bash
# Make the rules in this folder global for Claude Code on this machine.
#   - Symlinks ~/.claude/global-rules -> this folder, so a `git pull` updates them.
#   - Adds one import line to ~/.claude/CLAUDE.md (created if missing; nothing else is touched).
# Safe to re-run.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
LINK="$CLAUDE_DIR/global-rules"
GLOBAL_MD="$CLAUDE_DIR/CLAUDE.md"
IMPORT_LINE="@~/.claude/global-rules/rules.md"

mkdir -p "$CLAUDE_DIR"

if [ -e "$LINK" ] && [ ! -L "$LINK" ]; then
  echo "Refusing to replace $LINK: it exists and is not a symlink. Move it aside and re-run." >&2
  exit 1
fi
ln -sfn "$SRC" "$LINK"
echo "Linked $LINK -> $SRC"

touch "$GLOBAL_MD"
if grep -qxF "$IMPORT_LINE" "$GLOBAL_MD"; then
  echo "$GLOBAL_MD already imports the global rules."
else
  printf '\n# Global rules (spec-driven development, agents in the build)\n%s\n' "$IMPORT_LINE" >> "$GLOBAL_MD"
  echo "Added the import line to $GLOBAL_MD"
fi
