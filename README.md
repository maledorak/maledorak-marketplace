# Maledorak Claude Code Plugins Marketplace

Personal marketplace for Claude Code plugins maintained by Maledorak.

## Available Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| `common` | 1.0.0 | Common development skill: git-commit for Conventional Commits |
| `lore-framework` | 1.2.5 | Manage lore/ directory for tracking tasks, ADRs, wiki, and session |

## Installation

### Option 1: Automatic Installation via Project Settings (Recommended)

Add this marketplace to your project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "maledorak-marketplace": {
      "source": {
        "source": "github",
        "repo": "maledorak/maledorak-marketplace"
      }
    }
  },
  "enabledPlugins": [
    "common@maledorak-marketplace"
  ]
}
```

When you trust the repository in Claude Code, the marketplace and plugins will be installed automatically.

### Option 2: Manual Installation

1. Add the marketplace:
   ```
   /plugin marketplace add maledorak/maledorak-marketplace
   ```

2. Install desired plugins:
   ```
   /plugin install common@maledorak-marketplace
   /plugin install lore-framework@maledorak-marketplace
   ```

## Verifying Installation

List installed marketplaces:
```
/plugin marketplace list
```

List installed plugins:
```
/plugin list
```

## Updating Plugins

Update the marketplace:
```
/plugin marketplace update maledorak-marketplace
```

Update a specific plugin:
```
/plugin update common@maledorak-marketplace
```

## Requirements

- Claude Code CLI
