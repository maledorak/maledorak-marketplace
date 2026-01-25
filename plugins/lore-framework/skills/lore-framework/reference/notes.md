# Note Types

Notes are atomic units of knowledge, categorized by type via prefix.

## Prefix System

| Prefix | Type | Purpose | Example |
|--------|------|---------|---------|
| `Q-` | **Question** | What we're trying to answer | `Q-how-should-memory-consolidation-work.md` |
| `I-` | **Idea** | Original thoughts, hypotheses | `I-slack-coworker-bot.md` |
| `R-` | **Research** | External knowledge gathered | `R-memory-patterns/` |
| `S-` | **Synthesis** | Our conclusions, decisions | `S-memory-architecture-decision.md` |
| `G-` | **Generation** | Created artifacts | `G-api-design/` |

## When to Use Each Type

### Q- Question

Create when you have an explicit question driving research.

**Examples:**
- `Q-how-should-ai-memory-work.md`
- `Q-what-epistemic-model-captures-knowledge-states.md`
- `Q-how-to-handle-conflicting-memories.md`

**Content:** The question itself, context, what would answer it, current hypotheses.

### I- Idea

Create for original thoughts, hypotheses, potential directions. **Ideas are orthogonal to the main Q→R→S→G flow** - they can spawn from or lead to any other note type.

**Key distinction from Questions:**
- **Question:** "How should we handle X?" → drives investigation
- **Idea:** "What if we did Y?" → an insight, hypothesis, or creative thought

**Ideas can come from:**
- Spontaneous thought (no trigger needed)
- While working on a Question, Research, Synthesis, or Generation
- User feedback or conversation
- Reading code or documentation

**Ideas can lead to:**
- A Question (idea needs investigation)
- Research (idea needs validation)
- Synthesis (idea feeds into conclusion)
- Generation (idea is mature enough to build)

**Examples:**
- `I-slack-coworker-bot.md` - Product direction idea
- `I-synthetic-memory-testing.md` - Testing approach idea
- `I-use-neo4j-for-relationships.md` - Technical hypothesis
- `I-crm-derived-access.md` - Access control insight

**Content:** The idea, reasoning, potential implications, open questions, what it could lead to.

### R- Research

Create when gathering external knowledge (papers, docs, existing implementations).

**Examples:**
- `R-memory-patterns/` - Survey of memory architectures
- `R-mem0-analysis.md` - Analysis of specific framework
- `R-cognitive-memory-foundations.md` - Academic background

**Content:** Findings, citations, analysis, relevance to our questions.

### S- Synthesis

Create when drawing conclusions from research. This is the "so what?" note.

**Examples:**
- `S-memory-architecture-decision.md` - Why three-database approach
- `S-epistemic-model-choice.md` - Why this knowledge model
- `S-consolidation-strategy.md` - Chosen approach

**Content:** Conclusion, reasoning chain, alternatives considered, confidence level.

### G- Generation

Create for artifacts we produce (specs, schemas, designs).

**Examples:**
- `G-api-design/` - Complete system specification
- `G-postgres-schema.md` - Database schema
- `G-api-design.md` - API specification

**Content:** The artifact itself, structured and ready for implementation.

## File vs Directory

**Use file (note.md)** when:
- Content fits in one document (<500 lines)
- Single cohesive topic
- No sub-sections needed

**Use directory (note/)** when:
- Content requires multiple files
- Complex topic with sub-sections
- Need attachments or related files

**Directory structure:**
```
R-memory-patterns/
├── README.md           # Overview + links to parts
├── cognitive-foundations.md
├── ai-implementations.md
└── frameworks-comparison.md
```

## Status Lifecycle

All notes have a status in frontmatter:

```
seed → developing → mature → superseded
```

| Status | Meaning |
|--------|---------|
| `seed` | Initial thoughts, incomplete, may change significantly |
| `developing` | Being actively worked on, taking shape |
| `mature` | Stable, complete, can be relied upon for decisions |
| `superseded` | Replaced by newer version, kept for history |

**Guidelines:**
- Start new notes as `seed`
- Move to `developing` when actively working
- Move to `mature` when stable and complete
- Move to `superseded` when replaced (link to replacement)

## Naming Conventions

```
PREFIX-slug.md          # File
PREFIX-slug/            # Directory with README.md
```

**Slug rules:**
- Lowercase
- Hyphens for spaces
- Concise but descriptive
- No dates in filename (use frontmatter)

**Good:**
- `Q-how-should-memory-work.md`
- `R-memory-patterns/`
- `S-architecture-decision.md`

**Bad:**
- `Q-2026-01-14-memory-question.md` (date in name)
- `R_Memory_Patterns/` (wrong case, underscores)
- `idea.md` (missing prefix)
