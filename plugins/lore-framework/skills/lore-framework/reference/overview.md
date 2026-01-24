# Lore Directory Documentation

Complete documentation for the `lore/` directory - project management, knowledge tracking, and context persistence for the Six project.

## Language

**All documentation must be in English.** This includes:
- Tasks, ADRs, research notes
- Code comments and docstrings
- Commit messages
- Backlog items

## Purpose

The `lore/` directory provides:
- **Context persistence** for stateless Claude sessions
- **Knowledge tracking** from questions through research to implementation
- **Decision documentation** via ADRs
- **Implementation tracking** via tasks
- **Future work planning** via backlog

## Directory Structure

```
lore/
├── 0-session/          # Session state (user + task)
│   ├── current-user.md     # Who (generated, gitignored)
│   ├── current-task.md     # What (symlink, gitignored)
│   ├── team.yaml           # Team data (source of truth)
│   └── next-tasks.md       # Available tasks (generated)
├── 1-tasks/            # All tasks by lifecycle status
│   ├── _template.md
│   ├── backlog/        # Future work (same NNNN format)
│   ├── active/         # Tasks in progress
│   │   └── NNNN_TYPE_slug/
│   │       ├── README.md
│   │       ├── notes/      # Q/I/R/S/G research notes
│   │       ├── worklog/    # Session logs
│   │       └── sources/    # Downloaded web content
│   ├── blocked/        # Tasks waiting on dependencies
│   └── archive/        # Completed tasks
├── 2-adrs/             # Architecture Decision Records
└── 3-wiki/             # Living documentation (current state)
    ├── project/        # Six project documentation
    │   ├── structure.md
    │   └── architecture.md
    └── system/         # lore/ system documentation (THIS)
        ├── overview.md
        ├── tasks.md
        ├── adr.md
        └── ...
```

**Key points:**
- `0-session/` for local session state (who is working, what task)
- Notes and sources live **inside task directories**
- `3-wiki/` for current state documentation
- Numbered prefixes (0-, 1-, 2-, 3-) for consistent sorting
- Backlog is inside `1-tasks/`

## Systems Overview

### Tasks (`1-tasks/`)

**Format:** `NNNN_TYPE_slug.md` or `NNNN_TYPE_slug/` (directory for complex tasks)
- NNNN = sequential number (0001, 0002...)
- TYPE = BUG | FEATURE | RESEARCH | REFACTOR | DOCS

**Lifecycle:** `1-tasks/backlog/` → `active/` → `blocked/` → `archive/`

**Purpose:** Track implementation work. What to build, current state, blockers.

**Task directories contain:**
- `README.md` - main task file
- `notes/` - Q/I/R/S/G research notes
- `worklog/` - session logs (updated by Claude during work)
- `sources/` - downloaded web content

**Details:** [tasks.md](tasks.md)

### Backlog (`1-tasks/backlog/`)

**Format:** `NNNN_TYPE_slug.md` (same as tasks, shared ID sequence)
- NNNN = sequential ID (shared with tasks)
- TYPE = FEATURE | IMPROVEMENT | RESEARCH

**Lifecycle:** idea → backlog item → promoted to active task (just `git mv`, no rename)

**Purpose:** Track future work not yet ready for implementation.

**Details:** [backlog.md](backlog.md)

### ADRs (`2-adrs/`)

**Format:** `NNNN_title-slug.md`

**Lifecycle:** proposed → accepted → deprecated/superseded

**Purpose:** Document architectural decisions post-factum. Why we chose X over Y.

**Details:** [adr.md](adr.md)

### Research Notes (inside tasks)

**Location:** `1-tasks/{status}/NNNN_TYPE_slug/notes/`

**Note prefixes:** Q (Question), I (Idea), R (Research), S (Synthesis), G (Generation)

**Note lifecycle:** seed → developing → mature → superseded

**Purpose:** Track knowledge evolution from questions to specifications.

**Note:** Research notes live inside complex tasks, not in a separate `research/` directory.

**Details:** [notes.md](notes.md), [workflow.md](workflow.md), [sources.md](sources.md)

## How Systems Connect

```
                              ┌─────────────┐
                              │    Idea     │
                              │    (I-)     │
                              └──────┬──────┘
                                     │
           can spawn from OR lead to any stage
                                     │
    ┌────────────────────────────────┼────────────────────────────┐
    │                                │                            │
    ▼                                ▼                            ▼
I- ───► Q- ───► R- ───► S- ───► G- ───► backlog/tasks
                              │                        │
                              ▼                        ▼
                            adr/                   archive/
```

**Main flow:** I (Idea) or Q (Question) → R (Research) → S (Synthesis) → G (Generation) → implementation

**Ideas (I-):** Orthogonal to main flow - can enter or exit at any point
- Spontaneous thoughts don't need a question first
- Ideas can spawn questions, research, synthesis, or generation directly
- Research or synthesis can spawn new ideas

**Key relationships:**
- **Q- notes** may be spawned from ideas or emerge from discussions
- **I- notes** can spawn from anywhere and lead to anywhere (they're insights, not investigations)
- **S- notes** (synthesis) often inform **ADRs** (formal decisions)
- **G- notes** (specifications) spawn **tasks** (implementation) or **backlog** items
- **Backlog** items are promoted to **tasks** when ready to implement

## Quick Reference

| System | Location | Format | Purpose |
|--------|----------|--------|---------|
| Tasks | `1-tasks/{status}/` | `NNNN_TYPE_slug.md` | Implementation work |
| Backlog | `1-tasks/backlog/` | `NNNN_TYPE_slug.md` | Future work |
| ADRs | `2-adrs/` | `NNNN_slug.md` | Decision documentation |
| Notes | `task/notes/` | `PREFIX-slug.md` | Knowledge evolution |
| Sources | `task/sources/` | `slug.md` | Web content |

## Documentation Index

### Project Overview
- [index.md](index.md) - **Lore Index** - Auto-generated dependency graph, task status, ready-to-start recommendations

### Systems
- [tasks.md](tasks.md) - Task system (format, lifecycle, blocking)
- [backlog.md](backlog.md) - Backlog system (future work tracking)
- [adr.md](adr.md) - Architecture Decision Records

### Research Framework
- [notes.md](notes.md) - Note types (Q/I/R/S/G)
- [workflow.md](workflow.md) - Knowledge flow, lineage tracking
- [sources.md](sources.md) - Web content handling
- [worklog.md](worklog.md) - Session logs

### Reference
- [frontmatter.md](frontmatter.md) - YAML schemas for all content types

## Using This System

**For Claude:** Use `/lore-framework` skill when working with any part of lore/

**For humans:**
1. Start with this overview.md
2. Read specific docs as needed
3. Use templates in each directory
