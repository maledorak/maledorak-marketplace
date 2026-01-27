---
description: Check version sync across all files and release MCP packages
license: MIT
metadata:
  author: Mariusz (Maledorak) Korzekwa
  updated: 2026-01-25
---

# Release Command

Check version synchronization and release MCP packages.

## Step 1: Read all version files

Read these files and extract versions:

| File | Field |
|------|-------|
| `plugins/lore-framework/.claude-plugin/plugin.json` | `version` |
| `plugins/lore-framework/.claude-plugin/plugin.json` | `mcpServers.lore-framework.args` (extract version from `lore-framework-mcp@X.Y.Z`) |
| `.claude-plugin/marketplace.json` | `plugins[name=lore-framework].version` |
| `packages/lore-framework-mcp-ts/package.json` | `version` |
| `packages/lore-framework-mcp-py/pyproject.toml` | `version` |
| `plugins/lore-framework/README.md` | Version under `## Version` |
| `README.md` | Version in lore-framework row of table |

Also check MCP version references in:
- `plugins/lore-framework/scripts/session-start.sh`
- `plugins/lore-framework/scripts/on-file-change.sh`
- `plugins/lore-framework/docs/INSTALL-PORTABLE.md`
- `packages/lore-framework-mcp-ts/README.md`

## Step 2: Display version status

Show table:

```
| Location                          | Current | Expected | Status |
|-----------------------------------|---------|----------|--------|
| plugin.json (version)             | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| plugin.json (MCP ref)             | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| marketplace.json                  | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| lore-framework-mcp-ts             | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| lore-framework-mcp-py             | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| Plugin README                     | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| Root README                       | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| scripts/session-start.sh          | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| scripts/on-file-change.sh         | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| docs/INSTALL-PORTABLE.md          | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| MCP TS README                     | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
```

**Expected version:** The highest version found across all files (or specified by user).

## Step 3: Ask user what to do

If mismatches found, ask:

> Version mismatches found. What would you like to do?
> 1. **Sync all to highest** - Update all files to [highest version]
> 2. **Bump patch** - Bump to [next patch] and sync all
> 3. **Bump minor** - Bump to [next minor] and sync all
> 4. **Custom version** - Specify version manually
> 5. **Cancel** - Do nothing

If all versions match:

> All versions are in sync at [version].
>
> Ready to release?
> 1. **Release MCP packages** - Create git tags for npm/PyPI publish
> 2. **Bump and release** - Bump version first, then release
> 3. **Cancel** - Do nothing

## Step 4: Update versions (if requested)

Update all files to target version:

1. `plugins/lore-framework/.claude-plugin/plugin.json` - both `version` and MCP args
2. `.claude-plugin/marketplace.json`
3. `packages/lore-framework-mcp-ts/package.json`
4. `packages/lore-framework-mcp-py/pyproject.toml`
5. `plugins/lore-framework/README.md`
6. `README.md`
7. All MCP reference files (scripts, docs, README)

## Step 5: Release MCP packages (if requested)

After versions are synced:

1. Check for uncommitted changes:
   ```bash
   git status --porcelain
   ```

   If dirty, ask user to commit first:
   > There are uncommitted changes. Please commit before releasing:
   > ```
   > git add -A && git commit -m "chore: bump version to X.Y.Z"
   > ```

2. Create and push tags for MCP packages:
   ```bash
   git tag lore-framework-mcp@X.Y.Z
   git tag lore-framework-mcp-py@X.Y.Z
   git push origin lore-framework-mcp@X.Y.Z lore-framework-mcp-py@X.Y.Z
   ```

3. Report success:
   > Tags created and pushed:
   > - `lore-framework-mcp@X.Y.Z` - triggers npm publish
   > - `lore-framework-mcp-py@X.Y.Z` - triggers PyPI publish
   >
   > Check GitHub Actions for publish status.

## Version locations summary

**Plugin version** (should all match):
- `plugins/lore-framework/.claude-plugin/plugin.json` → `version`
- `.claude-plugin/marketplace.json` → `plugins[].version`
- `plugins/lore-framework/README.md` → `## Version`
- `README.md` → table row

**MCP version** (should all match, can differ from plugin):
- `packages/lore-framework-mcp-ts/package.json` → `version`
- `packages/lore-framework-mcp-py/pyproject.toml` → `version`
- `plugins/lore-framework/.claude-plugin/plugin.json` → MCP args
- `plugins/lore-framework/scripts/*.sh`
- `plugins/lore-framework/docs/INSTALL-PORTABLE.md`
- `packages/lore-framework-mcp-ts/README.md`

**Current convention:** Plugin version = MCP version (keep in sync)
