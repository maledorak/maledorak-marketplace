---
name: lore-framework
description: Manage lore/ directory for tracking tasks, ADRs, wiki, and session. Use for session setup (current-user, current-task), task management (active/blocked/archive), ADR creation, wiki updates, and lore index generation. Invoke for any lore/ directory operations.
---

# Lore Framework

Manage lore/ directory for tracking tasks, code history, and project state. Use this skill when working with `lore/` directory content.

## First-Time Installation

If `lore/` directory doesn't exist, see [INSTALL.md](INSTALL.md) for setup instructions.

Quick: Ask Claude to "bootstrap lore" after loading this skill.

**Language:** All documentation must be in English.

**Style:** Be concise. No ASCII art boxes. Use blockquotes (`>`) for status notes. Short sentences.

## Session Requirements

**Before any work:**
1. Check `lore/0-session/current-user.md` exists (who is working)
2. Check `lore/0-session/current-task.md` exists (active task)

| File | Purpose | Committed |
|------|---------|-----------|
| `0-session/current-user.md` | Local identity (auto-generated) | No |
| `0-session/current-task.md` | Symlink to active task | No |
| `0-session/next-tasks.md` | Actionable tasks (auto-generated) | No |
| `0-session/team.yaml` | Team data (source of truth) | Yes |

**Automatic setup:** Configure `LORE_SESSION_CURRENT_USER` in `.claude/settings.local.json`:
```json
{ "env": { "LORE_SESSION_CURRENT_USER": "your-id" } }
```

**Manual setup via MCP tools:**
- User: `lore-framework_set-user` tool with user_id parameter
- Task: `lore-framework_set-task` tool with task_id parameter
- Show: `lore-framework_show-session` tool
- List users: `lore-framework_list-users` tool

**Why:** Code is ephemeral; tasks + worklogs provide AI-readable history for future sessions.

See [reference/workflow.md](reference/workflow.md) for full rules.

## Which Note Type? (Decision Tree)

**Ask yourself what you're doing:**

| If you're thinking... | Create | Example |
|-----------------------|--------|---------|
| "How should we solve X?" | **Q-** (Question) | Q-how-should-tenant-isolation-work.md |
| "What if we did Y?" | **I-** (Idea) | I-use-crm-for-access-control.md |
| "I found that Z does..." | **R-** (Research) | R-postgres-rls-patterns.md |
| "We should do X because Y" | **S-** (Synthesis) | S-chose-three-database-architecture.md |
| "Here's the detailed spec" | **G-** (Generation) | G-api-design/ |

### S- vs G- (Important Distinction)

| | S- (Synthesis) | G- (Generation) |
|---|----------------|-----------------|
| **Focus** | Decision + reasoning | Specification + detail |
| **Answers** | "What and WHY?" | "HOW exactly?" |
| **Content** | Reasoning, alternatives, trade-offs | Schema, API, data flow, code |
| **Length** | 1-5 pages typically | Can be very long (1000+ lines) |
| **Leads to** | ADR (formal decision) | Tasks (implementation) |

**When to use which:**
- **Both S- and G-:** Complex decisions (S- captures reasoning, G- captures spec)
- **Only S-:** Simple decision where reasoning is the main value, implementation is obvious
- **Only G-:** Obvious choice, just need the detailed spec
- **Skip both:** Trivial, go straight to task

### Ideas (I-) Are Special

Ideas are **orthogonal** to the main Q→R→S→G flow:
- Can come from anywhere (or nowhere - spontaneous thought)
- Can lead to anywhere (Q, R, S, or G directly)
- Don't need a question first
- `spawned_from` is optional for Ideas

### What About Tasks vs Backlog vs Notes?

| Create | When |
|--------|------|
| **RESEARCH task** | Design/knowledge work with Q/I/R/S/G notes in `notes/` subdir |
| **FEATURE/BUG task** | Ready to implement NOW |
| **Backlog** | Future work, parking it for later |

**Flow:** RESEARCH task → FEATURE/BUG task → (optional ADR) → archive

## Lineage Tracking

**Why track lineage?**
- Understand WHY decisions were made
- See impact if something changes
- Claude can follow the chain to recover context

**Rules:**
1. **Link backward:** Set `spawned_from` to parent note (except root Q- or spontaneous I-)
2. **Link forward:** Add child to parent's `spawns` list
3. **Cross boundaries:** G- notes spawn tasks: `spawns: [../active/NNNN_FEATURE_*.md]`
4. **Keep paths relative:** Enables moving without breaking links

**Example chain:**
```
1-tasks/archive/0001_RESEARCH_api-design/notes/
├── Q-how-should-api-work.md
│   └─spawns→ R-rest-patterns/
│               └─spawns→ S-architecture-decision.md
│                           └─spawns→ G-api-design/
└── G-api-design/ spawns → 1-tasks/active/0007_FEATURE_api-endpoints.md
```

**Important:** Notes can only link to other notes within the SAME task. Cross-task relationships go in task README via `related_tasks`.

## Systems Overview

| System | Location | Format | Purpose |
|--------|----------|--------|---------|
| Active tasks | `1-tasks/active/` | `NNNN_TYPE_slug.md` or dir | Work in progress |
| Blocked tasks | `1-tasks/blocked/` | `NNNN_TYPE_slug.md` or dir | Waiting on deps |
| Archived tasks | `1-tasks/archive/` | `NNNN_TYPE_slug.md` or dir | Completed work |
| Backlog | `1-tasks/backlog/` | `NNNN_TYPE_slug.md` | Future work |
| ADRs | `2-adrs/` | `NNNN_slug.md` | Formal decision records |

**Task directories contain:**
- `README.md` - main task file
- `notes/` - Q/I/R/S/G research notes
- `worklog/` - session logs (update during work sessions)
- `sources/` - downloaded web content (articles, papers)

**RESEARCH tasks** always use directory format.

## Note Frontmatter Template

```yaml
---
title: "Note Title"
type: question | idea | research | synthesis | generation
status: seed | developing | mature | superseded
spawned_from: notes/Q-parent.md      # Optional for I-, required for others
spawns:                               # Update when creating children
  - notes/R-child.md
  - ../../1-tasks/NNNN_TYPE_slug.md
tags: [tag1, tag2]
links: []
history:
  - date: YYYY-MM-DD
    status: seed
    who: your-id  # your-id | teammate | claude
    note: "Note created"
---
```

### Status Values

| Status | Meaning | Move to next when... |
|--------|---------|---------------------|
| `seed` | Initial, incomplete | Actively working on it |
| `developing` | Being worked on | Complete and stable |
| `mature` | Stable, reliable | Replaced by newer version |
| `superseded` | Replaced | (terminal state) |

## Quick Templates

### Q- (Question)
```markdown
---
title: "How should X work?"
type: question
status: seed
spawns: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: seed
    who: your-id
    note: "Question created"
---

# How should X work?

## Context
Why this question matters...

## What Would Answer This
- Criteria 1
- Criteria 2
```

### I- (Idea)
```markdown
---
title: "What if we did Y?"
type: idea
status: seed
spawned_from: notes/Q-optional-parent.md  # Optional!
spawns: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: seed
    who: your-id
    note: "Idea proposed"
---

# What if we did Y?

## The Idea
Description...

## Why This Might Work
Reasoning...

## Open Questions
- What needs investigation?
```

### S- (Synthesis) - Decision Documentation
```markdown
---
title: "Decision: Chose X approach"
type: synthesis
status: developing
spawned_from: notes/R-research.md
spawns: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: seed
    who: your-id
    note: "Decision drafted"
---

# Decision: Chose X approach

## Conclusion
We will use X because Y.

## Reasoning
1. First reason
2. Second reason

## Alternatives Considered
- Alternative A: Why not chosen
- Alternative B: Why not chosen
```

### G- (Generation) - Detailed Spec
```markdown
---
title: "X System Specification"
type: generation
status: developing
spawned_from: notes/S-decision.md
spawns: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: seed
    who: your-id
    note: "Specification started"
---

# X System Specification

## Overview
What this spec covers...

## [Detailed technical content]
Schema, API, data flow, etc.
```

## Tasks Quick Reference

**Format:** `NNNN_TYPE_slug.md` or `NNNN_TYPE_slug/` (TYPE = BUG | FEATURE | RESEARCH | REFACTOR | DOCS)

**Lifecycle:** 1-tasks/backlog/ → 1-tasks/active/ → 1-tasks/blocked/ → 1-tasks/archive/

### Task Status Values

| Status | Meaning | `by` required | `reason` required |
|--------|---------|---------------|-------------------|
| `active` | In progress | No | No |
| `blocked` | Waiting on deps | Yes (blocking tasks) | No |
| `completed` | Done successfully | No | No |
| `superseded` | Replaced by another task | Yes (replacing task) | No |
| `canceled` | Won't do | No | Yes |

**Canceled reasons:** `pivot` (direction change), `obsolete` (no longer needed), `duplicate` (covered elsewhere)

```yaml
---
id: "NNNN"
title: "Task Title"
type: FEATURE  # or RESEARCH for knowledge work
status: active
related_adr: []
related_tasks: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: active
    who: your-id  # your-id | teammate | claude
    note: "Task created"
  # Examples of status changes:
  - date: YYYY-MM-DD
    status: blocked
    who: claude
    by: ["0007", "0008"]  # required for blocked
    note: "Waiting on domain models and PostgreSQL schema"
  - date: YYYY-MM-DD
    status: superseded
    who: your-id
    by: ["0015"]  # required for superseded
    note: "Replaced by consolidated task"
  - date: YYYY-MM-DD
    status: canceled
    who: your-id
    reason: pivot  # required for canceled: pivot | obsolete | duplicate
    note: "Direction changed after product review"
---
```

**RESEARCH tasks** use directory format with `notes/` subdirectory for Q/I/R/S/G files.

## Backlog Quick Reference

**Format:** Same as tasks. Use `status: backlog` and tag conventions:

| Tag Category | Values |
|--------------|--------|
| Priority | `priority-high`, `priority-medium`, `priority-low` |
| Effort | `effort-small`, `effort-medium`, `effort-large` |

**Template:** Use main `1-tasks/_template.md` with `status: backlog`

**Promotion:** `git mv backlog/NNNN_*.md active/` then change `status: backlog` → `status: active`

## ADRs Quick Reference

**Format:** `NNNN_slug.md`

**When:** After making significant architectural decision (often informed by S- notes)

```yaml
---
id: "NNNN"
title: "Decision Title"
status: accepted  # proposed | accepted | deprecated | superseded
deciders: [Team/Person]
related_tasks: []
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: accepted
    who: your-id
    note: "ADR created and accepted"
---
```

## File vs Directory

**Use file** (`task.md`): Simple task, no research notes
**Use directory** (`task/`): RESEARCH task or task with multiple files

```
tasks/
├── _template.md
├── _note_template.md
├── backlog/
│   ├── NNNN_TYPE_slug.md
│   └── NNNN_TYPE_slug/       # Complex tasks allowed
├── active/
│   ├── NNNN_TYPE_slug.md
│   └── NNNN_TYPE_slug/
│       ├── README.md
│       └── notes/            # Q/I/R/S/G prefixed
├── blocked/
│   ├── NNNN_TYPE_slug.md
│   └── NNNN_TYPE_slug/
└── archive/
    └── NNNN_TYPE_slug/
        ├── README.md
        └── notes/
```

## Reference

**Setup:**
- [INSTALL.md](INSTALL.md) - First-time installation guide

**Documentation** in `reference/`:
- [overview.md](reference/overview.md) - Directory structure, systems overview
- [workflow.md](reference/workflow.md) - Knowledge flow, task-gated development
- [tasks.md](reference/tasks.md) - Task system details
- [backlog.md](reference/backlog.md) - Backlog management
- [notes.md](reference/notes.md) - Q/I/R/S/G note types
- [adr.md](reference/adr.md) - Architecture Decision Records
- [sources.md](reference/sources.md) - Web content handling
- [worklog.md](reference/worklog.md) - Session logs
- [frontmatter.md](reference/frontmatter.md) - YAML schemas
