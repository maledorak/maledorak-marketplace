# Changelog

All notable changes to the Inbox plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-01-27

### Changed

- Messenger now writes directly without checking if inbox exists first (avoids permission prompts)
- Setup now creates inbox directories for ALL projects in existing registry

### Fixed

- Permission prompts when sending messages to projects with existing inbox

## [1.0.2] - 2026-01-27

### Added

- Permissions for sibling projects' inbox directories (needed for sending messages)
- Permissions for sibling projects' .gitignore (needed for setup)
- Project validation when adding to registry (error if directory doesn't exist)
- Auto-setup inbox directories and .gitignore for initial projects during setup

### Changed

- Expanded permissions documentation with full explanation

## [1.0.1] - 2026-01-27

### Changed

- Setup now edits `~/.claude/settings.json` directly (user approves) instead of showing manual instructions
- Updated permissions to include parent CLAUDE.md access (`Edit` + `Write`)
- Changed permissions documentation to use full paths instead of relative paths

## [1.0.0] - 2026-01-27

### Added

- Initial release - cross-project messaging for Claude Code
- Agent: `messenger` - delegates tasks to Claude in other projects
  - Preloads `inbox` skill for message format and context
  - Auto-creates `.claude/inbox/` in target project
  - Auto-adds inbox to target project's `.gitignore`
  - Proactively used when user wants to send messages, delegate work, or report bugs
- Skill: `inbox` - concept, message format, setup help
  - Setup wizard: creates/updates parent `CLAUDE.md` with project registry
  - Asks user about initial projects during setup
  - Supports additional table columns (Client, Notes, etc.)
  - Project registry management (add/remove/list)
- Message types: `note`, `request`, `alert`
- Message format: YAML frontmatter (`from`, `to`, `created`, `type`, `subject`)
- Requirements:
  - Flat project structure (sibling projects under common parent)
  - User-level plugin installation (for cross-project write access)
  - Parent `CLAUDE.md` with Projects table
