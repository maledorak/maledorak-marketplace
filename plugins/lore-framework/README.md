# Lore Framework Plugin [BETA]

Manage lore/ directory for tracking tasks, code history, and project state.

> **Note:** This project is in beta. APIs and schemas may change. Version compatibility will be maintained through plugin version numbers.

## Features

- **Session Management:** Track current user and active task
- **Task System:** Active, blocked, archived tasks with worklogs and dependencies
- **ADRs:** Architecture Decision Records for significant decisions
- **Wiki:** Living documentation of current project state

## Installation

### Option 1: Ask Claude (Recommended)

Open your project in Claude Code and say:

```
Install lore framework from: <path-to-marketplace>/plugins/lore-framework/skills/lore/INSTALL.md
I use Claude Code Remote/Desktop/CLI (pick one)
```

Claude will read the instructions and copy all files manually.

### Option 2: Plugin (CLI only)

```shell
/plugin install lore-framework@maledorak-private-marketplace
```

> **Note:** Plugins only work in Claude Code CLI for now. For Desktop/Web, use Option 1.

## Usage

The skill is automatically invoked when working with `lore/` directory content.

## MCP Tools

This plugin provides MCP tools that Claude can use directly:

| Tool | Description |
|------|-------------|
| `lore-framework_set-user` | Set current user from team.yaml |
| `lore-framework_set-task` | Set current task by ID (creates symlink) |
| `lore-framework_show-session` | Show current session state (user and task) |
| `lore-framework_list-users` | List available users from team.yaml |
| `lore-framework_clear-task` | Clear current task symlink |
| `lore-framework_generate-index` | Regenerate lore/README.md and next-tasks.md |
| `lore-framework_validate` | Validate frontmatter in tasks, ADRs, and notes |

## Hooks

This plugin includes automatic hooks:
- **SessionStart** - Installs pnpm dependencies, sets user from `LORE_SESSION_CURRENT_USER`, generates next-tasks.md
- **PostToolUse** - Regenerates lore index when task/ADR files are edited

## Scripts (CLI)

For manual CLI usage:
- `scripts/lore-framework-set-session.js` - Set current user and task
- `scripts/lore-framework-generate-index.js` - Generate lore directory index

## Version

1.2.1
