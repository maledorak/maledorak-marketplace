---
description: Initialize lore/ directory structure in a new project. Creates directories, CLAUDE.md files, templates, and updates .gitignore.
license: MIT
metadata:
  author: Mariusz (Maledorak) Korzekwa
  updated: 2026-01-25
---

# Lore Framework Init

Initialize `lore/` directory structure in a project.

## Pre-flight Checks

### 1. Check for uncommitted changes

Run:
```bash
git status --porcelain .gitignore CLAUDE.md 2>/dev/null
```

If output is non-empty, **STOP** and respond:

> These files have uncommitted changes:
> - [list files from output]
>
> Please commit or stash your changes first:
> ```
> git add .gitignore CLAUDE.md && git commit -m "chore: save changes before lore init"
> ```
>
> Then run `/lore-framework:init` again.

### 2. Check if lore/ exists

If `lore/` directory exists, ask:

> `lore/` already exists. Options:
> 1. **Repair** - create only missing files
> 2. **Abort** - cancel
>
> Which do you prefer?

In repair mode, skip existing files.

## Step 1: Create Directories

```bash
mkdir -p lore/{0-session,1-tasks/{backlog,active,blocked,archive},2-adrs,3-wiki/project}
```

## Step 2: Create lore/CLAUDE.md

```markdown
# Lore Directory

Context persistence for stateless Claude sessions. Use `/lore-framework` skill when working here.

## Session Files

| File | Purpose | Committed |
|------|---------|-----------|
| `0-session/current-user.md` | Who is working (generated) | No |
| `0-session/current-task.md` | Symlink to active task | No |
| `0-session/current-task.json` | Task metadata for agents (id + path) | No |
| `0-session/team.yaml` | Team data (source of truth) | Yes |
| `0-session/next-tasks.md` | Available tasks (auto-generated) | No |
| `README.md` | Full index with Mermaid (heavy) | Yes |

**Before coding:** Ensure `0-session/current-user.md` and `0-session/current-task.md` exist.

**Setup:** Use MCP tools `lore-framework_set-user` and `lore-framework_set-task`

## Structure

Each subdirectory has `CLAUDE.md` with local context.

```
lore/
├── 0-session/CLAUDE.md    # Session state
├── 1-tasks/CLAUDE.md      # Task system
│   ├── backlog/CLAUDE.md
│   ├── active/CLAUDE.md
│   ├── blocked/CLAUDE.md
│   └── archive/CLAUDE.md
├── 2-adrs/CLAUDE.md       # ADR frontmatter
└── 3-wiki/CLAUDE.md       # Project docs
```

## Quick Reference

**Format:** `NNNN_TYPE_slug.md` (shared ID sequence for tasks + backlog)

**Task lifecycle:** `backlog/` → `active/` → `blocked/` ↔ `active/` → `archive/`

**Note prefixes:** Q- (Question), I- (Idea), R- (Research), S- (Synthesis), G- (Generation)

**Templates:** Use `_template.md` in each directory.

## Full Documentation

All system docs are in the `/lore-framework` skill.
```

## Step 3: Create lore/0-session/CLAUDE.md

```markdown
# Session Directory

Local session state. Files are gitignored except `team.yaml`.

| File | Purpose |
|------|---------|
| `current-user.md` | Who is working |
| `current-task.md` | Symlink to active task |
| `current-task.json` | Task metadata (id + path) |
| `team.yaml` | Team data (source of truth) |
| `next-tasks.md` | Available tasks by priority |

## Automatic Setup

Configure `LORE_SESSION_CURRENT_USER` in `.claude/settings.local.json`:

```json
{
  "env": {
    "LORE_SESSION_CURRENT_USER": "your-id"
  }
}
```

The session start hook auto-generates `current-user.md` on startup.

## Manual Setup

Use MCP tools:
- `lore-framework_set-user` — Set current user
- `lore-framework_set-task` — Set current task by ID
- `lore-framework_list-users` — List available users
- `lore-framework_show-session` — Show current session state
```

## Step 4: Create lore/1-tasks/CLAUDE.md

```markdown
# Tasks

All tasks by lifecycle status. Shared ID sequence (NNNN).

## Directories

- [backlog/](backlog/CLAUDE.md) — future work, not yet started
- [active/](active/CLAUDE.md) — currently in progress
- [blocked/](blocked/CLAUDE.md) — waiting on dependencies
- [archive/](archive/CLAUDE.md) — completed

## Format

`NNNN_TYPE_slug.md` or `NNNN_TYPE_slug/` (directory for complex tasks)

## Task Size

**Keep README.md short** (~50-100 lines): summary, status, context.

Heavy content goes into `notes/` subdirectory. **Convert to directory when task grows beyond ~150 lines.**

## Note Prefixes

| Prefix | Type | Use for |
|--------|------|---------|
| `Q-` | Question | What we're trying to answer |
| `I-` | Idea | Original thoughts, hypotheses |
| `R-` | Research | External knowledge (papers, docs, analysis) |
| `S-` | Synthesis | Conclusions, decisions ("so what?") |
| `G-` | Generation | Artifacts we produce (specs, schemas, designs) |

Lineage via `spawned_from`/`spawns`. Status: `seed → developing → mature → superseded`.

Create: `_note_template.md` | Full docs: `/lore-framework` skill

## Lifecycle

```
backlog/ → active/ → blocked/ ↔ active/ → archive/
```

Promotion: `git mv` between directories, update `status` in frontmatter.

## Templates

- `_template.md` — new tasks
- `_note_template.md` — notes in task `notes/` directories
```

## Step 5: Create lore/1-tasks/active/CLAUDE.md

```markdown
# Active Tasks

Tasks currently being worked on.

## Rules

- One task active per person at a time (focus)
- Update status in frontmatter when moving
- Add history entry on status change

## Moving Tasks

**To blocked:**
```bash
git mv active/NNNN_*.md blocked/
```
Update frontmatter: `status: blocked`, add `by: ["blocking-task-id"]`

**To archive:**
```bash
git mv active/NNNN_*.md archive/
```
Update frontmatter: `status: completed`
```

## Step 6: Create lore/1-tasks/blocked/CLAUDE.md

```markdown
# Blocked Tasks

Tasks waiting on dependencies.

## Rules

- Must specify what's blocking in history entry
- Use `by: ["NNNN"]` for task dependencies
- Use `note:` for external blockers (not task-related)

## Frontmatter Example

```yaml
history:
  - date: 2025-01-20
    status: blocked
    who: claude
    by: ["0007", "0008"]
    note: "Waiting on domain models and schema"
```

## Unblocking

When blocker resolves, move back to active:
```bash
git mv blocked/NNNN_*.md active/
```
Update frontmatter: `status: active`, add history entry.
```

## Step 7: Create lore/1-tasks/archive/CLAUDE.md

```markdown
# Archive

Completed tasks. Reference for context and history.

## Status Values

| Status | Meaning |
|--------|---------|
| `completed` | Done successfully |
| `superseded` | Replaced by another task (use `by:`) |
| `canceled` | Won't do (use `reason:`) |

## Canceled Reasons

- `pivot` — direction change
- `obsolete` — no longer needed
- `duplicate` — covered elsewhere

## Frontmatter Examples

**Completed:**
```yaml
history:
  - date: 2025-01-20
    status: completed
    who: claude
    note: "All acceptance criteria met"
```

**Superseded:**
```yaml
history:
  - date: 2025-01-20
    status: superseded
    who: claude
    by: ["0015"]
    note: "Replaced by consolidated task"
```

**Canceled:**
```yaml
history:
  - date: 2025-01-20
    status: canceled
    who: claude
    reason: pivot
    note: "Direction changed after review"
```
```

## Step 8: Create lore/1-tasks/backlog/CLAUDE.md

```markdown
# Backlog

Future work, not yet started.

## Format

Same as tasks: `NNNN_TYPE_slug.md`

Use `status: backlog` in frontmatter.

## Tags

| Category | Values |
|----------|--------|
| Priority | `priority-high`, `priority-medium`, `priority-low` |
| Effort | `effort-small`, `effort-medium`, `effort-large` |

Add project-specific tags as needed.

## Promotion

When ready to start:
```bash
git mv backlog/NNNN_*.md active/
```
Update frontmatter: `status: active`, add history entry.
```

## Step 9: Create lore/2-adrs/CLAUDE.md

```markdown
# Architecture Decision Records

Documented decisions. Written **post-factum** after implementation.

## Frontmatter

```yaml
---
id: "NNNN"
title: "Decision Title"
status: proposed  # proposed | accepted | deprecated | superseded
deciders: [team-member]
related_tasks: ["0008", "0019"]
related_adrs: ["0002"]
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: proposed
    who: team-member
    note: "ADR created"
---
```

## Status Lifecycle

`proposed` → `accepted` → `deprecated` or `superseded`

| Status | Meaning |
|--------|---------|
| `proposed` | Under discussion |
| `accepted` | Active decision |
| `deprecated` | No longer recommended, no replacement |
| `superseded` | Replaced by newer ADR (use `by` in history) |

## History Entry

| Field | Required | Description |
|-------|----------|-------------|
| `date` | Yes | ISO date |
| `status` | Yes | proposed, accepted, deprecated, superseded |
| `who` | No | Team member id |
| `by` | Conditional | **Required** if `superseded` - the replacing ADR ID |
| `note` | No | What happened |

## Template

Use `_template.md` for new ADRs.
```

## Step 10: Create lore/3-wiki/CLAUDE.md

```markdown
# Wiki

Living documentation. Current state, not history.

**Separation:**
- **1-tasks/** = What to build (progress)
- **2-adrs/** = Why we chose X (decisions)
- **3-wiki/** = What IS (current state)

## Structure

```
3-wiki/
└── project/
    ├── structure.md    # Project layout
    └── architecture.md # Current architecture
```

Add project-specific documentation as needed.

## Guidelines

- Keep wiki current — update when things change
- Don't duplicate task content — link instead
- Focus on "what is" not "what was"
```

## Step 11: Create lore/1-tasks/_template.md

```markdown
---
id: "NNNN"
title: "[Title]"
type: FEATURE  # BUG | FEATURE | RESEARCH | REFACTOR | DOCS
status: active  # active | blocked | completed | backlog
related_adr: []
related_tasks: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: active
    who: your-id
    note: "Task created"
---

# [Title]

## Summary

One paragraph describing what this task accomplishes and why it matters.

## Status: Active

**Current state:** [Brief description of progress]

## Context

What problem are we solving? Why is this task needed?

## Implementation Plan

### Step 1: [Name]

Description of what to do.

### Step 2: [Name]

...

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Notes

Any additional context, links, or considerations.
```

## Step 12: Create lore/1-tasks/_note_template.md

```markdown
---
title: "[Note Title]"
type: question  # question | idea | research | synthesis | generation
status: seed  # seed | developing | mature | superseded
spawned_from: notes/Q-parent-note.md  # Optional for ideas
spawns: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: seed
    who: your-id
    note: "Note created"
---

# [Note Title]

Content here.

---

## Note Prefix Guide

| Prefix | Type | Use for |
|--------|------|---------|
| `Q-` | question | What we're trying to answer |
| `I-` | idea | Original thoughts, hypotheses |
| `R-` | research | External knowledge (papers, docs, analysis) |
| `S-` | synthesis | Conclusions, decisions ("so what?") |
| `G-` | generation | Artifacts we produce (specs, schemas, designs) |

## Status Lifecycle

```
seed → developing → mature → superseded
```

## Naming

`PREFIX-slug.md` or `PREFIX-slug/` (directory with README.md)
```

## Step 13: Create lore/2-adrs/_template.md

```markdown
---
id: "NNNN"
title: [Short descriptive title]
status: proposed  # proposed | accepted | deprecated | superseded
deciders: [team-member]
related_tasks: []
related_adrs: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: proposed
    who: team-member
    note: "ADR created"
---

# ADR NNNN: [Title]

**Related:**
- [Task NNNN: Description](../1-tasks/active/NNNN_TYPE_slug.md)

---

## Context

What is the issue that we're seeing that motivates this decision or change?

---

## Decision

What is the change that we're proposing and/or doing?

---

## Rationale

Why is this the best choice among the alternatives?

---

## Alternatives Considered

### Alternative 1: [Name]

**Description:** Brief explanation.

**Pros:**
- ...

**Cons:**
- ...

**Decision:** REJECTED - [reason]

---

## Consequences

### Positive

- What becomes easier?

### Negative

- What becomes harder?

---

## References

- [External Link](https://example.com) - Description
```

## Step 14: Ask for team member id

Ask the user:

> What's your id for team.yaml?
> (Used for session tracking - example: `john`, `alice`, `dev1`)

## Step 15: Create lore/0-session/team.yaml

Replace `USER_ID` with user's answer:

```yaml
USER_ID:
  name: "Your Full Name"
  role: "Your Role"
  focus: "What you work on"
```

## Step 16: Update .gitignore

Append these lines (skip if already present):

```gitignore
# Lore framework - session-local files
lore/0-session/current-user.md
lore/0-session/current-task.md
lore/0-session/current-task.json
lore/0-session/next-tasks.md
```

## Step 17: Update CLAUDE.md

If `CLAUDE.md` doesn't exist, create with project name as title.

Insert after title (or at top):

```markdown
## Session Gate

**Before any work, verify:**

| Check | File | If Missing |
|-------|------|------------|
| **Who** | `lore/0-session/current-user.md` | Auto-generated from `LORE_SESSION_CURRENT_USER` env |
| **What** | `lore/0-session/current-task.md` | Pick from `lore/0-session/next-tasks.md`, use MCP tool `lore-framework_set-task` |

## Task-Gated Development

**Writing code without an active task is FORBIDDEN.**

## Context

@lore/0-session/current-user.md
@lore/0-session/current-task.md
@lore/0-session/next-tasks.md
@lore/CLAUDE.md
```

## Completion

After all steps, respond:

> Lore framework initialized.
>
> **Next steps:**
> 1. Edit `lore/0-session/team.yaml` to add your full details
> 2. Configure auto-user in `.claude/settings.local.json`:
>    ```json
>    { "env": { "LORE_SESSION_CURRENT_USER": "USER_ID" } }
>    ```
> 3. Create your first task - ask me to create a RESEARCH or FEATURE task

Replace `USER_ID` with user's chosen id.
