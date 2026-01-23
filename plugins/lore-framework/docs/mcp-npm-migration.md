# Lore MCP npm Migration Report

> Research on migrating lore MCP server to npm public package.

## Problem

**Claude Code web does not load local MCP servers** defined in `.mcp.json`.

### Observations

| Element | Works on web? |
|---------|---------------|
| Skills (`/lore`, `/lore-git`) | ✅ Yes |
| MCP tools (`lore-set-task`, etc.) | ❌ No |
| Bash scripts (workaround) | ✅ Yes |
| Context7 MCP (npx) | ✅ Yes |

### Proof

Configuration in `.mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "lore": {
      "command": "node",
      "args": [".claude/servers/lore-mcp.js"]
    }
  }
}
```

- `context7` (npx + npm package) → **works**
- `lore` (node + local file) → **does not work**

### Server Verification

The lore MCP server itself is correct:
- Code has no errors
- Dependencies installed (`.claude/node_modules/`)
- Starts correctly via `node .claude/servers/lore-mcp.js`

The problem lies in Claude Code web - it does not spawn processes for local MCP servers.

## Solution: npm public

### Decision

Publish `@maledorak/lore-mcp` on **npm public** (npmjs.com).

### Comparison of Considered Options

| Criterion | npm public | GitHub Packages public | GitHub Packages private |
|-----------|------------|----------------------|------------------------|
| Auth in .mcp.json | ❌ Not required | ❌ Not required | ✅ Token required |
| Auth for publish | npm token | GitHub token | GitHub token |
| Env bug in Claude | N/A | N/A | ⚠️ Risk |
| Code visible | ✅ Yes | ✅ Yes | ❌ No |
| Setup on new machine | Zero | `.npmrc` | `.npmrc` + token |

### Why npm public

1. **Zero configuration** - works out of the box
2. **No risk** - known bug with env vars in Claude Code ([Issue #1254](https://github.com/anthropics/claude-code/issues/1254))
3. **Security** - lore-mcp code contains no secrets, it's just tooling
4. **Simplicity** - simplest setup on new projects

### Target Configuration

`.mcp.json` in any project:
```json
{
  "mcpServers": {
    "lore": {
      "command": "npx",
      "args": ["-y", "@maledorak/lore-mcp@latest"]
    }
  }
}
```

## Implementation

### npm Package Structure

```
packages/lore-mcp/
├── package.json
├── README.md
└── bin/
    └── lore-mcp.js
```

### GitHub Workflow

Automatic publishing via `.github/workflows/publish-lore-mcp.yml`:
- Trigger: tag `lore-mcp@*` or manual dispatch
- Requires: `NPM_TOKEN` secret (scoped to `@maledorak/lore-mcp`)

> **Note**: npm Trusted Publishing (OIDC) with `--provenance` requires a public repository.
> The `maledorak-marketplace` repository is now public, but we still use token-based auth.

### Plugin Changes

Plugin v1.0.6+ uses npx instead of bundled server:

```json
{
  "mcpServers": {
    "lore": {
      "command": "npx",
      "args": ["-y", "@maledorak/lore-mcp@latest"]
    }
  }
}
```

## Related Issues

- [Claude Code #18088](https://github.com/anthropics/claude-code/issues/18088) - Web plugin support
- [Claude Code #1254](https://github.com/anthropics/claude-code/issues/1254) - Env vars not passed to MCP
- [Claude Code #10955](https://github.com/anthropics/claude-code/issues/10955) - MCP env vars not loading

## Sources

- [GitHub Docs - npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)
- [npm - Creating and publishing packages](https://docs.npmjs.com/creating-and-publishing-private-packages/)
