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
      "args": ["-y", "lore-framework-mcp@1.2.6"]
    }
  }
}
```

## Step 2: Copy Skills

```bash
mkdir -p .claude/skills

# Clone and copy
git clone --depth 1 https://github.com/maledorak/maledorak-marketplace /tmp/lore-tmp
cp -r /tmp/lore-tmp/plugins/lore-framework/skills/lore-framework .claude/skills/
cp -r /tmp/lore-tmp/plugins/lore-framework/skills/lore-framework-git .claude/skills/
rm -rf /tmp/lore-tmp
```

Add note to copied files (for future cleanup):

```markdown
> **TEMPORARY LOCAL COPY** - Remove when Claude Code web supports plugins
> Source: `lore-framework@maledorak-marketplace` plugin
> Issue: https://github.com/anthropics/claude-code/issues/18088
```

## Step 3: Copy Agent

```bash
mkdir -p .claude/agents

# From the same clone, or fresh:
git clone --depth 1 https://github.com/maledorak/maledorak-marketplace /tmp/lore-tmp
cp /tmp/lore-tmp/plugins/lore-framework/agents/lore-framework-fetch-source.md .claude/agents/
rm -rf /tmp/lore-tmp
```

## Step 4: Setup Hooks

### 4a. Create hook scripts

```bash
mkdir -p .claude/hooks
```

**`.claude/hooks/session-start.sh`:**

```bash
#!/bin/bash
# TEMPORARY LOCAL COPY - Remove when Claude Code web supports plugins
# Source: lore-framework@maledorak-marketplace plugin
# Issue: https://github.com/anthropics/claude-code/issues/18088

set -e

# Check if lore/ directory exists
if [ ! -d "$CLAUDE_PROJECT_DIR/lore" ]; then
    exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Set current user from env var
if [ -n "$LORE_SESSION_CURRENT_USER" ]; then
    npx -y lore-framework-mcp@1.2.6 set-user --env --quiet 2>/dev/null || true
fi

# Regenerate next-tasks.md
npx -y lore-framework-mcp@1.2.6 generate-index --next-only --quiet 2>/dev/null || true
```

**`.claude/hooks/on-file-change.sh`:**

```bash
#!/bin/bash
# TEMPORARY LOCAL COPY - Remove when Claude Code web supports plugins
# Source: lore-framework@maledorak-marketplace plugin
# Issue: https://github.com/anthropics/claude-code/issues/18088

set -e

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

cd "$CLAUDE_PROJECT_DIR"

# Regenerate lore index
npx -y lore-framework-mcp@1.2.6 generate-index --quiet 2>/dev/null || true
```

Make executable:

```bash
chmod +x .claude/hooks/*.sh
```

## Step 5: Configure Settings

**`.claude/settings.json`:**

```json
{
  "permissions": {
    "allow": [
      "mcp__lore-framework",
      "Skill(lore-framework)",
      "Skill(lore-framework-git)"
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
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/on-file-change.sh"
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
│   ├── hooks/
│   │   ├── session-start.sh       # SessionStart hook
│   │   └── on-file-change.sh # PostToolUse hook
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

1. Delete lore-framework files:
   - `.claude/hooks/session-start.sh`
   - `.claude/hooks/on-file-change.sh`
   - `.claude/agents/lore-framework-fetch-source.md`
   - `.claude/skills/lore-framework/`
   - `.claude/skills/lore-framework-git/`
2. Remove lore-framework hooks from `.claude/settings.json`
3. Follow [INSTALL-PLUGIN.md](INSTALL-PLUGIN.md) instead
