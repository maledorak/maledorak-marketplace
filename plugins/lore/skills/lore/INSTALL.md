# Lore Framework Installation

First-time setup for installing this skill in a new project.

## Quick Install (Plugin)

1. Install the lore plugin from marketplace
2. Run `/lore` and ask Claude to "bootstrap lore framework"

Claude will create all required directories, files, and configurations.

---

## Portable Setup (Claude Code Web)

> **For Claude Code Web or projects that can't use plugins.**
> Local MCP servers from plugins don't work on Claude Code Web.
> Use this setup to "port" lore to any repository.

### 1. Add MCP Server

Create/update `.mcp.json` in project root:

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

### 2. Copy Skills

Copy skills to `.claude/skills/`:

```bash
mkdir -p .claude/skills

# Option A: Clone from marketplace repo
git clone --depth 1 https://github.com/maledorak/maledorak-private-marketplace /tmp/lore-tmp
cp -r /tmp/lore-tmp/plugins/lore/skills/lore .claude/skills/
cp -r /tmp/lore-tmp/plugins/lore/skills/lore-git .claude/skills/
rm -rf /tmp/lore-tmp

# Option B: Manually create skills (see skill files in this repo)
```

### 3. Add Permissions

Add to `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__lore",
      "Skill(lore)",
      "Skill(lore-git)"
    ]
  }
}
```

### 4. Create lore/ Structure

```bash
mkdir -p lore/{0-session,1-tasks/{backlog,active,blocked,archive},2-adrs,3-wiki/project}
```

### 5. Create team.yaml

Create `lore/0-session/team.yaml`:

```yaml
your-name:
  name: "Your Full Name"
  role: "Your Role"
  focus: "What you work on"
```

### 6. Add to .gitignore

```gitignore
# Lore framework - session-local files
lore/0-session/current-user.md
lore/0-session/current-task.md
lore/0-session/current-task.json
lore/0-session/next-tasks.md
```

### Verify Setup

Ask Claude to run `lore-show-session` MCP tool. Should show "User: not set" and "Task: not set".

### What Works on Claude Code Web

| Component | Works? |
|-----------|--------|
| Skills (`/lore`, `/lore-git`) | ✅ Yes |
| MCP tools (via npx) | ✅ Yes |
| Agents (`lore-fetch-source`) | ❌ No (plugin only) |
| Hooks (SessionStart, PostToolUse) | ❌ No (plugin only) |

> **Note:** Without hooks, you'll need to manually:
> - Set user at session start: ask Claude to use `lore-set-user`
> - Regenerate index after changes: ask Claude to use `lore-generate-index`

---

## Manual Installation (Full)

### Step 1: Create Directory Structure

```bash
mkdir -p lore/{0-session,1-tasks/{backlog,active,blocked,archive},2-adrs,3-wiki/project}
```

### Step 2: Create .gitignore Entries

Add to your `.gitignore`:

```gitignore
# Lore framework - session-local files
lore/0-session/current-user.md
lore/0-session/current-task.md
lore/0-session/current-task.json
lore/0-session/next-tasks.md
```

### Step 3: Create team.yaml

Create `lore/0-session/team.yaml`:

```yaml
# Team members for session management
members:
  - id: your-name
    name: "Your Full Name"
    role: "Your Role"
    focus: "What you work on"
```

### Step 4: Create CLAUDE.md Files

#### Root CLAUDE.md (add this section)

```markdown
## Session Gate

**Before any work, verify:**

| Check | File | If Missing |
|-------|------|------------|
| **Who** | `lore/0-session/current-user.md` | Auto-generated from `LORE_SESSION_CURRENT_USER` env, or manual setup |
| **What** | `lore/0-session/current-task.md` | Pick from `lore/0-session/next-tasks.md`, use MCP tool `lore-set-task` |

If `current-user.md` missing, respond:
> I need to know who I'm working with. Configure in `.claude/settings.local.json`:
> ```json
> { "env": { "LORE_SESSION_CURRENT_USER": "your-name" } }
> ```

If `current-task.md` missing, respond:
> No active task. Pick from `lore/0-session/next-tasks.md` and I'll use `lore-set-task` to set it.

## Task-Gated Development

**Writing code without an active task is FORBIDDEN.**

## Context

@lore/0-session/current-user.md
@lore/0-session/current-task.md
@lore/0-session/next-tasks.md
@lore/CLAUDE.md
```

#### lore/CLAUDE.md

```markdown
# Lore Directory

Context persistence for stateless Claude sessions. Use `/lore` skill when working here.

## Session Files

| File | Purpose | Committed |
|------|---------|-----------|
| `0-session/current-user.md` | Who is working (generated) | No |
| `0-session/current-task.md` | Symlink to active task | No |
| `0-session/current-task.json` | Task metadata for agents (id + path) | No |
| `0-session/team.yaml` | Team data (source of truth) | Yes |
| `0-session/next-tasks.md` | Available tasks (auto-generated) | No |
| `README.md` | Full index with Mermaid (heavy) | Yes |

**Setup:** Use MCP tools `lore-set-user` and `lore-set-task`

## Quick Reference

**Format:** `NNNN_TYPE_slug.md` (shared ID sequence for tasks + backlog)

**Task lifecycle:** `backlog/` → `active/` → `blocked/` ↔ `active/` → `archive/`

**Note prefixes:** Q- (Question), I- (Idea), R- (Research), S- (Synthesis), G- (Generation)

## Full Documentation

All system docs: See lore plugin skills
```

#### lore/0-session/CLAUDE.md

```markdown
# Session Directory

Local session state. Files are gitignored except `team.yaml`.

| File | Purpose |
|------|---------|
| `current-user.md` | Who is working |
| `current-task.md` | Symlink to active task |
| `current-task.json` | Task metadata (id + path) |
| `team.yaml` | Team data (source of truth) |
| `next-tasks.md` | Available tasks by priority |

**Setup:** Use MCP tools `lore-set-user` and `lore-set-task`
```

#### lore/1-tasks/CLAUDE.md

```markdown
# Tasks

All tasks by lifecycle status. Shared ID sequence (NNNN).

## Directories

- `backlog/` — future work
- `active/` — in progress
- `blocked/` — waiting on dependencies
- `archive/` — completed

## Format

`NNNN_TYPE_slug.md` or `NNNN_TYPE_slug/` (directory for complex tasks)

TYPE = BUG | FEATURE | RESEARCH | REFACTOR | DOCS

## Lifecycle

`backlog/` → `active/` → `blocked/` ↔ `active/` → `archive/`
```

#### lore/2-adrs/CLAUDE.md

```markdown
# Architecture Decision Records

Document significant decisions. Format: `NNNN_slug.md`

Status: proposed → accepted → deprecated/superseded
```

#### lore/3-wiki/CLAUDE.md

```markdown
# Wiki

Living documentation. Current state, not history.

- **1-tasks/** = What to build
- **2-adrs/** = Why we chose X
- **3-wiki/** = What IS now
```

### Step 5: Create Templates

#### lore/1-tasks/_template.md

```markdown
---
id: "NNNN"
title: "Task Title"
type: FEATURE
status: active
related_adr: []
related_tasks: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: active
    who: your-name
    note: "Task created"
---

# Task Title

## Summary

One paragraph: what and why.

## Status: Active

**Current state:** Brief progress description.

## Context

Problem being solved.

## Implementation Plan

### Step 1: Name

Description.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Notes

Additional context.
```

### Step 6: Configure Settings (Optional)

#### .claude/settings.json (add permissions)

```json
{
  "permissions": {
    "allow": [
      "mcp__plugin_lore_lore",
      "Skill(lore)",
      "Skill(lore-git)"
    ]
  }
}
```

**Permission breakdown:**
- `mcp__plugin_lore_lore` - MCP tools: `lore-set-user`, `lore-set-task`, `lore-show-session`, `lore-list-users`, `lore-clear-task`, `lore-generate-index`
- `Skill(lore)` - Task-gated development workflow skill
- `Skill(lore-git)` - Git commits with Conventional Commits + lore task references

#### .claude/settings.local.json (user-specific, gitignored)

```json
{
  "env": {
    "LORE_SESSION_CURRENT_USER": "your-name"
  }
}
```

### Step 7: Create Session Hooks (Optional)

#### .claude/hooks/session-start.sh

```bash
#!/bin/bash
set -e
cd "$CLAUDE_PROJECT_DIR"

# Set current user from env var
if [ -n "$LORE_SESSION_CURRENT_USER" ]; then
    node ${CLAUDE_PLUGIN_ROOT}/scripts/set-session.js --env --quiet
fi

# Regenerate next-tasks.md
node ${CLAUDE_PLUGIN_ROOT}/scripts/lore-generate-index.js --next-only --quiet
```

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup|resume",
      "hooks": [{
        "type": "command",
        "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh\""
      }]
    }]
  }
}
```

---

## Verification

After installation, ask Claude to use the MCP tool `lore-show-session`.

Should show "No user set" and "No task set" (expected for fresh install).

## First Task

Create your first task:

```bash
# Create task file
cat > lore/1-tasks/active/0001_FEATURE_initial-setup.md << 'EOF'
---
id: "0001"
title: "Initial Project Setup"
type: FEATURE
status: active
related_adr: []
related_tasks: []
tags: []
links: []
history:
  - date: 2024-01-01
    status: active
    who: your-name
    note: "Task created"
---

# Initial Project Setup

## Summary

Set up the project foundation.

## Status: Active

## Acceptance Criteria

- [ ] Project structure created
- [ ] Dependencies installed
EOF
```

Then ask Claude to set it as current task using `lore-set-task` MCP tool with task ID `0001`.

---

## File Checklist

After installation you should have:

```
project/
├── .claude/
│   ├── settings.json          # With skill permissions
│   ├── settings.local.json    # With LORE_SESSION_CURRENT_USER (gitignored)
│   ├── hooks/
│   │   └── session-start.sh   # Optional
│   └── skills/
│       └── lore/    # This skill
├── .gitignore                 # With session file entries
├── CLAUDE.md                  # With session gate section
└── lore/
    ├── CLAUDE.md
    ├── 0-session/
    │   ├── CLAUDE.md
    │   └── team.yaml
    ├── 1-tasks/
    │   ├── CLAUDE.md
    │   ├── _template.md
    │   ├── backlog/
    │   ├── active/
    │   ├── blocked/
    │   └── archive/
    ├── 2-adrs/
    │   └── CLAUDE.md
    └── 3-wiki/
        └── CLAUDE.md
```
