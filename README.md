# Maledorak Private Claude Code Plugins Marketplace

Personal private marketplace for Claude Code plugins maintained by Maledorak.

## Available Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| `common` | 1.0.0 | Common development skill: git-commit for Conventional Commits |

## Installation

### Option 1: Automatic Installation via Project Settings (Recommended)

Add this marketplace to your project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "maledorak-private-marketplace": {
      "source": {
        "source": "github",
        "repo": "maledorak/maledorak-private-marketplace"
      }
    }
  },
  "enabledPlugins": [
    "common@maledorak-private-marketplace"
  ]
}
```

When you trust the repository in Claude Code, the marketplace and plugins will be installed automatically.

### Option 2: Manual Installation

1. Add the marketplace:
   ```
   /plugin marketplace add github.com/maledorak/maledorak-private-marketplace
   ```

2. Install desired plugins:
   ```
   /plugin install common@maledorak-private-marketplace
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
/plugin marketplace update maledorak-private-marketplace
```

Update a specific plugin:
```
/plugin update common@maledorak-private-marketplace
```

## Requirements

- Claude Code CLI
- GitHub access to `maledorak/maledorak-private-marketplace` repository (private)
- GitHub authentication configured via one of:
  - SSH keys (`git@github.com` access)
  - GitHub CLI (`gh auth login`)
  - Personal access token
