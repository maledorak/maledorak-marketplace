# Tracks System Design Report

> Design discussion for parallel work streams in lore framework
> Date: 2026-01-21
> Status: **Draft / Exploration**

## Problem Statement

When multiple Claude instances work on a project simultaneously, they need a way to:
1. Work on independent streams without git conflicts
2. Run competing experimental approaches in parallel
3. Coordinate merging of completed work

The current lore system supports single-agent, sequential task execution. Tracks would enable multi-agent parallel development.

## Core Concept

**Tracks** are interconnected sequences of tasks (like commits on a branch). Multiple agents can work on different tracks in parallel with minimal git conflicts. Small tracks can feed into main tracks, similar to git branch hierarchies.

```
Main Track (like main branch)
├── Track A (Agent 1) ──► task1 → task2 → task3 ──┐
├── Track B (Agent 2) ──► task1 → task2 ──────────┼──► Merge Point
└── Track C (Agent 3) ──► task1 → task2 → task4 ──┘
```

## Design Options Explored

### Option 1: Frontmatter-Only (Lightweight)

Tracks exist only as metadata in task frontmatter:

```yaml
# 1-tasks/active/0010_FEATURE_auth-api.md
---
track: auth-backend
track_scope: ["src/auth/**"]
branch: claude/auth-backend-XXXXX
---
```

**Pros:** Minimal change, no new directories
**Cons:** No home for track-level metadata, definition duplicated across tasks

### Option 2: Separate Directory with Subdirs

```
4-tracks/
├── backlog/
├── active/
├── blocked/
├── cancelled/
└── archive/
```

**Pros:** Self-contained, track has own lifecycle
**Cons:** Duplicates task lifecycle structure, more complex

### Option 3: Flat with Prefixes

```
4-tracks/
├── 0001_ACTIVE_auth-backend.md
├── 0002_CANCELLED_embeddings-a.md
└── 0003_ARCHIVE_database-schema.md
```

**Pros:** All tracks visible in one listing
**Cons:** Status change requires file rename

### Option 4: Directory + Type Prefixes (Recommended Structure)

Combines directory-based lifecycle with task-style naming:

```
4-tracks/
├── backlog/
│   └── 0005_FEAT_analytics-pipeline.md
├── active/
│   ├── 0001_FEAT_auth-backend.md
│   ├── 0002_EXP_embeddings-approach-a.md
│   ├── 0003_EXP_embeddings-approach-b.md
│   └── 0004_EXP_embeddings-approach-c.md
├── blocked/
│   └── 0006_FEAT_frontend-ui.md
├── cancelled/
│   └── 0003_EXP_embeddings-approach-b.md
└── archive/
    └── 0007_FEAT_database-schema.md
```

**Track Types:**
- `FEAT` - standalone feature track
- `EXP` - experimental (competing with others)
- `FIX` - bugfix track
- `REFACTOR` - refactoring track

**Format:** `NNNN_TYPE_slug.md`

## Experimental Tracks

A key use case is running competing approaches in parallel:

```
Track A (EXP): research → implementation → tests → benchmarks
Track B (EXP): research → implementation → tests → benchmarks
Track C (EXP): research → implementation → tests → benchmarks
                    ↓
              Compare & Pick Winner
                    ↓
              Track B → archive (merged)
              Track A, C → cancelled (preserved)
```

Experiment grouping via frontmatter:

```yaml
# 4-tracks/active/0002_EXP_embeddings-approach-a.md
---
id: "0002"
type: EXP
experiment: embeddings-v2   # Links EXP tracks together
hypothesis: "Cosine similarity with chunking will be fastest"
branch: claude/embeddings-a-XXXXX
scope:
  - "src/embeddings/**"
tasks:
  - 0020_RESEARCH_embedding-chunking
  - 0021_FEATURE_chunked-embeddings
  - 0022_FEATURE_embedding-tests
  - 0023_RESEARCH_embedding-benchmarks
---
```

**Why preserve cancelled tracks?**
- Learning: "Approach A was 2x slower because..."
- Future reference: requirements might change
- ADR fodder: "We chose B over A because benchmarks showed..."

## Tooling Requirements

Would need MCP tools:
- `lore-create-track` - create new track
- `lore-set-track` - set current track (like `lore-set-task`)
- `lore-list-tracks` - show all tracks by status
- `lore-move-track` - change track status
- `lore-compare-experiments` - compare EXP tracks

Plus index generation showing track dependency graph.

## Complexity Concerns

**Is this over-engineered?**

Current lore is simple:
```
task → active → done
```

Tracks add a layer:
```
track → has tasks → tasks have lifecycle → track has lifecycle
```

### Simpler Alternative: Tracks as Labels

Instead of `4-tracks/` directory, tracks could be just a tag in task frontmatter:

```yaml
# 1-tasks/active/0001_FEATURE_auth-api.md
---
track: auth-backend      # Optional grouping label
branch: claude/auth-XXX  # Git branch for this work
---
```

No separate directory. Filter tasks by track label. Experiments = naming convention (`track: exp/embeddings-a`).

## Tasks Without Tracks

Key question: What happens to tasks not in any track?

| Mode | Tracks | Parallelism |
|------|--------|-------------|
| **Single agent** | Optional/none | One task at a time |
| **Multi agent** | Required | One track per agent |

Tasks without tracks = current behavior (single-agent, sequential work).

## Recommendation

**Start simple:**

1. **Phase 1:** Tracks as optional frontmatter label in tasks (no new directory)
   - Add `track` and `branch` fields to task frontmatter
   - Filter/group tasks by track label
   - Experiments via naming convention

2. **Phase 2:** If label approach proves insufficient, introduce `4-tracks/` structure
   - Track definitions with scope, dependencies, lifecycle
   - MCP tooling for track management
   - Experiment comparison tools

## Open Questions

1. Who defines track boundaries? Human architect? Lead agent? Emergent?
2. How to handle cross-track dependencies?
3. Merge strategy: sequential merges? Rebase? Conflict resolution agent?
4. When does a track "close"? Who decides merge readiness?
5. How granular should tracks be?

## Related Concepts

- Git branching model
- Task-gated development (existing lore concept)
- A/B testing for implementation approaches
- Architecture Decision Records (for documenting track winner selection)

---

*This document captures a design discussion and is not yet approved for implementation.*
