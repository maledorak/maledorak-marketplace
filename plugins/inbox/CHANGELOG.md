# Changelog

All notable changes to the Inbox plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
