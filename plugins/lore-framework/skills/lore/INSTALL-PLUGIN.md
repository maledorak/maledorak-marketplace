# Lore Framework Installation (Plugin)

> **Use this when:** You exclusively use Claude Code CLI and never remote environments.
>
> **Warning:** Plugins only work in CLI. If you also use Desktop/Web (remote environments),
> use [INSTALL-PORTABLE.md](INSTALL-PORTABLE.md) instead.

## Quick Install

1. Add marketplace to Claude Code settings:

```json
// .claude/settings.json
{
  "extraKnownMarketplaces": {
    "maledorak-private-marketplace": {
      "source": {
        "source": "github",
        "repo": "maledorak/maledorak-private-marketplace"
      }
    }
  }
}
```

2. Enable plugin:

```json
// .claude/settings.json
{
  "enabledPlugins": {
    "lore@maledorak-private-marketplace": true
  }
}
```

3. Add permissions:

```json
// .claude/settings.json
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

4. Configure user (gitignored):

```json
// .claude/settings.local.json
{
  "env": {
    "LORE_SESSION_CURRENT_USER": "your-name"
  }
}
```

5. Run `/lore` and ask Claude to "bootstrap lore framework"

## What You Get

| Component | Description |
|-----------|-------------|
| **Skills** | `/lore`, `/lore-git` |
| **MCP Tools** | `lore-set-user`, `lore-set-task`, `lore-show-session`, `lore-list-users`, `lore-clear-task`, `lore-generate-index` |
| **Agents** | `lore-fetch-source` (web archiving) |
| **Hooks** | SessionStart (auto user/index), PostToolUse (auto-regenerate index) |

## Verification

Ask Claude to run `lore-show-session` MCP tool.

---

**Plugins not working?** See [INSTALL-PORTABLE.md](INSTALL-PORTABLE.md) for workaround.
