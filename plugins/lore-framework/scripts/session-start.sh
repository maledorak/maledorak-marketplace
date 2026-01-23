#!/bin/bash
#
# Session start hook for lore-framework plugin.
# Runs on: startup, resume, clear
#
# Automatically sets up:
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

# Set current user from env var if set
if [ -n "$LORE_SESSION_CURRENT_USER" ]; then
    npx -y lore-framework-mcp@latest set-user --env --quiet 2>/dev/null || true
fi

# Regenerate next-tasks.md only
npx -y lore-framework-mcp@latest generate-index --next-only --quiet 2>/dev/null || true
