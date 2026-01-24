# Knowledge Workflow

How knowledge flows through the framework, from questions to implementation.

## Source of Truth Hierarchy

```
1. Wiki (3-wiki/)     = Current state (regularly updated)
2. Tasks + ADRs       = History, decisions, context
3. Code               = Implementation (may contain hacks, temporary solutions)
```

**Wiki sits "on top" of history.** Code is not authoritative without task context.

## Task-Gated Development

**All code changes require an active task.**

Before writing/modifying code:
1. Check `lore/0-session/current-user.md` exists (identifies who is working)
2. Check `lore/0-session/current-task.md` exists (symlink to active task)
3. If user missing: use `lore-framework_set-user` MCP tool
4. If task missing: use `lore-framework_set-task` MCP tool
5. If no task exists for this work, create one first
6. Document decisions in task worklog

**Why:** Code is ephemeral; tasks provide AI-readable history. Future Claude sessions can:
- Understand why code exists
- Know if something is a hack/temporary solution
- See what decisions led to current implementation
- Know what will change in the future

**Forbidden:**
- Writing code without an active task
- Making "quick fixes" without task context
- Treating code patterns as authoritative without checking task history

**When you see suspicious code:** Check the task that created it. The worklog may say "this is temporary until X" or "hack because Y".

## Knowledge Flow

### Main Flow (Investigation-driven)

```
Q (Question) → R (Research) → S (Synthesis) → G (Generation) → Tasks/Backlog
                                    │
                                    ▼
                                   ADR
```

This is the typical path when **investigating a problem:**
1. Form a question
2. Research to answer it
3. Synthesize conclusions
4. Generate artifacts (specs, schemas)
5. Create tasks to implement

### Ideas: The Orthogonal Path

**Ideas (I-) are different.** They're not part of the linear flow - they can connect to any stage.

```
                              ┌─────────┐
                              │  Idea   │
                              │  (I-)   │
                              └────┬────┘
                                   │
         can spawn from OR lead to any stage
                                   │
    ┌──────────────────────────────┼──────────────────────────────┐
    ▼                              ▼                              ▼
   Q- ─────────────────► R- ─────────────────► S- ─────────────► G-
```

**Ideas can come from:**
- Spontaneous thought (no trigger)
- While working on Q, R, S, or G
- User input or conversation
- Reading existing code/docs

**Ideas can lead to:**
- A Question (needs investigation)
- Research (needs validation)
- Synthesis (feeds conclusion)
- Generation (mature enough to build)

### When to Use Which

| Situation | Start With |
|-----------|------------|
| "How should we handle X?" | Q- (Question) |
| "What if we did Y?" | I- (Idea) |
| "I read that Z works well" | R- (Research) |
| "Based on research, we should..." | S- (Synthesis) |
| "Here's the spec for..." | G- (Generation) |

## Lineage Tracking

Every note tracks its lineage through frontmatter:

```yaml
spawned_from: notes/Q-parent.md    # What led to this note
spawns:                             # What this note led to
  - notes/R-child.md
  - notes/S-conclusion.md
```

### Why Track Lineage?

1. **Understand decisions** - Trace back from G-six-memory to the questions that drove it
2. **Impact analysis** - If a question changes, see what's affected
3. **Knowledge gaps** - Spot questions without research or synthesis
4. **Context recovery** - Claude can follow the chain to understand why

### Lineage Rules

1. **Always link backward** - New notes should have spawned_from (except root notes)
2. **Update forward links** - When creating child, add to parent's spawns list
3. **Cross boundaries** - G- notes can spawn tasks (use relative paths)
4. **Keep paths relative** - Enables moving directories without breaking links
5. **Ideas can be roots** - An I- note without spawned_from is valid (spontaneous insight)

## Creating Notes

### Starting a Question

When you have something to investigate:

1. Create `Q-slug.md` in `notes/`
2. Set status: seed
3. Document the question, context, and what would answer it
4. As you spawn research/ideas, add to spawns list

### Doing Research

When gathering external knowledge:

1. Create `R-slug.md` or `R-slug/` in `notes/`
2. Link spawned_from to the driving question
3. Update the question's spawns list
4. Document findings, citations, analysis

### Capturing Ideas

When you have an original thought or insight:

1. Create `I-slug.md` in `notes/`
2. **spawned_from is optional** - Ideas can be spontaneous (no parent)
3. If triggered by another note, link spawned_from
4. Document the idea, reasoning, implications
5. Consider what this idea might lead to (Q?, R?, S?, G?)

### Writing Synthesis

When drawing conclusions from research:

1. Create `S-slug.md` in `notes/`
2. Link spawned_from to research/ideas that informed it
3. Document conclusion, reasoning chain, alternatives considered
4. This often becomes input for ADRs

### Creating Artifacts

When producing deliverables:

1. Create `G-slug.md` or `G-slug/` in `notes/`
2. Link spawned_from to synthesis that led to it
3. The artifact content goes here
4. Spawns tasks for implementation

## Status Transitions

```
seed → developing → mature → superseded
```

### When to Transition

**seed → developing:**
- Initial capture complete
- Actively working on content
- Taking shape but not stable

**developing → mature:**
- Content is complete
- Has been reviewed/validated
- Can be relied upon for decisions
- Ready to spawn children

**mature → superseded:**
- Replaced by newer version
- Add superseded_by link
- Keep for historical context
- Don't delete (breaks lineage)

## Connecting to Tasks

When G- notes are ready for implementation:

1. Create task in `tasks/`
2. Add task to G- note's spawns list
3. Reference G- note in task's Context section

**Example lineage:**
```
G-six-memory/README.md
└── spawns:
    - ../../1-tasks/0003_FEATURE_domain-models.md
    - ../../1-tasks/0004_FEATURE_postgresql-schema.md
    - ../../1-tasks/0005_FEATURE_neo4j-layer.md
```

## Connecting to ADRs

S- notes often inform ADRs:

1. S- note captures the reasoning (in research context)
2. ADR formalizes the decision (in project context)
3. Link them via related_tasks in ADR frontmatter

**Key difference:**
- S- note: "Here's what we concluded from research"
- ADR: "Here's the official decision and its consequences"

## Example: Memory Architecture

Real lineage from Six project:

```
Q-how-should-ai-memory-work.md
├── spawned: R-memory-patterns/
│   ├── cognitive-foundations.md
│   ├── ai-implementations.md
│   └── frameworks-comparison.md
├── spawned: I-slack-coworker-bot.md
└── spawned: I-synthetic-memory-testing.md

R-memory-patterns/
└── spawned: S-memory-architecture-decision.md
    └── spawned: G-six-memory/
        ├── spawned: Task 0003 (domain models)
        ├── spawned: Task 0004 (postgresql)
        ├── spawned: Task 0005 (neo4j)
        └── spawned: Task 0006 (qdrant)
```

## Best Practices

1. **Start with questions** - Don't research without knowing what you're answering
2. **Synthesize before generating** - Don't jump from research to artifact
3. **Keep lineage current** - Update links as you create notes
4. **Use status honestly** - Don't mark mature if still changing
5. **One concept per note** - Split complex topics into multiple notes
