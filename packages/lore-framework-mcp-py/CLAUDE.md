# lore-framework-mcp Development (Python)

MCP server package for Lore Framework (Python version).

## Project Structure

```
lore-framework-mcp-py/
├── src/
│   └── lore_framework_mcp/
│       ├── __init__.py       # Entry point with main()
│       ├── server.py         # MCP server with FastMCP tools
│       └── cli.py            # CLI commands
├── pyproject.toml            # Package configuration
└── README.md
```

## Development

```bash
# Create virtual environment with uv
uv venv
source .venv/bin/activate

# Install dependencies
uv sync

# Run MCP server
uv run lore-framework-mcp

# Run CLI commands
uv run lore-framework-mcp help
uv run lore-framework-mcp show-session
```

## Publishing

To publish a new version:

1. Bump version in `pyproject.toml` and `src/lore_framework_mcp/__init__.py`
2. Commit the changes
3. Create and push a tag: `git tag lore-framework-mcp-py@X.Y.Z && git push origin lore-framework-mcp-py@X.Y.Z`
4. GitHub Actions workflow will automatically build and publish to PyPI

The workflow is defined in `.github/workflows/publish-lore-framework-mcp-py.yml`.

## Tools

| Tool | Description |
|------|-------------|
| `lore_framework_set_user` | Set current user from team.yaml |
| `lore_framework_set_task` | Set current task by ID (creates symlink) |
| `lore_framework_show_session` | Show current session state (user and task) |
| `lore_framework_list_users` | List available users from team.yaml |
| `lore_framework_clear_task` | Clear current task symlink |
| `lore_framework_generate_index` | Regenerate lore/README.md and next-tasks.md |

## Testing Locally

```bash
# Build first
uv build

# Test with MCP inspector
uv run mcp dev src/lore_framework_mcp/server.py
```
