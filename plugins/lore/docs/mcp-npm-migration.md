# Lore MCP npm Migration Report

> Research na temat migracji lore MCP server do npm public package.

## Problem

**Claude Code web nie ładuje lokalnych serwerów MCP** zdefiniowanych w `.mcp.json`.

### Obserwacje

| Element | Działa na web? |
|---------|----------------|
| Skills (`/lore`, `/lore-git`) | ✅ Tak |
| MCP tools (`lore-set-task`, etc.) | ❌ Nie |
| Bash scripts (workaround) | ✅ Tak |
| Context7 MCP (npx) | ✅ Tak |

### Dowód

Konfiguracja w `.mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "lore": {
      "command": "node",
      "args": [".claude/servers/lore-mcp.js"]
    }
  }
}
```

- `context7` (npx + npm package) → **działa**
- `lore` (node + lokalny plik) → **nie działa**

### Weryfikacja serwera

Serwer lore MCP sam w sobie jest poprawny:
- Kod bez błędów
- Zależności zainstalowane (`.claude/node_modules/`)
- Startuje poprawnie przez `node .claude/servers/lore-mcp.js`

Problem leży w Claude Code web - nie spawnuje procesów dla lokalnych serwerów MCP.

## Rozwiązanie: npm public

### Decyzja

Opublikować `@maledorak/lore-mcp` na **npm public** (npmjs.com).

### Porównanie rozważanych opcji

| Kryterium | npm public | GitHub Packages public | GitHub Packages private |
|-----------|------------|----------------------|------------------------|
| Auth w .mcp.json | ❌ Nie trzeba | ❌ Nie trzeba | ✅ Trzeba token |
| Auth do publish | npm token | GitHub token | GitHub token |
| Env bug w Claude | N/A | N/A | ⚠️ Ryzyko |
| Kod widoczny | ✅ Tak | ✅ Tak | ❌ Nie |
| Setup na nowej maszynie | Zero | `.npmrc` | `.npmrc` + token |

### Dlaczego npm public

1. **Zero konfiguracji** - działa out of the box
2. **Brak ryzyka** - znany bug z env vars w Claude Code ([Issue #1254](https://github.com/anthropics/claude-code/issues/1254))
3. **Bezpieczeństwo** - kod lore-mcp nie zawiera secretów, to tylko tooling
4. **Prostota** - najprostszy setup na nowych projektach

### Docelowa konfiguracja

`.mcp.json` w dowolnym projekcie:
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

## Implementacja

### Struktura pakietu npm

```
packages/lore-mcp/
├── package.json
├── README.md
└── bin/
    └── lore-mcp.js
```

### GitHub Workflow

Automatyczna publikacja przez `.github/workflows/publish-lore-mcp.yml`:
- Trigger: tag `lore-mcp@*` lub manual dispatch
- Wymaga: `NPM_TOKEN` secret

### Zmiany w pluginie

Plugin v1.0.6+ używa npx zamiast bundlowanego serwera:

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

## Powiązane issues

- [Claude Code #18088](https://github.com/anthropics/claude-code/issues/18088) - Web plugin support
- [Claude Code #1254](https://github.com/anthropics/claude-code/issues/1254) - Env vars not passed to MCP
- [Claude Code #10955](https://github.com/anthropics/claude-code/issues/10955) - MCP env vars not loading

## Źródła

- [GitHub Docs - npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)
- [npm - Creating and publishing packages](https://docs.npmjs.com/creating-and-publishing-private-packages/)
