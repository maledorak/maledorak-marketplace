# Tasks System

Implementation tracking for the Six project.

## Purpose

Tasks track **what to build** - implementation work with clear acceptance criteria. They are operational items, not knowledge artifacts.

## Naming Convention

```
NNNN_TYPE_slug.md
```

| Part | Description | Values |
|------|-------------|--------|
| NNNN | Sequential number | 0001, 0002, 0003... |
| TYPE | Category | BUG, FEATURE, REFACTOR, DOCS |
| slug | Descriptive name | kebab-case |

**Examples:**
```
0003_FEATURE_six-memory-domain-models.md
0004_FEATURE_postgresql-schema.md
0017_FEATURE_work-directory-framework.md
```

## Type Reference

| Type | When to Use |
|------|-------------|
| `BUG` | Fixing broken behavior |
| `FEATURE` | New capability |
| `REFACTOR` | Code restructure (no behavior change) |
| `DOCS` | Documentation work |

## Status Lifecycle

```
1-tasks/backlog/ → 1-tasks/active/ → 1-tasks/blocked/ → 1-tasks/archive/
```

| Status | Meaning |
|--------|---------|
| (backlog/) | Future work in `1-tasks/backlog/` directory, not yet a task |
| `active` | Currently being worked on (in `1-tasks/active/`) |
| `blocked` | Waiting on something (in `1-tasks/blocked/`) |
| `completed` | Done, move to `1-tasks/archive/` |

### Blocking

When a task is blocked:
1. Set `status: blocked`
2. Add history entry with `by: "NNNN"` for blocking task ID
3. Move to `1-tasks/blocked/` subdirectory

## Frontmatter Schema

```yaml
---
id: "NNNN"
title: "Task Title"
type: FEATURE              # BUG | FEATURE | RESEARCH | REFACTOR | DOCS
status: active             # active | blocked | completed
related_adr: ["0001"]       # ADR IDs related to this
related_tasks: ["0004"]     # Other related tasks
tags: [database, memory]
links: []                  # External URLs
history:
  - date: YYYY-MM-DD       # Required
    status: active         # Required: active | blocked | completed
    who: mariusz           # Optional: mariusz | bartek | claude
    by: "NNNN"             # Optional: task that caused this (e.g., superseded by)
    note: "Task created"   # Optional: what happened
---
```

### History Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `date` | Yes | ISO date of the status change |
| `status` | Yes | New status: active, blocked, completed |
| `who` | No | Person who made the change: mariusz, bartek, claude |
| `by` | Conditional | Task ID array - **required** for `blocked` and superseded `completed` |
| `note` | No | Description of what happened |

### Conditional Required: `by` field

| Status | `by` required? | Example |
|--------|---------------|---------|
| `active` | No | - |
| `blocked` (by task) | **Yes** | `by: ["007", "008"]` - array of blocking task IDs |
| `blocked` (external) | No | Use `note` to explain (e.g., "Docker broken on dev machine") |
| `completed` (normal) | No | - |
| `completed` (superseded) | **Yes** | `by: ["011"]` - array with replacing task ID |

**Note:** `by` only references task IDs. For external blockers (infrastructure, tooling issues), describe in `note` instead.

## Task Structure

```markdown
# [Title]

## Summary
One paragraph: what and why.

## Status: Active
**Current state:** Brief progress description.

## Context
Problem being solved. Links to G- notes if implementing a spec.

## Implementation Plan
### Step 1: [Name]
Description, code snippets if helpful.

### Step 2: [Name]
...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
Additional context.
```

## File vs Directory

**Use file** (`NNNN_TYPE_slug.md`) for most tasks.

**Use directory** (`NNNN_TYPE_slug/`) for complex tasks needing:
- Analysis documents
- Spike investigations
- Working notes
- Multiple related files

```
tasks/015_FEATURE_complex-thing/
├── README.md           # Main task (template content)
├── analysis.md         # Research/analysis
├── spike-approach-a.md # Time-boxed investigation
└── notes.md            # Working notes
```

## Backlog

Future work is tracked in `backlog/` directory (shared ID sequence with tasks).

**Format:** `NNNN_TYPE_slug.md` (e.g., `0022_FEATURE_manager-access.md`)

**Flow:**
1. Add idea to `backlog/` with next available ID
2. When ready: `git mv backlog/NNNN_*.md active/NNNN_*.md`
3. Update `status: backlog` → `status: active`

**See:** [backlog.md](backlog.md) for full documentation

## Connection to Research

Tasks are **spawned from G- notes**:

```yaml
# In G-six-memory/README.md
spawns:
  - ../../1-tasks/0003_FEATURE_domain-models.md
  - ../../1-tasks/0004_FEATURE_postgresql-schema.md
```

```yaml
# In 004_FEATURE_postgresql-schema.md (Context section)
Based on `G-six-memory/20_database_postgresql.md`...
```

## Completing Tasks

When done:

1. Verify all acceptance criteria checked
2. Set `status: completed`
3. Add history entry with `status: completed`, `date`, and `note`
4. Move to `1-tasks/archive/`

```bash
mv 1-tasks/active/0004_FEATURE_postgresql-schema.md 1-tasks/archive/
```

Example history entry:
```yaml
history:
  - date: 2026-01-09
    status: active
    who: mariusz
    note: "Task created"
  - date: 2026-01-15
    status: completed
    who: mariusz
    note: "Implementation complete. All tests passing."
```

## Template

Use `1-tasks/_template.md` when creating new tasks.

## Current Task (`lore/0-session/current-task.md`)

The `current-task.md` file is a symlink to the task currently being worked on.

**Purpose:**
- Auto-loaded by Claude via `@lore/0-session/current-task.md` in CLAUDE.md
- Enforces task-gated development
- Provides immediate context without manual file reads

**Managing current task (MCP tools):**

- Set current task: `lore-framework_set-task` with task_id (e.g., "0042")
- Clear current task: `lore-framework_clear-task`
- View current session: `lore-framework_show-session`

**Behavior:**
- Symlinks to `1-tasks/{status}/NNNN_*.../README.md` for directory tasks
- Symlinks to `1-tasks/{status}/NNNN_*.md` for file tasks
- **Gitignored** - local developer state, not shared

**If `current-task.md` doesn't exist:**
1. View available tasks in `lore/0-session/next-tasks.md`
2. Pick a task: use `lore-framework_set-task` MCP tool
3. Or create a new task first

See [workflow.md](workflow.md) for task-gated development rules.

## Next Tasks (`lore/0-session/next-tasks.md`)

The `next-tasks.md` file lists actionable tasks sorted by priority.

**Purpose:**
- Auto-loaded by Claude via `@lore/0-session/next-tasks.md` in CLAUDE.md
- Quick view of what can be worked on
- Excludes completed tasks and full dependency graph

**Contents:**
- Tasks ready to start (no blockers)
- Sorted by impact (blocks most → least)
- Links to task files
- Under 50 lines for minimal context usage

**Generation:**
Use `lore-framework_generate-index` MCP tool to regenerate both README.md and next-tasks.md.
