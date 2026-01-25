# Lore Framework Plugin [BETA]

Manage lore/ directory for tracking tasks, code history, and project state.

> **Note:** This project is in beta. APIs and schemas may change. Version compatibility will be maintained through plugin version numbers.

## Motivation

**LLMs need "why", not just "what".**

When an LLM looks at code without history, it treats existing patterns as the gold standard. The problem? It might replicate:
- Legacy hacks from old migrations
- Workarounds for bugs that were never documented
- Temporary solutions that became permanent by accident

Just like humans struggle with undocumented codebases, LLMs face the same challenge—but with higher replication risk.

**Lore provides AI-readable project memory:**

| Component | What it captures | How it helps LLM |
|-----------|------------------|------------------|
| **Tasks** | Requirements, acceptance criteria, blockers | Knows what to build and why, tracks dependencies |
| **Worklogs** | Step-by-step reasoning during implementation | Sees the evolution, not just the end result |
| **ADRs** | Architecture decisions with context and alternatives | Understands *why* current approach was chosen |
| **Wiki** | Living documentation of current state | Has up-to-date reference, not stale docs |
| **Session** | Current user, active task | Maintains focus and continuity across conversations |

**Task-gated session:**

Active task and current user are symlinked to session files that Claude reads automatically as part of system context. This means:
- LLM always knows *what* it's working on and *who* it's working for
- Task requirements, history, and notes are injected into every conversation
- No need to repeat context—it's always there

**Result:** LLM that understands context makes better suggestions and avoids perpetuating technical debt.

## Features

- **Session Management:** Track current user and active task
- **Task System:** Active, blocked, archived tasks with worklogs and dependencies
- **ADRs:** Architecture Decision Records for significant decisions
- **Wiki:** Living documentation of current project state

## Installation

### Option 1: Ask Claude (Recommended)

Open your project in Claude Code and say:

```
Install lore framework from: <path-to-marketplace>/plugins/lore-framework/docs/INSTALL.md
I use Claude Code Remote/Desktop/CLI (pick one)
```

Claude will read the instructions and copy all files manually.

### Option 2: Plugin (CLI only)

```shell
/plugin install lore-framework@maledorak-marketplace
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

## CLI

For manual CLI usage via npx:
```bash
npx lore-framework-mcp set-user <id>       # Set user
npx lore-framework-mcp set-user --env      # Set user from env var
npx lore-framework-mcp set-task <id>       # Set task
npx lore-framework-mcp show-session        # Show session state
npx lore-framework-mcp generate-index      # Generate lore index
```

## Version

1.2.5
