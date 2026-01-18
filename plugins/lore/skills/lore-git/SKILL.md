---
name: lore-git
description: Git commit messages following Conventional Commits 1.0.0 with lore task references. Use when making commits to ensure semantic versioning and task traceability.
---

# Git Commits with Lore Integration

Create semantic, version-aware commit messages following Conventional Commits 1.0.0 with lore task traceability.

## Quick Reference

**Format:**
```
<type>(<lore-NNNN>): <description>

[optional body]

[optional footer(s)]
```

**Example:**
```
feat(lore-0042): add OAuth2 login flow

Support Google and GitHub OAuth providers.
Tokens are stored securely in session storage.
```

## Lore Task Reference

**Always include task reference when working on a lore task.**

### In Scope (Required)

```
feat(lore-0008): implement PostgreSQL schema
fix(lore-0012): correct prompt template escaping
refactor(lore-0017): restructure directory layout
```

**Format:** `(lore-NNNN)` where NNNN is the task ID from `lore/1-tasks/`

**Why task references matter:**
- `git blame` → commit → task → full context
- Future sessions can trace code back to decisions
- Worklogs explain WHY code exists
- Enables "archaeology" of codebase history

### Finding Current Task

Check `lore/0-session/current-task.md` symlink to see active task, or use `lore-show-session` MCP tool.

## Type Selection

| Type | When to Use | SemVer | Example |
|------|-------------|--------|---------|
| `feat` | New feature added | MINOR | `feat(lore-0042): add user endpoints` |
| `fix` | Bug patched | PATCH | `fix(lore-0012): correct token expiry` |
| `docs` | Documentation only | - | `docs(lore-0005): add API reference` |
| `style` | Code formatting (no logic change) | - | `style: fix indentation` |
| `refactor` | Code restructure (no behavior change) | - | `refactor(lore-0017): extract validator` |
| `perf` | Performance improvement | PATCH | `perf(lore-0020): add query indexes` |
| `test` | Adding tests | - | `test(lore-0042): add auth unit tests` |
| `build` | Build system changes | - | `build: update webpack config` |
| `ci` | CI configuration | - | `ci: add GitHub Actions` |
| `chore` | Other changes (tooling, deps) | - | `chore: update dependencies` |
| `revert` | Revert previous commit | - | `revert: feat(lore-0042): add endpoint` |

## Scopes

### Task Scope (Primary)

When working on a lore task, use task ID as scope:

```
feat(lore-0042): implement feature
fix(lore-0012): resolve bug
```

### Module Scope (Secondary)

For changes not tied to specific task, use module/component:

```
feat(api): add rate limiting
fix(auth): correct session handling
refactor(models): split into modules
```

### No Scope

For broad changes affecting multiple areas:

```
docs: update README
chore: upgrade dependencies
style: apply formatting
```

## Breaking Changes

Indicate breaking changes in **two ways**:

### Pattern 1: With `!` before `:`
```
feat(lore-0025)!: change response format

BREAKING CHANGE: API now returns JSON instead of XML
```

### Pattern 2: With `BREAKING CHANGE:` footer
```
feat(lore-0025): update settings schema

BREAKING CHANGE: Removed deprecated 'legacy_mode' option.
Use 'compatibility_mode' instead.
```

**When to use:**
- API changes that break existing code
- Removed features or options
- Changed behavior that affects users
- Configuration format changes

## Description Guidelines

- **Imperative mood**: "add" not "added", "fix" not "fixed"
- **Lowercase** after colon: `feat: add feature` not `feat: Add feature`
- **No period** at end
- **Under 50 characters** (hard limit: 72)
- **Clear and concise**: what changed, not how or why

**Good:**
```
feat(lore-0042): add user registration endpoint
fix(lore-0012): prevent connection leak on error
docs(lore-0005): update installation guide
```

**Bad:**
```
feat(lore-0042): Added user registration endpoint.  # Past tense, period
Fix(lore-0012): Prevent Connection Leak  # Wrong case
docs: I updated the install docs because they were outdated  # Too verbose
```

## Body Guidelines

Use body to explain:
- **WHAT** changed (if not obvious from description)
- **WHY** the change was needed (motivation)
- **Context** or background

**Do NOT explain HOW** - the code diff shows that.

**Example:**
```
fix(lore-0012): resolve race condition in token refresh

The refresh token was being used before the previous request
completed, causing intermittent 401 errors during high load.

Resolved by implementing a token refresh queue.
```

## Footer Guidelines

**Optional footers:**
- `BREAKING CHANGE:` - Breaking change description (uppercase required)
- `Refs:` or `Closes:` - Issue/PR references
- `Reviewed-by:` - Code reviewers

**Example with footers:**
```
feat(lore-0042): add rate limiting

Implement token bucket algorithm for API rate limiting.

BREAKING CHANGE: API now returns 429 for rate-limited requests
Closes: #45
Reviewed-by: Security Team
```

## Commit Workflow

### 1. Check Current Task

```bash
# View current task
cat lore/0-session/current-task.md
# Or use MCP tool
lore-show-session
```

### 2. Analyze Changes

```bash
git status        # What files changed?
git diff --staged # What are the actual changes?
```

### 3. Determine Type

- **New feature?** → `feat`
- **Bug fix?** → `fix`
- **Documentation only?** → `docs`
- **Code cleanup/reorganization?** → `refactor`
- **Performance improvement?** → `perf`
- **Tests only?** → `test`
- **Build/tooling/dependencies?** → `chore`, `build`, or `ci`

### 4. Build Commit Message

```
<type>(lore-<task-id>): <description>

<body explaining why>
```

### 5. Validate Format

- [ ] Type is valid (feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert)
- [ ] Task scope included: `(lore-NNNN)`
- [ ] Description is imperative, lowercase, no period, under 50 chars
- [ ] `BREAKING CHANGE` is uppercase (if present)

## Examples

### Feature with Task

```
feat(lore-0042): add email notifications

Support SMTP and SendGrid providers.
Users can configure in settings page.
```

### Bug Fix with Task

```
fix(lore-0012): prevent session fixation attack

Session ID was not regenerated after login.
Now generates new session ID on authentication.
```

### Breaking Change

```
feat(lore-0025)!: change pagination format

Response now uses cursor-based pagination.

BREAKING CHANGE: Replace 'page' and 'limit' params with 'cursor'.
Migration guide in docs/migration.md
```

### Documentation

```
docs(lore-0005): add API authentication guide

Document OAuth2 flow and token management.
```

### Chore (No Task)

```
chore: update dependencies

Bump axios to 1.6.0, lodash to 4.17.21
```

## Commit Message Template

Use this template (save as `.gitmessage`):

```
<type>(lore-NNNN): <description under 50 chars>

# Why is this change needed?

# What does it do?

# Type: feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert
# Scope: lore-NNNN (task) or module name
# Description: imperative, lowercase, no period
# Body: explain WHY, not HOW
```

## Reference

**Conventional Commits:** https://www.conventionalcommits.org/en/v1.0.0/

---

*Always include lore task scope `(lore-NNNN)` for commits on lore tasks*
