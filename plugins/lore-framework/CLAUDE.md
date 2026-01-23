# Lore Framework Plugin [BETA]

Claude Code plugin for managing `lore/` directory - tracking tasks, ADRs, wiki, session, and code history in projects.

> **Note:** This project is in beta. APIs and schemas may change. Version compatibility will be maintained through plugin version numbers.

## MCP Tools

| Tool | Description |
|------|-------------|
| `lore-framework_set-user` | Set current user from team.yaml |
| `lore-framework_set-task` | Set current task by ID (creates symlink) |
| `lore-framework_show-session` | Show current session state (user and task) |
| `lore-framework_list-users` | List available users from team.yaml |
| `lore-framework_clear-task` | Clear current task symlink |
| `lore-framework_generate-index` | Regenerate lore/README.md and next-tasks.md |
| `lore-framework_validate` | Validate frontmatter in tasks, ADRs, and notes |

## Environment Variables

- `LORE_SESSION_CURRENT_USER` - Auto-set user on session start (configure in `.claude/settings.local.json`)

## Directory Structure

```
lore/
├── 0-session/          # Session state (mostly gitignored)
│   ├── current-user.md
│   ├── current-task.md
│   ├── current-task.json  # Task metadata for agents {"id", "path"}
│   ├── next-tasks.md
│   └── team.yaml
├── 1-tasks/            # Task management
│   ├── active/
│   ├── blocked/
│   ├── archive/
│   └── backlog/
├── 2-adrs/             # Architecture Decision Records
└── 3-wiki/             # Living documentation
```

## Skills

| Skill | Description |
|-------|-------------|
| `lore` | Task-gated development, note types (Q/I/R/S/G), workflows |
| `lore-git` | Git commits with Conventional Commits + lore task references |

## Agents

| Agent | Description |
|-------|-------------|
| `lore-framework-fetch-source` | Fetch web sources and save to current task's `sources/` directory |

See `skills/` and `agents/` directories for full documentation.
