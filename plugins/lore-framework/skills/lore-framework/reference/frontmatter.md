# Frontmatter Schemas

YAML frontmatter schemas for all content types in the lore directory.

## Research Notes

Notes live inside complex tasks (in `notes/` subdirectory). Schema:

```yaml
---
title: "Note Title"
type: question | idea | research | synthesis | generation
status: seed | developing | mature | superseded
tags: [tag1, tag2]
links: []
history:
  - date: YYYY-MM-DD
    status: seed
    who: mariusz
    spawned_from:                         # Optional: what led to this
      - notes/Q-parent-note.md
    note: "Note created"
  - date: YYYY-MM-DD
    status: developing
    who: claude
    spawns:                               # Optional: what this led to
      - notes/R-child-research.md
      - notes/S-conclusion.md
    note: "Spawned research and synthesis"
---
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Human-readable title |
| `type` | Yes | Note type: question, idea, research, synthesis, generation |
| `status` | Yes | Lifecycle: seed, developing, mature, superseded |
| `tags` | No | Categorization tags |
| `links` | No | External URLs |
| `history` | Yes | Array of status change entries |

### History Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `date` | Yes | ISO date (YYYY-MM-DD) |
| `status` | Yes | seed, developing, mature, superseded |
| `who` | Yes | Person/agent who made the change (string) |
| `spawned_from` | No | Array of relative paths to parent notes (tracks when relationship was created) |
| `spawns` | No | Array of relative paths to child notes (tracks when spawned) |
| `by` | Conditional | Note path - **required** if status = `superseded` |
| `note` | No | What happened |

### Examples

**Question note:**
```yaml
---
title: "How should AI memory work to feel natural?"
type: question
status: mature
spawns:
  - notes/R-memory-patterns/README.md
tags: [memory, core-question]
links: []
history:
  - date: 2025-12-10
    status: seed
    who: mariusz
    note: "Note created"
  - date: 2025-12-15
    status: mature
    who: mariusz
    note: "Answered through R-memory-patterns and G-six-memory"
---
```

**Research note:**
```yaml
---
title: "Memory Patterns Research"
type: research
status: mature
spawned_from: notes/Q-how-should-ai-memory-work.md
spawns:
  - notes/S-memory-architecture-decision.md
tags: [memory, research, patterns]
links: []
history:
  - date: 2025-12-10
    status: seed
    who: mariusz
    note: "Note created"
  - date: 2025-12-15
    status: mature
    who: mariusz
    note: "Research complete"
---
```

**Synthesis note:**
```yaml
---
title: "Memory Architecture Decision: Three-Database Hybrid"
type: synthesis
status: mature
spawned_from: notes/R-memory-patterns/README.md
spawns:
  - notes/G-six-memory/README.md
tags: [architecture, decision]
links: []
history:
  - date: 2025-12-12
    status: mature
    who: mariusz
    note: "Decision documented"
---
```

**Generation note:**
```yaml
---
title: "Six Memory System Specification"
type: generation
status: mature
spawned_from: notes/S-memory-architecture-decision.md
spawns: []
tags: [specification, memory, core]
links: []
history:
  - date: 2025-12-10
    status: seed
    who: mariusz
    note: "Note created"
  - date: 2026-01-09
    status: mature
    who: mariusz
    note: "Specification complete"
---
```

## Sources

Web content in task `sources/` directories uses:

```yaml
---
url: "https://example.com/article"
title: "Article Title"
fetched_date: YYYY-MM-DD
author: "Author Name"           # Optional
tags: [tag1, tag2]              # Optional
image_count: 2                  # If images downloaded
images:                         # If images downloaded
  - original_url: "https://..."
    local_path: "images/article-slug/img_1.png"
---
```

See [sources.md](sources.md) for full documentation.

## Tasks

Tasks in `1-tasks/` use:

```yaml
---
id: "NNNN"
title: "Task Title"
type: BUG | FEATURE | RESEARCH | REFACTOR | DOCS
status: active | blocked | completed | superseded | canceled
related_adr: ["0001"]
related_tasks: ["0002", "0003"]
tags: [tag1, tag2]
links: []
history:
  - date: YYYY-MM-DD
    status: active
    who: mariusz           # Required: person/agent who made the change
    by: ["NNNN"]           # Conditional: see below
    reason: pivot          # Conditional: only for canceled
    note: "Task created"   # Optional
---
```

### Task Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Task ID (NNNN format) |
| `title` | Yes | Human-readable title |
| `type` | Yes | BUG, FEATURE, RESEARCH, REFACTOR, DOCS |
| `status` | Yes | active, blocked, completed, superseded, canceled |
| `related_adr` | No | List of related ADR IDs |
| `related_tasks` | No | List of related task IDs |
| `tags` | No | Categorization tags |
| `links` | No | External URLs |
| `history` | Yes | Array of status change entries |

### History Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `date` | Yes | ISO date (YYYY-MM-DD) |
| `status` | Yes | active, blocked, completed, superseded, canceled |
| `who` | Yes | Person/agent who made the change (string) |
| `by` | Conditional | Task ID array - required for `blocked` and `superseded` |
| `reason` | Conditional | Required for `canceled`: pivot, obsolete, duplicate |
| `note` | No | What happened |

**`by` is required when:**
- `status: blocked` → must specify blocking task(s)
- `status: superseded` → must specify replacing task(s)

**`reason` is required when:**
- `status: canceled` → must specify why: `pivot`, `obsolete`, or `duplicate`

**`by` is NOT used for:**
- External blockers (infrastructure, tooling) - use `note` to explain instead

## Backlog

Backlog items use **standard task frontmatter** with `status: backlog`. Use tags for priority/phase/effort:

```yaml
---
id: "NNNN"
title: "Backlog Item Title"
type: FEATURE
status: backlog
related_adr: []
related_tasks: ["0023"]
tags: [access-control, priority-high, phase-pro, effort-medium]
links: []
history:
  - date: YYYY-MM-DD
    status: backlog
    who: mariusz
    note: "Backlog item created"
---
```

### Tag Conventions

| Category | Tags |
|----------|------|
| Priority | `priority-high`, `priority-medium`, `priority-low` |
| Phase | `phase-pro`, `phase-enterprise`, `phase-future` |
| Effort | `effort-small`, `effort-medium`, `effort-large` |

**Promotion:** `git mv backlog/NNNN_*.md active/` then change `status: backlog` → `status: active`

## ADRs

Architecture decisions in `2-adrs/` use:

```yaml
---
id: "NNNN"
title: "Decision Title"
status: proposed | accepted | deprecated | superseded
deciders: [Team/Person]
related_tasks: ["0004", "0005"]
tags: []
links: []
history:
  - date: YYYY-MM-DD
    status: proposed
    who: mariusz
    note: "ADR created"
  - date: YYYY-MM-DD
    status: accepted
    who: mariusz
    note: "Accepted after review"
---
```

### ADR History Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `date` | Yes | ISO date (YYYY-MM-DD) |
| `status` | Yes | proposed, accepted, deprecated, superseded |
| `who` | Yes | Person/agent who made the change (string) |
| `by` | Conditional | ADR ID - **required** if status = `superseded` |
| `note` | No | What happened |

## Validation

When creating/updating content, verify:

1. **Required fields present** - check schema for each content type
2. **Type matches prefix** - Q- notes have type: question, etc.
3. **Status is valid** - use correct values for content type
4. **Paths are relative** - spawned_from/spawns use relative paths
5. **Dates are ISO format** - YYYY-MM-DD
6. **Language is English** - all lore/ content must be in English
