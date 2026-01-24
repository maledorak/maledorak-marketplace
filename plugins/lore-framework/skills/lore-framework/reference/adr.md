# Architecture Decision Records (ADRs)

Documenting significant architectural decisions for the Six project.

## Purpose

ADRs capture **why we chose X over Y** - the reasoning behind architectural decisions. They are written **post-factum** after a decision is made, not as proposals.

## When to Write an ADR

Write an ADR when:
- Making a significant technical choice (database, framework, pattern)
- The decision affects multiple components
- Future developers need to understand why
- Reversing the decision would be costly

Don't write an ADR for:
- Minor implementation details
- Obvious choices with no alternatives
- Temporary solutions (note in task instead)

## Naming Convention

```
NNNN_title-slug.md
```

**Examples:**
```
0001_event-sourcing-pattern.md
0002_multi-tenancy-database-architecture.md
0003_tenant-isolation-access-control.md
```

## Status Lifecycle

```
proposed → accepted → deprecated/superseded
```

| Status | Meaning |
|--------|---------|
| `proposed` | Under discussion (rare - most are written after decision) |
| `accepted` | Decision made and implemented |
| `deprecated` | No longer relevant (system changed) |
| `superseded` | Replaced by newer ADR |

## Frontmatter Schema

```yaml
---
id: "NNNN"
title: "Short Descriptive Title"
status: accepted           # proposed | accepted | deprecated | superseded
date: YYYY-MM-DD
deciders: [Team/Person]    # Who made the decision
supersedes: "0001"         # ADR ID this replaces (if any)
superseded_by: "0005"      # ADR ID that replaces this (if superseded)
related_tasks: ["0004"]     # Tasks implementing this decision
tags: [database, architecture]
---
```

## ADR Structure

```markdown
# ADR NNNN: [Title]

**Related:**
- [Task NNNN: Description](../1-tasks/NNNN_TYPE_slug.md)

---

## Context

What problem are we solving? What constraints exist?

---

## Decision

What technical approach did we choose? Be specific.

---

## Rationale

Why is this the best choice? What trade-offs are we accepting?

---

## Alternatives Considered

### Alternative 1: [Name]
**Description:** Brief explanation.
**Pros:** ...
**Cons:** ...
**Decision:** REJECTED - [reason]

---

## Consequences

### Positive
What becomes easier? New capabilities gained.

### Negative
What becomes harder? Technical debt accepted.

---

## References

External links, papers, documentation.
```

## Connection to Research

ADRs are often **informed by S- notes** (Synthesis):

```
S-memory-architecture-decision.md  →  informs  →  ADR 002
(captures reasoning in research)      (formalizes for project record)
```

**Key difference:**
- **S- note:** "Here's what we concluded from research" (knowledge context)
- **ADR:** "Here's the official project decision" (implementation context)

Both may exist for the same decision. S- note has more research context; ADR is the formal record.

## ADR Workflow

1. **Decision made** during task work or discussion
2. **ADR written** documenting the decision
3. **Related tasks** updated with ADR reference
4. **Implementation** proceeds based on decision

## Superseding an ADR

When a decision is replaced:

1. Create new ADR with the new decision
2. In old ADR:
   - Set `status: superseded`
   - Set `superseded_by: "NNNN"` (new ADR ID)
3. In new ADR:
   - Set `supersedes: "NNNN"` (old ADR ID)
   - Reference old ADR in Context

## Reading ADRs

To understand project state:
1. Read accepted ADRs (current decisions)
2. Skip superseded/deprecated (historical only)
3. Check related_tasks for implementation status

## Template

Use `2-adrs/_template.md` when creating new ADRs.
