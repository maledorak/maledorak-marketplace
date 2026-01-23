#!/bin/bash
#
# Session start hook for lore plugin.
# Runs on: startup, resume, clear
#
# Automatically sets up:
# - pnpm dependencies (if needed)
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

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR}"

# Check if lore/ directory exists in project
if [ ! -d "$PROJECT_DIR/lore" ]; then
    exit 0
fi

# Install pnpm dependencies if node_modules doesn't exist
if [ ! -d "$PLUGIN_ROOT/node_modules" ]; then
    echo "Installing lore dependencies..."
    cd "$PLUGIN_ROOT"
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
fi

# Set current user from env var if set
if [ -n "$LORE_SESSION_CURRENT_USER" ]; then
    node "$PLUGIN_ROOT/scripts/lore-framework-set-session.js" --env --quiet --project "$PROJECT_DIR" 2>/dev/null || true
fi

# Regenerate next-tasks.md only
node "$PLUGIN_ROOT/scripts/lore-framework-generate-index.js" "$PROJECT_DIR" --next-only --quiet 2>/dev/null || true
