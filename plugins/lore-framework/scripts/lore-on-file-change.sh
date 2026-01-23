#!/bin/bash
#
# PostToolUse hook for lore plugin.
# Runs on: Write, Edit
#
# Regenerates lore index when task or ADR files are modified.
#

set -e

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR}"

# Check if lore/ directory exists in project
if [ ! -d "$PROJECT_DIR/lore" ]; then
    exit 0
fi

# Get the file path from hook input
# CLAUDE_TOOL_INPUT contains the tool input
FILE_PATH="${CLAUDE_TOOL_INPUT:-}"

# Only regenerate if task or ADR file was edited
if [[ "$FILE_PATH" != *"/lore/1-tasks/"* ]] && [[ "$FILE_PATH" != *"/lore/2-adrs/"* ]]; then
    exit 0
fi

# Regenerate lore index
node "$PLUGIN_ROOT/scripts/lore-generate-index.js" "$PROJECT_DIR" --quiet 2>/dev/null || true
