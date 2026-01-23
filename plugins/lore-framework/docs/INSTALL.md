# Lore Framework Installation [BETA]

> **Note:** This project is in beta. APIs and schemas may change. Version compatibility will be maintained through plugin version numbers.

Choose your installation method:

## [INSTALL-PORTABLE.md](INSTALL-PORTABLE.md) (Recommended)

Use for **most setups** - works everywhere:
- Claude Code CLI
- Claude Code Desktop (remote environment, beta)
- Claude Code Web (remote environment, beta)
- Mixed usage (switching between CLI and remote in same repo)

**Pros:** Works in all environments. Full feature parity.
**Cons:** Manual setup, files in your repo.

## [INSTALL-PLUGIN.md](INSTALL-PLUGIN.md) (CLI Only)

Use **only if** you exclusively use Claude Code CLI and never remote environments.

**Pros:** Automatic updates, minimal repo footprint.
**Cons:** Only works in CLI. Breaks if you open repo in Desktop/Web.

---

**Current status:**
- Plugins work: CLI only
- Remote environments (Desktop/Web): plugins not supported yet
- Issue tracking: https://github.com/anthropics/claude-code/issues/18088
