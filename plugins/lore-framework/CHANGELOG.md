# Changelog

All notable changes to the Lore plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2026-01-19

### Changed

- Plugin now uses `npx @maledorak/lore-mcp` instead of bundled server
- Removed `servers/` directory - MCP server is now only in npm package
- Single source of truth for MCP server code
- GitHub Actions workflow for automated npm publishing with scoped token

See [MCP npm Migration Report](docs/mcp-npm-migration.md) for background.

## [1.0.5] - 2026-01-19

### Added

- npm package `@maledorak/lore-mcp` for Claude Code Web compatibility
- Portable setup instructions in INSTALL.md for projects without plugin support
- Documentation of what works on Claude Code Web vs CLI

### Changed

- INSTALL.md reorganized with Quick Install, Portable Setup, and Full Manual sections

## [1.0.4] - 2026-01-19

### Fixed

- Reword lore-git skill section headers to avoid false positive bash pattern detection

## [1.0.3] - 2026-01-19

### Changed

- Updated INSTALL.md to reference MCP tools instead of scripts
- Added permission breakdown for `mcp__plugin_lore_lore`, `Skill(lore)`, `Skill(lore-git)`

## [1.0.2] - 2026-01-19

### Fixed

- Removed `CLAUDE_PROJECT_DIR` reference from MCP server code (use `cwd()` directly)

## [1.0.1] - 2026-01-19

### Fixed

- Removed explicit `CLAUDE_PROJECT_DIR` env from MCP config (server uses `cwd()` fallback)
- Removed redundant component path fields from plugin.json (auto-discovered from defaults)

## [1.0.0] - 2025-01-18

### Added

- MCP server with session and task management tools:
  - `lore-set-user` - Set current user from team.yaml
  - `lore-set-task` - Set current task by ID (creates symlink)
  - `lore-show-session` - Show current session state
  - `lore-list-users` - List available users from team.yaml
  - `lore-clear-task` - Clear current task symlink
  - `lore-generate-index` - Regenerate lore/README.md and next-tasks.md
- Skills:
  - `lore` - Task-gated development workflow with note types (Q/I/R/S/G)
  - `lore-git` - Git commits with Conventional Commits 1.0.0 + lore task references
- Hooks:
  - `SessionStart` - Auto-set user from `LORE_SESSION_CURRENT_USER` env var
  - `PostToolUse` - Regenerate index on lore file changes
- Directory structure for `lore/`:
  - `0-session/` - Session state (current-user, current-task, team.yaml)
  - `1-tasks/` - Task management (active, blocked, archive, backlog)
  - `2-adrs/` - Architecture Decision Records
  - `3-wiki/` - Living documentation
- Agent: `lore-fetch-source` - Fetch web sources and save to current task's `sources/` directory
- Session file: `current-task.json` - Task metadata (id + path) for agents
