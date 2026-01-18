# Lore Plugin

Manage lore/ directory for tracking tasks, code history, and project state.

## Features

- **Session Management:** Track current user and active task
- **Task System:** Active, blocked, archived tasks with worklogs and dependencies
- **ADRs:** Architecture Decision Records for significant decisions
- **Wiki:** Living documentation of current project state

## Installation

From this marketplace:
```shell
/plugin install lore@maledorak-private-marketplace
```

## Usage

The skill is automatically invoked when working with `lore/` directory content.

For first-time setup, see `INSTALL.md` in the skill directory or ask Claude to "bootstrap lore".

## MCP Tools

This plugin provides MCP tools that Claude can use directly:

| Tool | Description |
|------|-------------|
| `lore-set-user` | Set current user from team.yaml |
| `lore-set-task` | Set current task by ID (creates symlink) |
| `lore-show-session` | Show current session state (user and task) |
| `lore-list-users` | List available users from team.yaml |
| `lore-clear-task` | Clear current task symlink |
| `lore-generate-index` | Regenerate lore/README.md and next-tasks.md |

## Hooks

This plugin includes automatic hooks:
- **SessionStart** - Installs pnpm dependencies, sets user from `LORE_SESSION_CURRENT_USER`, generates next-tasks.md
- **PostToolUse** - Regenerates lore index when task/ADR files are edited

## Scripts (CLI)

For manual CLI usage:
- `scripts/lore-set-session.js` - Set current user and task
- `scripts/lore-generate-index.js` - Generate lore directory index

## Version

1.0.0
