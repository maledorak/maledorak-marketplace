# Sources Management

Handling external web content and references.

## Directory Structure

Sources live **inside task directories**, not in a shared location:

```
1-tasks/{status}/NNNN_TYPE_slug/
├── README.md           # Task main file
├── notes/              # Q/I/R/S/G research notes
└── sources/            # External web content
    ├── article-slug.md
    └── images/
        └── article-slug/
            ├── img_1.png
            └── img_2.png
```

**Why task-local sources?**
- Sources support specific research/tasks
- Easier to archive together
- Clear ownership and context
- No orphaned files

## Source Frontmatter

```yaml
---
url: "https://example.com/original-article"
title: "Article Title"
fetched_date: 2026-01-14
author: "Author Name"           # Optional
tags: [memory, ai, research]    # Optional
image_count: 2                  # If images saved
images:                         # If images saved
  - original_url: "https://example.com/image1.png"
    local_path: "images/article-slug/img_1.png"
  - original_url: "https://example.com/image2.png"
    local_path: "images/article-slug/img_2.png"
---

[Article content in markdown...]
```

## When to Save Sources

Save a source when:
- Content is central to research (might be cited)
- Page might change or disappear
- Contains diagrams/images you'll reference
- Need offline access

Don't save:
- Quick reference checks
- Stable documentation (link instead)
- Content you won't cite

## Naming Conventions

**Slug from title:**
```
"Writing a Good CLAUDE.md" → writing-a-good-claude-md.md
"The Generative Agents Paper" → generative-agents-paper.md
```

**Rules:**
- Lowercase
- Hyphens for spaces
- Remove articles (a, the) if needed for brevity
- Keep recognizable

## Image Handling

When saving images:

1. Create directory: `images/{article-slug}/`
2. Name sequentially: `img_1.png`, `img_2.png`
3. Record in frontmatter with original URLs
4. Update markdown to use local paths

**Before:**
```markdown
![Diagram](https://example.com/diagram.png)
```

**After:**
```markdown
![Diagram](images/article-slug/img_1.png)
```

## Referencing Sources

From notes in the same task:

```markdown
According to [Writing a Good CLAUDE.md](../sources/writing-a-good-claude-md.md),
the key principles are...
```

From task README:

```markdown
See [source: article-name](sources/article-name.md) for details.
```

## Using fetch-source Agent

The fetch-source agent automates source capture:

```
Invoke: Task tool with subagent_type=fetch-source
Prompt: "Fetch and save https://example.com/article to task 001 sources"
```

The agent will:
1. Fetch the URL
2. Convert to markdown
3. Save images locally
4. Create proper frontmatter
5. Place in task's `sources/` directory

## Source vs Research Note

| Aspect | Source | R- Research Note |
|--------|--------|------------------|
| Content | External, verbatim | Your analysis/synthesis |
| Authorship | Original author | You |
| Purpose | Preserve, reference | Understand, connect |
| Lineage | Standalone | Spawned from Q-, spawns S- |

**Typical flow:**
1. Working on a task, find relevant article
2. Save as source in task's `sources/` directory
3. Create R- note in `notes/` analyzing the source
4. R- note references `../sources/article.md`
5. R- note spawns S- synthesis
