#!/bin/bash
#
# Session start hook for lore-framework plugin.
# Runs on: startup, resume, clear
#
# Automatically sets up:
# - .gitignore entries for lore session files
# - current-user.md from LORE_SESSION_CURRENT_USER env var
# - next-tasks.md (regenerated fresh each session)
#
# Configuration:
#   Set LORE_SESSION_CURRENT_USER in .claude/settings.local.json:
#   {
#     "env": {
#       "LORE_SESSION_CURRENT_USER": "mariusz"
#     }
#   }

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR}"

# Check if lore/ directory exists in project
if [ ! -d "$PROJECT_DIR/lore" ]; then
    exit 0
fi

cd "$PROJECT_DIR"

# Ensure lore session files are gitignored
GITIGNORE="$PROJECT_DIR/.gitignore"

ensure_gitignore() {
    local entry="$1"

    # Create .gitignore if it doesn't exist
    [ ! -f "$GITIGNORE" ] && touch "$GITIGNORE"

    # Add entry if not already present
    if ! grep -qxF "$entry" "$GITIGNORE" 2>/dev/null; then
        echo "$entry" >> "$GITIGNORE"
        echo "Added to .gitignore: $entry"
    fi
}

ensure_gitignore "lore/0-session/current-user.md"
ensure_gitignore "lore/0-session/current-task.md"
ensure_gitignore "lore/0-session/current-task.json"
ensure_gitignore "lore/0-session/next-tasks.md"

# Set current user from env var if set
if [ -n "$LORE_SESSION_CURRENT_USER" ]; then
    npx -y lore-framework-mcp@1.2.4 set-user --env --quiet 2>/dev/null || true
fi

# Regenerate next-tasks.md only
npx -y lore-framework-mcp@1.2.4 generate-index --next-only --quiet 2>/dev/null || true
