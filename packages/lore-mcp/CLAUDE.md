# @maledorak/lore-mcp Development

MCP server package for the lore framework.

## Publishing

To publish a new version:

1. Bump version in `package.json` (or use `npm version patch|minor|major --no-git-tag-version`)
2. Commit the version bump
3. Create and push a tag: `git tag lore-mcp@X.Y.Z && git push origin lore-mcp@X.Y.Z`
4. GitHub Actions workflow will automatically publish to npm

The workflow is defined in `.github/workflows/publish-lore-mcp.yml`.

## Tools

| Tool | Description |
|------|-------------|
| `lore-set-user` | Set current user from team.yaml |
| `lore-set-task` | Set current task by ID (creates symlink) |
| `lore-show-session` | Show current session state (user and task) |
| `lore-list-users` | List available users from team.yaml |
| `lore-clear-task` | Clear current task symlink |
| `lore-generate-index` | Regenerate lore/README.md and next-tasks.md |
| `lore-validate` | Validate frontmatter in tasks, ADRs, and notes |

## Testing Locally

```bash
# Run syntax check
node --check bin/lore-mcp.js

# Test with MCP inspector (if available)
npx @anthropic-ai/mcp-inspector bin/lore-mcp.js
```
