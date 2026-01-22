# @maledorak/lore-mcp Development

MCP server package for the lore framework.

## Project Structure

```
lore-mcp/
├── src/
│   ├── index.ts              # Main server entry
│   ├── schemas/
│   │   └── index.ts          # Zod validation schemas
│   ├── tools/
│   │   ├── session.ts        # User/task session tools
│   │   ├── index-generator.ts # Index generation tool
│   │   └── validate.ts       # Validation tool
│   └── utils/
│       ├── errors.ts         # Error formatting with hints
│       └── logger.ts         # Structured JSON logging
├── dist/                     # Compiled output (gitignored)
├── tsconfig.json
└── package.json
```

## Development

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Watch mode (if needed, add to scripts)
pnpm exec tsc --watch
```

## Publishing

To publish a new version:

1. Bump version in `package.json` (or use `npm version patch|minor|major --no-git-tag-version`)
2. Commit the changes
3. Create and push a tag: `git tag lore-mcp@X.Y.Z && git push origin lore-mcp@X.Y.Z`
4. GitHub Actions workflow will automatically build and publish to npm

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

## Architecture

- **Modular tools**: Each tool category has its own file in `src/tools/`
- **Zod schemas**: All validation schemas in `src/schemas/` for reuse
- **Structured logging**: JSON output to stderr (preserves stdout for MCP protocol)
- **Error formatting**: User-friendly errors with actionable hints

## Testing Locally

```bash
# Build first
pnpm run build

# Test with MCP inspector (if available)
npx @anthropic-ai/mcp-inspector dist/index.js
```
