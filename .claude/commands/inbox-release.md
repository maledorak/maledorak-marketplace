---
description: Check version sync and release inbox plugin
license: MIT
metadata:
  author: Mariusz (Maledorak) Korzekwa
  updated: 2026-01-27
---

# Inbox Release Command

Check version synchronization for inbox plugin.

## Step 1: Read all version files

Read these files and extract versions:

| File | Field |
|------|-------|
| `plugins/inbox/.claude-plugin/plugin.json` | `version` |
| `.claude-plugin/marketplace.json` | `plugins[name=inbox].version` |
| `plugins/inbox/README.md` | Version under `## Version` |
| `README.md` | Version in inbox row of table |

## Step 2: Display version status

Show table:

```
| Location                    | Current | Expected | Status      |
|-----------------------------|---------|----------|-------------|
| plugin.json                 | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| marketplace.json            | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| Plugin README               | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
| Root README                 | X.Y.Z   | X.Y.Z    | OK/MISMATCH |
```

**Expected version:** The highest version found across all files.

## Step 3: Ask user what to do

If mismatches found, ask:

> Version mismatches found. What would you like to do?
> 1. **Sync all to highest** - Update all files to [highest version]
> 2. **Bump patch** - Bump to [next patch] and sync all
> 3. **Bump minor** - Bump to [next minor] and sync all
> 4. **Custom version** - Specify version manually
> 5. **Cancel** - Do nothing

If all versions match:

> All versions are in sync at [version]. Nothing to do.

## Step 4: Update versions (if requested)

Update all files to target version:

1. `plugins/inbox/.claude-plugin/plugin.json` - `version` field
2. `.claude-plugin/marketplace.json` - `plugins[name=inbox].version`
3. `plugins/inbox/README.md` - under `## Version`
4. `README.md` - table row for inbox

## Step 5: Add CHANGELOG entry

If version was bumped, remind user:

> Don't forget to update `plugins/inbox/CHANGELOG.md` with changes for version X.Y.Z

## Version locations summary

| Location | Path |
|----------|------|
| plugin.json | `plugins/inbox/.claude-plugin/plugin.json` → `version` |
| marketplace.json | `.claude-plugin/marketplace.json` → `plugins[].version` |
| Plugin README | `plugins/inbox/README.md` → `## Version` |
| Root README | `README.md` → table row |
