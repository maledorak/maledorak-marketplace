---
name: inbox
description: Ask Claude in other projects to fix bugs, review code, or handle tasks. Also use when editing parent CLAUDE.md project registry.
user_invocable: true
license: MIT
metadata:
  author: Mariusz (Maledorak) Korzekwa
  updated: 2026-01-27
---

# Inbox

Cross-project messaging. Ask Claude in other projects to fix bugs, review code, or handle tasks for you.

## Concept

Instances communicate via `.claude/inbox/` directories. Messages are markdown files with YAML frontmatter.

```
~/Projects/           <- parent with global CLAUDE.md
├── project-a/        <- has .claude/inbox/
├── project-b/        <- has .claude/inbox/
└── project-c/        <- has .claude/inbox/
```

## Message Format

```markdown
---
from: source-project
to: target-project
created: 2026-01-27T14:30:00
type: note | request | alert
subject: Brief subject line
---

Message content here.
```

## Usage

- **Send**: "Send a message to project-b about the bug"
- **Read**: "Check my inbox" or read `.claude/inbox/` directly

## Message Types

| Type | Use |
|------|-----|
| `note` | Information |
| `request` | Action needed |
| `alert` | Urgent |

## Setup Help

When user asks to configure/setup inbox:

### 1. Check/create global CLAUDE.md

Look for `../CLAUDE.md` (parent directory).

**If missing:**

1. ASK user: "What 2-3 projects do you want to add to the registry? (e.g., project-a, project-b)"
2. For each project, ask for a brief purpose/description
3. Create CLAUDE.md with:

```markdown
# Global Context

## Projects
| Project | Purpose |
|---------|---------|
| {project-1} | {description-1} |
| {project-2} | {description-2} |

## Cross-Instance Messaging
Inbox location: `{project}/.claude/inbox/`
```

**Required columns:** `Project`, `Purpose`

**Optional columns:** User may have additional columns like `Client`, `Notes`, `Status`, etc. Preserve them when editing.

**If exists but missing our sections:**

1. ASK user: "Your parent CLAUDE.md exists but doesn't have project registry. Can I add a section for inbox messaging?"
2. If yes, analyze existing heading style (e.g., `#` vs `##` for top-level sections)
3. Add Projects table and Cross-Instance Messaging section matching that style
4. Place new sections logically (e.g., at the end, or grouped with similar content)

### 2. Show permissions to add

Tell user to add to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Edit(./.claude/inbox/**)",
      "Write(./.claude/inbox/**)"
    ]
  }
}
```

### 3. Setup project inbox

When setting up a project (current OR target when sending):

```bash
mkdir -p {project}/.claude/inbox
```

Add to `{project}/.gitignore`:
```
.claude/inbox/
```

**When sending a message:** If target project doesn't have `.claude/inbox/`, create it and add to gitignore before delivering.

### 4. Add project to registry

If project not in global CLAUDE.md Projects table, add it.

## Managing Project Registry

The parent `../CLAUDE.md` contains the project registry.

### Add project

Add row to Projects table:
```markdown
| new-project | Description of the project |
```

### Remove project

Remove row from Projects table. Optionally clean up:
```bash
rm -rf {project}/.claude/inbox/
```

### List projects

Read `../CLAUDE.md` and show Projects table.
