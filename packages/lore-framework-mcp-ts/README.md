# lore-framework-mcp [BETA]

MCP server for **Lore Framework** - AI-readable project memory with task/ADR/wiki management.

> **Note:** This project is in beta. APIs and schemas may change. Version compatibility will be maintained through package version numbers.

> **Important:** This MCP server is just one component of Lore Framework. For the complete experience (skills, hooks, agents), install the full plugin: [lore-framework plugin](https://github.com/maledorak/maledorak-marketplace/tree/main/plugins/lore-framework)

## Installation

```bash
npx lore-framework-mcp@1.2.4
```

Or add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "lore": {
      "command": "npx",
      "args": ["-y", "lore-framework-mcp@1.2.4"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `lore-framework_set-user` | Set current user from team.yaml |
| `lore-framework_set-task` | Set current task by ID (creates symlink) |
| `lore-framework_show-session` | Show current session state (user and task) |
| `lore-framework_list-users` | List available users from team.yaml |
| `lore-framework_clear-task` | Clear current task symlink |
| `lore-framework_generate-index` | Regenerate lore/README.md and next-tasks.md |
| `lore-framework_validate` | Validate frontmatter in tasks, ADRs, and notes |

## What is Lore Framework?

Lore Framework provides a structured `lore/` directory for managing:

- **Tasks** - with status tracking, dependencies, and research notes
- **ADRs** - Architecture Decision Records
- **Wiki** - Living documentation
- **Session** - Current user and task context

## Directory Structure

```
lore/
├── 0-session/          # Session state
│   ├── current-user.md
│   ├── current-task.md
│   └── team.yaml
├── 1-tasks/            # Task management
│   ├── active/
│   ├── blocked/
│   ├── archive/
│   └── backlog/
├── 2-adrs/             # Architecture Decision Records
└── 3-wiki/             # Living documentation
```

## Documentation

See full documentation: [Lore Framework Plugin](https://github.com/maledorak/maledorak-marketplace/tree/main/plugins/lore-framework)

## Author

<div>
    <a href="https://twitter.com/maledorak">
        <img src="https://img.shields.io/badge/X/Twitter-000000?style=for-the-badge&logo=x&logoColor=black&color=white" />
    </a>
    <a href="https://www.linkedin.com/in/mariuszkorzekwa/">
        <img src="https://img.shields.io/badge/LinkedIn-000000?style=for-the-badge&logo=linkedin&logoColor=black&color=white" />
    </a>
    <a href="https://github.com/maledorak">
        <img src="https://img.shields.io/badge/GitHub-000000?style=for-the-badge&logo=github&logoColor=black&color=white" />
    </a>
</div>

## License

MIT
