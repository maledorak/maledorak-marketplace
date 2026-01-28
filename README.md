# Maledorak Claude Code Plugins Marketplace

Personal marketplace for Claude Code plugins maintained by Maledorak.

## Available Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| `common` | 1.0.0 | Common development skill: git-commit for Conventional Commits |
| `inbox` | 1.0.3 | Cross-project messaging. Ask Claude in other projects to handle tasks for you. |
| `lore-framework` | 1.2.7 | Manage lore/ directory for tracking tasks, ADRs, wiki, and session |
| `claude-toolkit` | 1.0.0 | Skills for creating Claude Code plugins, skills, marketplaces, and hooks |

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
   /plugin install inbox@maledorak-marketplace --user
   /plugin install lore-framework@maledorak-marketplace
   /plugin install claude-toolkit@maledorak-marketplace
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

## Author

<div>
    <a href="https://twitter.com/maledorak">
        <img src="https://img.shields.io/badge/X/Twitter-000000?style=for-the-badge&logo=x&logoColor=black&color=white" />
    </a>
    <a href="https://www.linkedin.com/in/mariuszkorzekwa/">
        <img src="https://img.shields.io/badge/LinkedIn-000000?style=for-the-badge&logo=linkedin&logoColor=black&color=white" />
    </a>
    <a href="https://github.com/maledorak">
        <img src="https://img.shields.io/badge/GitHub-000000?style=for-the-badge&logo=github&logoColor=black&color=white" />
    </a>
</div>
