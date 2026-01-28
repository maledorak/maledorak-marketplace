#!/bin/bash
#
# PostToolUse hook for lore-framework plugin.
# Runs on: Write, Edit
#
# Regenerates lore index when task or ADR files are modified.
#

set -e

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

cd "$PROJECT_DIR"

# Regenerate lore index
npx -y lore-framework-mcp@1.2.7 generate-index --quiet 2>/dev/null || true
