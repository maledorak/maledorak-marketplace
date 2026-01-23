# Backlog System

Future work tracking for the Six project.

## Purpose

The backlog holds **ideas and future work** that are not currently active. Same format as tasks - the `backlog/` directory indicates status.

## vs Active Tasks

| Backlog | Active Tasks |
|---------|--------------|
| Ideas, future work | Current work |
| No timeline | In progress |
| May never happen | Will be done |
| Rough scope | Detailed requirements |

## Format

Same as tasks: `NNNN_TYPE_slug.md`

- Shared ID sequence with tasks
- Use `status: backlog` in frontmatter
- Use main task template: `1-tasks/_template.md`

## Tag Conventions

Use tags for backlog-specific metadata:

| Category | Tags |
|----------|------|
| Priority | `priority-high`, `priority-medium`, `priority-low` |
| Phase | `phase-pro`, `phase-enterprise`, `phase-future` |
| Effort | `effort-small`, `effort-medium`, `effort-large` |

**Example:**
```yaml
tags: [access-control, manager, priority-high, phase-pro, effort-medium]
```

### Priority

| Tag | Meaning |
|-----|---------|
| `priority-high` | Important for next major release |
| `priority-medium` | Nice to have, do when capacity allows |
| `priority-low` | Far future, parking lot |

### Phase

| Tag | Meaning |
|-----|---------|
| `phase-pro` | Pro tier features ($20/user/mo) |
| `phase-enterprise` | Enterprise tier features ($30+/user/mo) |
| `phase-future` | No specific timeline |

### Effort

| Tag | Meaning |
|-----|---------|
| `effort-small` | Hours to a day |
| `effort-medium` | Days to a week |
| `effort-large` | Week or more |

## Workflow

### Adding to Backlog

1. Get next available ID (check both tasks and backlog)
2. Create `NNNN_TYPE_slug.md` in `backlog/`
3. Use main task template with `status: backlog`
4. Add priority/phase/effort tags
5. Document scope and context

### Promoting to Active

When ready to implement:

1. Move file: `git mv backlog/NNNN_*.md active/NNNN_*.md`
2. Update frontmatter: `status: backlog` → `status: active`
3. Add implementation plan and acceptance criteria
4. Add history entry documenting promotion

### Completing

When done, move to `archive/` like any other task.

## Connection to Research

Backlog items may be spawned from G- notes:

```yaml
# In G-six-memory/README.md
spawns:
  - ../../1-tasks/active/0008_FEATURE_postgresql-schema.md  # immediate
  - ../../1-tasks/backlog/0030_FEATURE_schema-evolution.md  # future
```
