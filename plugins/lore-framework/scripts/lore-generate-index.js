#!/usr/bin/env node
/**
 * Generate lore/README.md from task and ADR frontmatter.
 *
 * This script parses all task and ADR files, extracts their YAML frontmatter,
 * and generates a comprehensive index with:
 * - Mermaid dependency graph
 * - Status tables
 * - Critical path analysis
 * - Ready-to-start recommendations
 *
 * Usage:
 *   node lore-generate-index.js [projectDir]
 *   node lore-generate-index.js --next-only
 *   node lore-generate-index.js --quiet
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { globSync } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(args) {
  const result = {
    nextOnly: false,
    quiet: false,
    projectDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--next-only') {
      result.nextOnly = true;
    } else if (arg === '--quiet' || arg === '-q') {
      result.quiet = true;
    } else if (!arg.startsWith('-')) {
      result.projectDir = arg;
    }
  }

  return result;
}

function extractTitleFromContent(content) {
  for (const line of content.split('\n')) {
    if (line.startsWith('# ')) {
      return line.slice(2).trim();
    }
  }
  return 'Untitled';
}

function extractBlockedByFromHistory(history) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return [];
  }

  const latest = history[history.length - 1];
  if (latest.status === 'blocked') {
    const by = latest.by || [];
    if (Array.isArray(by)) {
      return by.map(String);
    } else if (by) {
      return [String(by)];
    }
  }

  return [];
}

function parseTasks(loreDir) {
  const tasks = new Map();
  const tasksBase = join(loreDir, '1-tasks');

  for (const subdir of ['active', 'blocked', 'archive']) {
    const subdirPath = join(tasksBase, subdir);
    if (!existsSync(subdirPath)) continue;

    const items = readdirSync(subdirPath);
    for (const item of items) {
      if (item.startsWith('_')) continue;

      const itemPath = join(subdirPath, item);
      let taskPath = null;

      const stat = statSync(itemPath);
      if (stat.isFile() && item.endsWith('.md')) {
        taskPath = itemPath;
      } else if (stat.isDirectory()) {
        const readme = join(itemPath, 'README.md');
        if (existsSync(readme)) {
          taskPath = readme;
        }
      }

      if (!taskPath) continue;

      // Extract task ID
      let taskId;
      if (taskPath.endsWith('README.md')) {
        taskId = dirname(taskPath).split('/').pop().split('_')[0];
      } else {
        taskId = item.replace('.md', '').split('_')[0];
      }

      if (!/^\d+$/.test(taskId)) continue;

      try {
        const content = readFileSync(taskPath, 'utf8');
        const { data: meta, content: body } = matter(content);

        if (!meta || Object.keys(meta).length === 0) continue;

        // Determine status
        let status = meta.status || 'active';
        if (subdir === 'archive') {
          status = 'completed';
        } else if (subdir === 'blocked') {
          status = 'blocked';
        }

        const history = meta.history || [];
        const blockedBy = extractBlockedByFromHistory(history);

        tasks.set(String(meta.id || taskId), {
          id: String(meta.id || taskId),
          title: meta.title || extractTitleFromContent(body),
          type: meta.type || 'FEATURE',
          status,
          path: relative(dirname(loreDir), taskPath),
          blockedBy,
          relatedTasks: meta.related_tasks || [],
          relatedAdr: meta.related_adr || [],
          tags: meta.tags || [],
        });
      } catch (e) {
        // Skip invalid files
      }
    }
  }

  return tasks;
}

function parseAdrs(loreDir) {
  const adrs = new Map();
  const adrDir = join(loreDir, '2-adrs');

  if (!existsSync(adrDir)) return adrs;

  const files = globSync('*.md', { cwd: adrDir });
  for (const file of files) {
    if (file.startsWith('_')) continue;

    const adrPath = join(adrDir, file);
    const adrId = file.replace('.md', '').split('_')[0];

    try {
      const content = readFileSync(adrPath, 'utf8');
      const { data: meta, content: body } = matter(content);

      if (!meta || Object.keys(meta).length === 0) continue;

      adrs.set(String(meta.id || adrId), {
        id: String(meta.id || adrId),
        title: meta.title || extractTitleFromContent(body),
        status: meta.status || 'proposed',
        path: relative(dirname(loreDir), adrPath),
        relatedTasks: meta.related_tasks || [],
        tags: meta.tags || [],
      });
    } catch (e) {
      // Skip invalid files
    }
  }

  return adrs;
}

function computeBlocks(tasks) {
  const blocks = new Map();
  for (const [tid] of tasks) {
    blocks.set(tid, []);
  }

  for (const [, task] of tasks) {
    for (const blockerId of task.blockedBy) {
      if (blocks.has(blockerId)) {
        blocks.get(blockerId).push(task.id);
      }
    }
  }

  return blocks;
}

function generateMermaid(tasks, adrs) {
  const lines = ['```mermaid', 'flowchart LR'];

  const completed = [...tasks.values()].filter(t => t.status === 'completed');
  const active = [...tasks.values()].filter(t => t.status === 'active');
  const blocked = [...tasks.values()].filter(t => t.status === 'blocked');

  if (completed.length > 0) {
    lines.push('    subgraph Completed');
    for (const t of completed.sort((a, b) => a.id.localeCompare(b.id))) {
      const shortTitle = t.title.length > 25 ? t.title.slice(0, 25) + '...' : t.title;
      lines.push(`        T${t.id}["${t.id}: ${shortTitle}"]`);
    }
    lines.push('    end');
  }

  if (active.length > 0) {
    lines.push('    subgraph Active');
    for (const t of active.sort((a, b) => a.id.localeCompare(b.id))) {
      const shortTitle = t.title.length > 25 ? t.title.slice(0, 25) + '...' : t.title;
      lines.push(`        T${t.id}["${t.id}: ${shortTitle}"]`);
    }
    lines.push('    end');
  }

  if (blocked.length > 0) {
    lines.push('    subgraph Blocked');
    for (const t of blocked.sort((a, b) => a.id.localeCompare(b.id))) {
      const shortTitle = t.title.length > 25 ? t.title.slice(0, 25) + '...' : t.title;
      lines.push(`        T${t.id}["${t.id}: ${shortTitle}"]`);
    }
    lines.push('    end');
  }

  if (adrs.size > 0) {
    lines.push('    subgraph ADRs');
    for (const a of [...adrs.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      const shortTitle = a.title.length > 20 ? a.title.slice(0, 20) + '...' : a.title;
      lines.push(`        ADR${a.id}[/"ADR ${a.id}: ${shortTitle}"/]`);
    }
    lines.push('    end');
  }

  lines.push('');

  // Dependencies
  for (const [, task] of tasks) {
    for (const blockerId of task.blockedBy) {
      if (tasks.has(blockerId)) {
        lines.push(`    T${blockerId} --> T${task.id}`);
      }
    }
  }

  lines.push('');

  // ADR relationships
  for (const [, task] of tasks) {
    for (const adrId of task.relatedAdr) {
      if (adrs.has(adrId)) {
        lines.push(`    ADR${adrId} -.-> T${task.id}`);
      }
    }
  }

  lines.push('```');
  return lines.join('\n');
}

function generateStatusTable(tasks, blocks) {
  const lines = [
    '## Task Status',
    '',
    '| ID | Title | Type | Status | Blocked By | Blocks | ADRs |',
    '|:---|:------|:-----|:-------|:-----------|:-------|:-----|',
  ];

  const statusOrder = { active: 0, blocked: 1, completed: 2 };
  const sortedTasks = [...tasks.values()].sort((a, b) => {
    const orderDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
    return orderDiff !== 0 ? orderDiff : a.id.localeCompare(b.id);
  });

  for (const task of sortedTasks) {
    const blockedBy = task.blockedBy.length > 0 ? task.blockedBy.join(', ') : '—';
    const taskBlocks = blocks.get(task.id)?.length > 0 ? blocks.get(task.id).sort().join(', ') : '—';
    const relatedAdr = task.relatedAdr.length > 0 ? task.relatedAdr.join(', ') : '—';
    const statusDisplay = task.status === 'active' ? `**${task.status}**` : task.status;
    const title = task.title.length > 35 ? task.title.slice(0, 35) + '...' : task.title;

    lines.push(`| ${task.id} | [${title}](${task.path}) | ${task.type} | ${statusDisplay} | ${blockedBy} | ${taskBlocks} | ${relatedAdr} |`);
  }

  return lines.join('\n');
}

function generateAdrTable(adrs) {
  const lines = [
    '## Architecture Decision Records',
    '',
    '| ID | Title | Status | Related Tasks |',
    '|:---|:------|:-------|:--------------|',
  ];

  for (const adr of [...adrs.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    const related = adr.relatedTasks.length > 0 ? adr.relatedTasks.join(', ') : '—';
    lines.push(`| ${adr.id} | [${adr.title}](${adr.path}) | ${adr.status} | ${related} |`);
  }

  return lines.join('\n');
}

function findReadyTasks(tasks) {
  const ready = [];
  const completedIds = new Set([...tasks.values()].filter(t => t.status === 'completed').map(t => t.id));

  for (const [, task] of tasks) {
    if (!['active', 'blocked'].includes(task.status)) continue;

    if (task.blockedBy.length === 0) {
      ready.push(task);
    } else if (task.blockedBy.every(b => completedIds.has(b))) {
      ready.push(task);
    }
  }

  return ready;
}

function findCriticalBlockers(tasks, blocks) {
  const activeTasks = new Set([...tasks.values()].filter(t => ['active', 'blocked'].includes(t.status)).map(t => t.id));

  const blockers = [];
  for (const [taskId, blockedTasks] of blocks) {
    const activeBlocked = blockedTasks.filter(t => activeTasks.has(t));
    const task = tasks.get(taskId);
    if (activeBlocked.length > 0 && task && ['active', 'blocked'].includes(task.status)) {
      blockers.push([taskId, activeBlocked.length]);
    }
  }

  return blockers.sort((a, b) => b[1] - a[1]);
}

function generateNext(tasks, blocks, ready) {
  const lines = [
    '# Next Tasks',
    '',
    '> Auto-generated. Use `lore-framework_generate-index` MCP tool to regenerate.',
    '> Full index: [README.md](../README.md)',
    '',
  ];

  const activeCount = [...tasks.values()].filter(t => t.status === 'active').length;
  const blockedCount = [...tasks.values()].filter(t => t.status === 'blocked').length;
  const completedCount = [...tasks.values()].filter(t => t.status === 'completed').length;

  lines.push(`**Active:** ${activeCount} | **Blocked:** ${blockedCount} | **Completed:** ${completedCount}`);
  lines.push('');

  if (ready.length > 0) {
    lines.push('## Ready to Start');
    lines.push('');

    const sortedReady = ready.sort((a, b) => (blocks.get(b.id)?.length || 0) - (blocks.get(a.id)?.length || 0));

    for (const task of sortedReady.slice(0, 10)) {
      const blockCount = blocks.get(task.id)?.length || 0;
      const priority = blockCount >= 3 ? '⚡' : '';
      const unblocks = blockCount > 0 ? `unblocks ${blockCount}` : 'no blockers';
      lines.push(`- **${task.id}** [${task.title}](${task.path}) — ${unblocks} ${priority}`);
    }

    lines.push('');
  }

  const blockedTasks = [...tasks.values()].filter(t => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    const blockedIds = blockedTasks.map(t => t.id).sort().join(', ');
    lines.push(`## Blocked (${blockedTasks.length})`);
    lines.push('');
    lines.push(blockedIds);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('Set current task: use `lore-framework_set-task` MCP tool with task ID');
  lines.push('');

  return lines.join('\n');
}

function generateIndex(loreDir) {
  const tasks = parseTasks(loreDir);
  const adrs = parseAdrs(loreDir);
  const blocks = computeBlocks(tasks);

  const ready = findReadyTasks(tasks);
  const critical = findCriticalBlockers(tasks, blocks);

  const nextContent = generateNext(tasks, blocks, ready);

  const sections = [];

  // Header
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  sections.push(`# Lore Index

> Auto-generated on ${dateStr}. Do not edit manually.
> Use \`lore-framework_generate-index\` MCP tool to regenerate.

Quick reference for task dependencies, status, and ADR relationships.`);

  // Quick Stats
  const activeCount = [...tasks.values()].filter(t => t.status === 'active').length;
  const blockedCount = [...tasks.values()].filter(t => t.status === 'blocked').length;
  const completedCount = [...tasks.values()].filter(t => t.status === 'completed').length;
  const adrCount = adrs.size;

  sections.push(`
## Quick Stats

| Active | Blocked | Completed | ADRs |
|:------:|:-------:|:---------:|:----:|
| ${activeCount} | ${blockedCount} | ${completedCount} | ${adrCount} |`);

  // Ready to Start
  if (ready.length > 0) {
    sections.push('\n## Ready to Start\n\nThese tasks have no blockers (or all blockers completed):\n');
    for (const task of ready.sort((a, b) => a.id.localeCompare(b.id))) {
      const blockCount = blocks.get(task.id)?.length || 0;
      const priority = blockCount >= 3 ? '**HIGH**' : blockCount >= 1 ? 'medium' : 'low';
      sections.push(`- **Task ${task.id}**: [${task.title}](${task.path}) — blocks ${blockCount} tasks (${priority})`);
    }
  }

  // Critical Blockers
  if (critical.length > 0) {
    sections.push('\n## Critical Blockers\n\nThese tasks block the most other work:\n');
    for (const [taskId, count] of critical.slice(0, 5)) {
      const task = tasks.get(taskId);
      sections.push(`- **Task ${taskId}**: [${task.title}](${task.path}) — blocks ${count} tasks`);
    }
  }

  // Dependency Graph
  sections.push('\n## Dependency Graph\n');
  sections.push(generateMermaid(tasks, adrs));

  // Status Table
  sections.push('\n' + generateStatusTable(tasks, blocks));

  // ADR Table
  sections.push('\n' + generateAdrTable(adrs));

  // Legend
  sections.push(`
## Legend

**Task Status:**
- \`active\` — Work can proceed
- \`blocked\` — Waiting on dependencies
- \`completed\` — Done, in archive

**Graph Arrows:**
- \`A --> B\` — A blocks B (B depends on A)
- \`ADR -.-> Task\` — ADR informs Task

## Regeneration

Use \`lore-framework_generate-index\` MCP tool to regenerate this index.
`);

  return [sections.join('\n'), nextContent];
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const projectDir = args.projectDir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const loreDir = join(projectDir, 'lore');

  if (!existsSync(loreDir)) {
    if (!args.quiet) {
      console.error(`Error: lore/ directory not found at ${loreDir}`);
    }
    process.exit(1);
  }

  const [readmeContent, nextContent] = generateIndex(loreDir);

  // Write README.md
  if (!args.nextOnly) {
    const indexPath = join(loreDir, 'README.md');
    writeFileSync(indexPath, readmeContent);
    if (!args.quiet) {
      console.log(`✅ Generated ${indexPath}`);
    }
  }

  // Write next-tasks.md
  const nextPath = join(loreDir, '0-session', 'next-tasks.md');
  if (existsSync(dirname(nextPath))) {
    writeFileSync(nextPath, nextContent);
    if (!args.quiet) {
      console.log(`✅ Generated ${nextPath}`);
    }
  }
}

main();
