# Lore Framework MCP (Python)

MCP server for Lore Framework - AI-readable project memory with task/ADR/wiki management.

> **Important:** This MCP server is just one component of Lore Framework. For the complete experience (skills, hooks, agents), install the full plugin: [lore-framework plugin](https://github.com/maledorak/maledorak-marketplace/tree/main/plugins/lore-framework)

## Installation

```bash
# Using uvx (recommended)
uvx lore-framework-mcp

# Using pip
pip install lore-framework-mcp
```

## Usage

### As MCP Server

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "lore-framework": {
      "command": "uvx",
      "args": ["lore-framework-mcp"]
    }
  }
}
```

### As CLI

```bash
# Set current user
lore-framework-mcp set-user <user_id>
lore-framework-mcp set-user --env  # from LORE_SESSION_CURRENT_USER

# Set current task
lore-framework-mcp set-task <task_id>

# Show session state
lore-framework-mcp show-session

# List available users
lore-framework-mcp list-users

# Clear current task
lore-framework-mcp clear-task

# Regenerate indexes
lore-framework-mcp generate-index
lore-framework-mcp generate-index --next-only --quiet
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `lore_framework_set_user` | Set current user from team.yaml |
| `lore_framework_set_task` | Set current task by ID (creates symlink) |
| `lore_framework_show_session` | Show current session state (user and task) |
| `lore_framework_list_users` | List available users from team.yaml |
| `lore_framework_clear_task` | Clear current task symlink |
| `lore_framework_generate_index` | Regenerate lore/README.md and next-tasks.md |

## Lore Directory Structure

```
lore/
├── 0-session/           # Session state (gitignored)
│   ├── team.yaml        # Team members definition
│   ├── current-user.md  # Active user (generated)
│   ├── current-task.md  # Symlink to active task
│   └── next-tasks.md    # Auto-generated task queue
├── 1-tasks/             # Task management
│   ├── active/          # In-progress tasks
│   ├── blocked/         # Blocked tasks
│   ├── backlog/         # Planned tasks
│   └── archive/         # Completed tasks
├── 2-adrs/              # Architecture Decision Records
├── 3-wiki/              # Project documentation
└── README.md            # Auto-generated index
```

## Documentation

See full documentation: [Lore Framework Plugin](https://github.com/maledorak/maledorak-marketplace/tree/main/plugins/lore-framework)

## License

MIT
