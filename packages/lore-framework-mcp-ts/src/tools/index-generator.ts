/**
 * Index generation tool
 * - lore-generate-index: Regenerate lore/README.md and next-tasks.md
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import matter from 'gray-matter';
import { globSync } from 'glob';
import { logger } from '../utils/logger.js';
import { success, LoreError, wrapToolHandler } from '../utils/errors.js';

// ============================================================================
// Types
// ============================================================================

interface Task {
  id: string;
  title: string;
  type: string;
  status: string;
  path: string;
  blockedBy: string[];
  relatedTasks: string[];
  relatedAdr: string[];
  tags: string[];
}

interface Adr {
  id: string;
  title: string;
  status: string;
  path: string;
  relatedTasks: string[];
  tags: string[];
}

interface HistoryEntry {
  status?: string;
  by?: string | string[];
}

// ============================================================================
// Parsing Functions
// ============================================================================

function extractTitleFromContent(content: string): string {
  for (const line of content.split('\n')) {
    if (line.startsWith('# ')) return line.slice(2).trim();
  }
  return 'Untitled';
}

function extractBlockedByFromHistory(history: HistoryEntry[]): string[] {
  if (!history || !Array.isArray(history) || history.length === 0) return [];

  const latest = history[history.length - 1];
  if (latest.status === 'blocked') {
    const by = latest.by || [];
    return Array.isArray(by) ? by.map(String) : by ? [String(by)] : [];
  }
  return [];
}

function parseTasks(loreDir: string): Map<string, Task> {
  const tasks = new Map<string, Task>();
  const tasksBase = join(loreDir, '1-tasks');

  for (const subdir of ['active', 'blocked', 'archive', 'backlog']) {
    const subdirPath = join(tasksBase, subdir);
    if (!existsSync(subdirPath)) continue;

    const items = readdirSync(subdirPath);
    for (const item of items) {
      if (item.startsWith('_')) continue;

      const itemPath = join(subdirPath, item);
      let taskPath: string | null = null;

      const stat = statSync(itemPath);
      if (stat.isFile() && item.endsWith('.md')) {
        taskPath = itemPath;
      } else if (stat.isDirectory()) {
        const readme = join(itemPath, 'README.md');
        if (existsSync(readme)) taskPath = readme;
      }

      if (!taskPath) continue;

      let taskId: string;
      if (taskPath.endsWith('README.md')) {
        taskId = dirname(taskPath).split('/').pop()!.split('_')[0];
      } else {
        taskId = item.replace('.md', '').split('_')[0];
      }

      if (!/^\d+$/.test(taskId)) continue;

      try {
        const content = readFileSync(taskPath, 'utf8');
        const { data: meta, content: body } = matter(content);

        if (!meta || Object.keys(meta).length === 0) continue;

        let status = (meta.status as string) || 'active';
        if (subdir === 'archive') status = 'completed';
        else if (subdir === 'blocked') status = 'blocked';
        else if (subdir === 'backlog') status = 'backlog';

        tasks.set(String(meta.id || taskId), {
          id: String(meta.id || taskId),
          title: (meta.title as string) || extractTitleFromContent(body),
          type: (meta.type as string) || 'FEATURE',
          status,
          path: relative(dirname(loreDir), taskPath),
          blockedBy: extractBlockedByFromHistory((meta.history as HistoryEntry[]) || []),
          relatedTasks: (meta.related_tasks as string[]) || [],
          relatedAdr: (meta.related_adr as string[]) || [],
          tags: (meta.tags as string[]) || [],
        });
      } catch {
        /* skip invalid */
      }
    }
  }

  return tasks;
}

function parseAdrs(loreDir: string): Map<string, Adr> {
  const adrs = new Map<string, Adr>();
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
        title: (meta.title as string) || extractTitleFromContent(body),
        status: (meta.status as string) || 'proposed',
        path: relative(dirname(loreDir), adrPath),
        relatedTasks: (meta.related_tasks as string[]) || [],
        tags: (meta.tags as string[]) || [],
      });
    } catch {
      /* skip invalid */
    }
  }

  return adrs;
}

// ============================================================================
// Generation Functions
// ============================================================================

function computeBlocks(tasks: Map<string, Task>): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  for (const [tid] of tasks) blocks.set(tid, []);

  for (const [, task] of tasks) {
    for (const blockerId of task.blockedBy) {
      if (blocks.has(blockerId)) blocks.get(blockerId)!.push(task.id);
    }
  }

  return blocks;
}

function generateMermaid(tasks: Map<string, Task>, adrs: Map<string, Adr>): string {
  const lines = ['```mermaid', 'flowchart LR'];

  const completed = [...tasks.values()].filter((t) => t.status === 'completed');
  const active = [...tasks.values()].filter((t) => t.status === 'active');
  const blocked = [...tasks.values()].filter((t) => t.status === 'blocked');
  const backlog = [...tasks.values()].filter((t) => t.status === 'backlog');

  const addSubgraph = (name: string, items: Task[]) => {
    if (items.length === 0) return;
    lines.push(`    subgraph ${name}`);
    for (const t of items.sort((a, b) => a.id.localeCompare(b.id))) {
      const shortTitle = t.title.length > 25 ? t.title.slice(0, 25) + '...' : t.title;
      lines.push(`        T${t.id}["${t.id}: ${shortTitle}"]`);
    }
    lines.push('    end');
  };

  addSubgraph('Completed', completed);
  addSubgraph('Active', active);
  addSubgraph('Blocked', blocked);
  addSubgraph('Backlog', backlog);

  if (adrs.size > 0) {
    lines.push('    subgraph ADRs');
    for (const a of [...adrs.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      const shortTitle = a.title.length > 20 ? a.title.slice(0, 20) + '...' : a.title;
      lines.push(`        ADR${a.id}[/"ADR ${a.id}: ${shortTitle}"/]`);
    }
    lines.push('    end');
  }

  lines.push('');

  for (const [, task] of tasks) {
    for (const blockerId of task.blockedBy) {
      if (tasks.has(blockerId)) lines.push(`    T${blockerId} --> T${task.id}`);
    }
  }

  lines.push('');

  for (const [, task] of tasks) {
    for (const adrId of task.relatedAdr) {
      if (adrs.has(adrId)) lines.push(`    ADR${adrId} -.-> T${task.id}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

function generateStatusTable(tasks: Map<string, Task>, blocks: Map<string, string[]>): string {
  const lines = [
    '## Task Status',
    '',
    '| ID | Title | Type | Status | Blocked By | Blocks | ADRs |',
    '|:---|:------|:-----|:-------|:-----------|:-------|:-----|',
  ];

  const statusOrder: Record<string, number> = { active: 0, blocked: 1, backlog: 2, completed: 3 };
  const sortedTasks = [...tasks.values()].sort((a, b) => {
    const orderDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
    return orderDiff !== 0 ? orderDiff : a.id.localeCompare(b.id);
  });

  for (const task of sortedTasks) {
    const blockedBy = task.blockedBy.length > 0 ? task.blockedBy.join(', ') : '—';
    const taskBlocks = blocks.get(task.id)?.length ? blocks.get(task.id)!.sort().join(', ') : '—';
    const relatedAdr = task.relatedAdr.length > 0 ? task.relatedAdr.join(', ') : '—';
    const statusDisplay = task.status === 'active' ? `**${task.status}**` : task.status;
    const title = task.title.length > 35 ? task.title.slice(0, 35) + '...' : task.title;

    lines.push(
      `| ${task.id} | [${title}](${task.path}) | ${task.type} | ${statusDisplay} | ${blockedBy} | ${taskBlocks} | ${relatedAdr} |`
    );
  }

  return lines.join('\n');
}

function generateAdrTable(adrs: Map<string, Adr>): string {
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

function findReadyTasks(tasks: Map<string, Task>): Task[] {
  const ready: Task[] = [];
  const completedIds = new Set([...tasks.values()].filter((t) => t.status === 'completed').map((t) => t.id));

  for (const [, task] of tasks) {
    if (!['active', 'blocked'].includes(task.status)) continue;

    if (task.blockedBy.length === 0 || task.blockedBy.every((b) => completedIds.has(b))) {
      ready.push(task);
    }
  }

  return ready;
}

function findCriticalBlockers(tasks: Map<string, Task>, blocks: Map<string, string[]>): [string, number][] {
  const activeTasks = new Set(
    [...tasks.values()].filter((t) => ['active', 'blocked'].includes(t.status)).map((t) => t.id)
  );

  const blockers: [string, number][] = [];
  for (const [taskId, blockedTasks] of blocks) {
    const activeBlocked = blockedTasks.filter((t) => activeTasks.has(t));
    const task = tasks.get(taskId);
    if (activeBlocked.length > 0 && task && ['active', 'blocked'].includes(task.status)) {
      blockers.push([taskId, activeBlocked.length]);
    }
  }

  return blockers.sort((a, b) => b[1] - a[1]);
}

function generateNext(tasks: Map<string, Task>, blocks: Map<string, string[]>, ready: Task[]): string {
  const lines = [
    '# Next Tasks',
    '',
    '> Auto-generated. Use `lore-framework_generate-index` tool to regenerate.',
    '> Full index: [README.md](../README.md)',
    '',
  ];

  const activeCount = [...tasks.values()].filter((t) => t.status === 'active').length;
  const blockedCount = [...tasks.values()].filter((t) => t.status === 'blocked').length;
  const backlogCount = [...tasks.values()].filter((t) => t.status === 'backlog').length;
  const completedCount = [...tasks.values()].filter((t) => t.status === 'completed').length;

  lines.push(`**Active:** ${activeCount} | **Blocked:** ${blockedCount} | **Backlog:** ${backlogCount} | **Completed:** ${completedCount}`);
  lines.push('');

  if (ready.length > 0) {
    lines.push('## Ready to Start');
    lines.push('');

    const sortedReady = ready.sort((a, b) => (blocks.get(b.id)?.length || 0) - (blocks.get(a.id)?.length || 0));

    for (const task of sortedReady.slice(0, 10)) {
      const blockCount = blocks.get(task.id)?.length || 0;
      const priority = blockCount >= 3 ? ' [HIGH]' : '';
      const unblocks = blockCount > 0 ? `unblocks ${blockCount}` : 'no blockers';
      lines.push(`- **${task.id}** [${task.title}](${task.path}) — ${unblocks}${priority}`);
    }

    lines.push('');
  }

  const blockedTasks = [...tasks.values()].filter((t) => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    const blockedIds = blockedTasks.map((t) => t.id).sort().join(', ');
    lines.push(`## Blocked (${blockedTasks.length})`);
    lines.push('');
    lines.push(blockedIds);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('Set current task: use `lore-framework_set-task` tool with task ID');
  lines.push('');

  return lines.join('\n');
}

function generateIndex(
  loreDir: string
): { readme: string; next: string; stats: { activeCount: number; blockedCount: number; backlogCount: number; completedCount: number; adrCount: number } } {
  const tasks = parseTasks(loreDir);
  const adrs = parseAdrs(loreDir);
  const blocks = computeBlocks(tasks);

  const ready = findReadyTasks(tasks);
  const critical = findCriticalBlockers(tasks, blocks);

  const nextContent = generateNext(tasks, blocks, ready);

  const sections: string[] = [];

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  sections.push(`# Lore Index

> Auto-generated on ${dateStr}. Do not edit manually.
> Use \`lore-generate-index\` tool to regenerate.

Quick reference for task dependencies, status, and ADR relationships.`);

  const activeCount = [...tasks.values()].filter((t) => t.status === 'active').length;
  const blockedCount = [...tasks.values()].filter((t) => t.status === 'blocked').length;
  const backlogCount = [...tasks.values()].filter((t) => t.status === 'backlog').length;
  const completedCount = [...tasks.values()].filter((t) => t.status === 'completed').length;
  const adrCount = adrs.size;

  sections.push(`
## Quick Stats

| Active | Blocked | Backlog | Completed | ADRs |
|:------:|:-------:|:-------:|:---------:|:----:|
| ${activeCount} | ${blockedCount} | ${backlogCount} | ${completedCount} | ${adrCount} |`);

  if (ready.length > 0) {
    sections.push('\n## Ready to Start\n\nThese tasks have no blockers (or all blockers completed):\n');
    for (const task of ready.sort((a, b) => a.id.localeCompare(b.id))) {
      const blockCount = blocks.get(task.id)?.length || 0;
      const priority = blockCount >= 3 ? '**HIGH**' : blockCount >= 1 ? 'medium' : 'low';
      sections.push(`- **Task ${task.id}**: [${task.title}](${task.path}) — blocks ${blockCount} tasks (${priority})`);
    }
  }

  if (critical.length > 0) {
    sections.push('\n## Critical Blockers\n\nThese tasks block the most other work:\n');
    for (const [taskId, count] of critical.slice(0, 5)) {
      const task = tasks.get(taskId)!;
      sections.push(`- **Task ${taskId}**: [${task.title}](${task.path}) — blocks ${count} tasks`);
    }
  }

  sections.push('\n## Dependency Graph\n');
  sections.push(generateMermaid(tasks, adrs));
  sections.push('\n' + generateStatusTable(tasks, blocks));
  sections.push('\n' + generateAdrTable(adrs));

  sections.push(`
## Legend

**Task Status:**
- \`active\` — Work can proceed
- \`blocked\` — Waiting on dependencies
- \`backlog\` — Planned but not yet started
- \`completed\` — Done, in archive

**Graph Arrows:**
- \`A --> B\` — A blocks B (B depends on A)
- \`ADR -.-> Task\` — ADR informs Task
`);

  return {
    readme: sections.join('\n'),
    next: nextContent,
    stats: { activeCount, blockedCount, backlogCount, completedCount, adrCount },
  };
}

// ============================================================================
// Tool Registration
// ============================================================================

export function registerIndexTools(server: McpServer, getLoreDir: () => string): void {
  server.registerTool(
    'lore-framework_generate-index',
    {
      title: 'Generate Index',
      description: 'Regenerate lore/README.md and 0-session/next-tasks.md from task and ADR frontmatter',
      inputSchema: {},
    },
    wrapToolHandler(async () => {
      const loreDir = getLoreDir();

      if (!existsSync(loreDir)) {
        throw new LoreError(
          `lore/ directory not found at ${loreDir}`,
          'LORE_NOT_FOUND',
          'Initialize the lore directory structure first.'
        );
      }

      const { readme, next, stats } = generateIndex(loreDir);

      const indexPath = join(loreDir, 'README.md');
      writeFileSync(indexPath, readme);

      const nextPath = join(loreDir, '0-session', 'next-tasks.md');
      if (existsSync(dirname(nextPath))) {
        writeFileSync(nextPath, next);
      }

      logger.info('Index generated', stats);

      const lines = [
        'Generated:',
        `- ${indexPath}`,
        `- ${nextPath}`,
        '',
        `Stats: ${stats.activeCount} active, ${stats.blockedCount} blocked, ${stats.backlogCount} backlog, ${stats.completedCount} completed, ${stats.adrCount} ADRs`,
      ];

      return success(lines.join('\n'));
    })
  );
}
