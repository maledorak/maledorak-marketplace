# Maledorak Private Claude Code Plugins Marketplace

Personal private marketplace for Claude Code plugins maintained by Maledorak.

## Available Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| `common` | 1.0.0 | Common development skill: git-commit for Conventional Commits |
| `lore` | 1.0.0 | Manage lore/ directory for tracking tasks, ADRs, wiki, and session |

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
   /plugin marketplace add maledorak/maledorak-private-marketplace
   ```

2. Install desired plugins:
   ```
   /plugin install common@maledorak-private-marketplace
   /plugin install lore@maledorak-private-marketplace
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

### Authentication for Private Repository

Since this is a private repository, you need to configure GitHub authentication. Set one of these environment variables in your shell config (`.bashrc`, `.zshrc`):

```bash
# Option 1: GitHub Personal Access Token (recommended)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Option 2: Alternative token variable
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

The token needs `repo` scope for private repository access.

**Create a token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy and set as `GITHUB_TOKEN`
