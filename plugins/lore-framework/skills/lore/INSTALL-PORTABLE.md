# Lore Framework Installation (Portable) [BETA]

> **Note:** This project is in beta. APIs and schemas may change. Version compatibility will be maintained through plugin version numbers.

> **For Claude:** Don't run bash commands. Use `Read` to copy files from this plugin's repo,
> `Write` to create them in the target project. Create configs manually. You are the installer.

> **Recommended for most users.**
>
> Use this when:
> - You use Claude Code Desktop or Web (remote environments)
> - You switch between CLI and remote in the same repository
> - You want lore to work everywhere
>
> **Why:** Plugins only work in CLI. Remote environments (Desktop/Web) don't support plugins yet.
> Issue: https://github.com/anthropics/claude-code/issues/18088

This setup copies plugin components locally to your repository, ensuring lore works in all Claude Code environments.

## Overview

| Component | Plugin | Portable |
|-----------|--------|----------|
| MCP Tools | plugin provides | npm package via `.mcp.json` |
| Skills | plugin provides | copied to `.claude/skills/` |
| Agents | plugin provides | copied to `.claude/agents/` |
| Hooks | plugin provides | copied to `.claude/hooks/` + scripts |

## Step 1: MCP Server

Create `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "lore-framework": {
      "command": "npx",
      "args": ["-y", "lore-framework-mcp@latest"]
    }
  }
}
```

## Step 2: Copy Skills

```bash
mkdir -p .claude/skills

# Clone and copy
git clone --depth 1 https://github.com/maledorak/maledorak-private-marketplace /tmp/lore-tmp
cp -r /tmp/lore-tmp/plugins/lore-framework/skills/lore .claude/skills/
cp -r /tmp/lore-tmp/plugins/lore-framework/skills/lore-git .claude/skills/
rm -rf /tmp/lore-tmp
```

Add note to copied files (for future cleanup):

```markdown
> **TEMPORARY LOCAL COPY** - Remove when Claude Code web supports plugins
> Source: `lore-framework@maledorak-private-marketplace` plugin
> Issue: https://github.com/anthropics/claude-code/issues/18088
```

## Step 3: Copy Agent

```bash
mkdir -p .claude/agents

# From the same clone, or fresh:
git clone --depth 1 https://github.com/maledorak/maledorak-private-marketplace /tmp/lore-tmp
cp /tmp/lore-tmp/plugins/lore-framework/agents/lore-framework-fetch-source.md .claude/agents/
rm -rf /tmp/lore-tmp
```

## Step 4: Setup Hooks

### 4a. Create hook scripts

```bash
mkdir -p .claude/hooks .claude/scripts
```

**`.claude/hooks/session-start.sh`:**

```bash
#!/bin/bash
# TEMPORARY LOCAL COPY - Remove when Claude Code web supports plugins
# Source: lore-framework@maledorak-private-marketplace plugin
# Issue: https://github.com/anthropics/claude-code/issues/18088

set -e

SCRIPTS_DIR="$CLAUDE_PROJECT_DIR/.claude/scripts"

# Check if lore/ directory exists
if [ ! -d "$CLAUDE_PROJECT_DIR/lore" ]; then
    exit 0
fi

# Install dependencies if needed
if [ ! -d "$CLAUDE_PROJECT_DIR/.claude/node_modules" ]; then
    cd "$CLAUDE_PROJECT_DIR/.claude"
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install 2>/dev/null || npm install 2>/dev/null || true
fi

# Set current user from env var
if [ -n "$LORE_SESSION_CURRENT_USER" ]; then
    node "$SCRIPTS_DIR/lore-set-session.js" --env --quiet --project "$CLAUDE_PROJECT_DIR" 2>/dev/null || true
fi

# Regenerate next-tasks.md
node "$SCRIPTS_DIR/lore-generate-index.js" "$CLAUDE_PROJECT_DIR" --next-only --quiet 2>/dev/null || true
```

**`.claude/hooks/lore-on-file-change.sh`:**

```bash
#!/bin/bash
# TEMPORARY LOCAL COPY - Remove when Claude Code web supports plugins
# Source: lore-framework@maledorak-private-marketplace plugin
# Issue: https://github.com/anthropics/claude-code/issues/18088

set -e

SCRIPTS_DIR="$CLAUDE_PROJECT_DIR/.claude/scripts"

# Check if lore/ directory exists
if [ ! -d "$CLAUDE_PROJECT_DIR/lore" ]; then
    exit 0
fi

# Get file path from hook input
FILE_PATH="${CLAUDE_TOOL_INPUT:-}"

# Only regenerate if task or ADR file was edited
if [[ "$FILE_PATH" != *"/lore/1-tasks/"* ]] && [[ "$FILE_PATH" != *"/lore/2-adrs/"* ]]; then
    exit 0
fi

# Regenerate lore index
node "$SCRIPTS_DIR/lore-generate-index.js" "$CLAUDE_PROJECT_DIR" --quiet 2>/dev/null || true
```

Make executable:

```bash
chmod +x .claude/hooks/*.sh
```

### 4b. Copy scripts

```bash
git clone --depth 1 https://github.com/maledorak/maledorak-private-marketplace /tmp/lore-tmp
cp /tmp/lore-tmp/plugins/lore-framework/scripts/lore-set-session.js .claude/scripts/
cp /tmp/lore-tmp/plugins/lore-framework/scripts/lore-generate-index.js .claude/scripts/
rm -rf /tmp/lore-tmp
```

### 4c. Create package.json

**`.claude/package.json`:**

```json
{
  "name": "lore-scripts",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "glob": "^13.0.0",
    "gray-matter": "^4.0.3",
    "yaml": "^2.8.2"
  }
}
```

Install dependencies:

```bash
cd .claude && pnpm install && cd ..
```

## Step 5: Configure Settings

**`.claude/settings.json`:**

```json
{
  "permissions": {
    "allow": [
      "mcp__lore-framework",
      "Skill(lore)",
      "Skill(lore-git)"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lore-on-file-change.sh"
          }
        ]
      }
    ]
  }
}
```

**`.claude/settings.local.json`** (gitignored):

```json
{
  "env": {
    "LORE_SESSION_CURRENT_USER": "your-name"
  }
}
```

## Step 6: Create lore/ Structure

```bash
mkdir -p lore/{0-session,1-tasks/{backlog,active,blocked,archive},2-adrs,3-wiki/project}
```

## Step 7: Create team.yaml

**`lore/0-session/team.yaml`:**

```yaml
your-name:
  name: "Your Full Name"
  role: "Your Role"
  focus: "What you work on"
```

## Step 8: Update .gitignore

```gitignore
# Lore framework - session-local files
lore/0-session/current-user.md
lore/0-session/current-task.md
lore/0-session/current-task.json
lore/0-session/next-tasks.md

# Claude settings (user-specific)
.claude/settings.local.json
.claude/node_modules/
.claude/pnpm-lock.yaml
```

## Step 9: Update CLAUDE.md

Add to your root `CLAUDE.md`:

```markdown
## Session Gate

**Before any work, verify:**

| Check | File | If Missing |
|-------|------|------------|
| **Who** | `lore/0-session/current-user.md` | Auto-generated from `LORE_SESSION_CURRENT_USER` env |
| **What** | `lore/0-session/current-task.md` | Pick from `lore/0-session/next-tasks.md`, use MCP tool `lore-framework_set-task` |

## Task-Gated Development

**Writing code without an active task is FORBIDDEN.**

## Context

@lore/0-session/current-user.md
@lore/0-session/current-task.md
@lore/0-session/next-tasks.md
@lore/CLAUDE.md
```

## Verification

Ask Claude to run `lore-framework_show-session` MCP tool. Should show user (if env set) and "Task: not set".

## File Checklist

```
project/
├── .mcp.json                      # MCP server config
├── .gitignore                     # With lore entries
├── CLAUDE.md                      # With session gate
├── .claude/
│   ├── settings.json              # Permissions + hooks
│   ├── settings.local.json        # User env (gitignored)
│   ├── package.json               # Script dependencies
│   ├── hooks/
│   │   ├── session-start.sh       # SessionStart hook
│   │   └── lore-on-file-change.sh # PostToolUse hook
│   ├── scripts/
│   │   ├── lore-set-session.js    # Session management
│   │   └── lore-generate-index.js # Index generation
│   ├── skills/
│   │   ├── lore/                  # Lore skill
│   │   └── lore-git/              # Git commit skill
│   └── agents/
│       └── lore-framework-fetch-source.md   # Web archiving agent
└── lore/
    ├── CLAUDE.md
    ├── 0-session/
    │   ├── team.yaml
    │   └── CLAUDE.md
    ├── 1-tasks/
    │   ├── backlog/
    │   ├── active/
    │   ├── blocked/
    │   └── archive/
    ├── 2-adrs/
    └── 3-wiki/
```

## Cleanup (Future)

When Claude Code web supports plugins:

1. Delete `.claude/hooks/`, `.claude/scripts/`, `.claude/agents/`, `.claude/skills/lore*`
2. Delete `.claude/package.json` and `.claude/node_modules/`
3. Remove hooks from `.claude/settings.json`
4. Follow [INSTALL-PLUGIN.md](INSTALL-PLUGIN.md) instead
