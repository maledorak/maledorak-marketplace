# Worklog Format

Session logs documenting research progress.

## Purpose

Worklogs capture what happened during a research session:
- What was accomplished
- What was discovered
- What decisions were made
- What questions arose
- What to do next

They provide continuity across Claude sessions and create an audit trail.

## Location

Worklogs live inside task directories:

```
1-tasks/{status}/NNNN_TYPE_slug/worklog/YYYY-MM-DD_description.md
```

**Examples:**
- `2025-12-10_01-initial-requirements.md`
- `2025-12-10_02-database-architecture.md`
- `2026-01-14_memory-consolidation-research.md`

## Frontmatter

```yaml
---
date: 2026-01-14
session: 1                      # If multiple sessions per day
focus: "Memory consolidation research"
tags: [memory, research]
---
```

## Structure

```markdown
---
date: YYYY-MM-DD
focus: "Session focus"
---

# Session Title

## What Was Done

- Accomplished item 1
- Accomplished item 2
- Created notes: Q-new-question.md, R-research-topic.md

## Key Discoveries

- Important finding 1
- Important finding 2

## Decisions Made

- Decided X because Y
- Chose approach A over B because...

## Notes Created/Updated

- [Q-new-question](notes/Q-new-question.md) - seed
- [R-research-topic](notes/R-research-topic.md) - developing

## Questions Raised

- New question that emerged?
- Something to investigate?

## Next Steps

- [ ] First thing to do
- [ ] Second thing to do
- [ ] Research topic X
```

## When to Write

Write a worklog:
- At the end of a focused research session
- When switching context between sessions
- Before ending work for the day
- When significant discoveries are made

## Example

```markdown
---
date: 2025-12-10
session: 2
focus: "Database architecture design"
---

# Database Architecture Session

## What Was Done

- Analyzed PostgreSQL vs alternatives for event sourcing
- Designed bi-temporal model for memory storage
- Created initial schema draft

## Key Discoveries

- Event sourcing with bi-temporal gives full audit trail
- Row-Level Security (RLS) handles tenant isolation cleanly
- Need separate tables for events vs materialized state

## Decisions Made

- PostgreSQL as primary (mature, RLS support, JSONB)
- Event sourcing pattern (append-only, replay capability)
- Bi-temporal model (4 timestamps per record)

## Notes Created/Updated

- [G-six-memory/20_database_postgresql](notes/G-six-memory/20_database_postgresql.md) - developing
- [S-database-architecture-decision](notes/S-database-architecture-decision.md) - seed

## Questions Raised

- How to handle schema evolution for event payloads?
- What's the partitioning strategy for large tenants?

## Next Steps

- [ ] Design Neo4j graph layer
- [ ] Define entity relationship schema
- [ ] Research vector storage options
```

## Tips

1. **Be specific** - "Researched memory" vs "Analyzed Mem0 framework, found it lacks epistemic modeling"
2. **Link to notes** - Reference created/updated notes by path
3. **Capture uncertainty** - Questions raised are valuable
4. **Keep actionable** - Next steps should be concrete
5. **Don't over-document** - Key points, not every detail
