# Lore Framework Installation (Plugin) [BETA]

> **Note:** This project is in beta. APIs and schemas may change. Version compatibility will be maintained through plugin version numbers.

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
    "lore-framework@maledorak-private-marketplace": true
  }
}
```

3. Add permissions:

```json
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "mcp__plugin_lore-framework_lore-framework",
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
| **MCP Tools** | `lore-framework_set-user`, `lore-framework_set-task`, `lore-framework_show-session`, `lore-framework_list-users`, `lore-framework_clear-task`, `lore-framework_generate-index`, `lore-framework_validate` |
| **Agents** | `lore-fetch-source` (web archiving) |
| **Hooks** | SessionStart (auto user/index), PostToolUse (auto-regenerate index) |

## Verification

Ask Claude to run `lore-framework_show-session` MCP tool.

---

**Plugins not working?** See [INSTALL-PORTABLE.md](INSTALL-PORTABLE.md) for workaround.
