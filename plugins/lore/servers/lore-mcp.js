#!/usr/bin/env node
/**
 * MCP Server for Lore Framework
 *
 * Provides tools for managing lore/ directory:
 * - lore-set-user: Set current user from team.yaml
 * - lore-set-task: Set current task symlink
 * - lore-show-session: Show current session state
 * - lore-list-users: List available users from team.yaml
 * - lore-clear-task: Clear current task symlink
 * - lore-generate-index: Regenerate lore/README.md and next-tasks.md
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync, symlinkSync, readlinkSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import matter from 'gray-matter';
import { globSync } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get project directory from environment or use current working directory
function getProjectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function getLoreDir() {
  return join(getProjectDir(), 'lore');
}

function getSessionDir() {
  return join(getLoreDir(), '0-session');
}

// ============================================================================
// Session Management (from set-session.js)
// ============================================================================

function loadTeam(sessionDir) {
  const teamFile = join(sessionDir, 'team.yaml');
  if (!existsSync(teamFile)) {
    throw new Error(`team.yaml not found at ${teamFile}`);
  }
  const content = readFileSync(teamFile, 'utf8');
  return parseYaml(content);
}

function generateCurrentUserMd(userId, userData, team) {
  const lines = [];

  lines.push('---');
  lines.push(`name: ${userId}`);
  if (userData.github) lines.push(`github: ${userData.github}`);
  if (userData.role) lines.push(`role: ${userData.role}`);
  lines.push('---');
  lines.push('');

  const name = userData.name || userId;
  lines.push(`# Current User: ${name}`);
  lines.push('');

  if (userData.focus) {
    lines.push(`**Focus:** ${userData.focus.trim()}`);
    lines.push('');
  }

  if (userData.prompting) {
    lines.push('## Communication Preferences');
    lines.push('');
    lines.push(userData.prompting.trim());
    lines.push('');
  }

  if (userData.note) {
    lines.push(`> ${userData.note}`);
    lines.push('');
  }

  const otherMembers = Object.entries(team).filter(([k]) => k !== userId);
  if (otherMembers.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Rest of Team');
    lines.push('');
    lines.push('| Name | Role |');
    lines.push('|------|------|');
    for (const [memberId, memberData] of otherMembers) {
      const memberName = memberData.name || memberId;
      const role = memberData.role || '—';
      lines.push(`| ${memberName} | ${role} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function setUser(sessionDir, userId) {
  const team = loadTeam(sessionDir);

  if (!team[userId]) {
    const available = Object.keys(team).join(', ');
    throw new Error(`User '${userId}' not found. Available: ${available}`);
  }

  const userData = team[userId];
  const content = generateCurrentUserMd(userId, userData, team);
  const currentUserMd = join(sessionDir, 'current-user.md');
  writeFileSync(currentUserMd, content);

  return { userId, name: userData.name || userId };
}

function findTask(loreDir, taskId) {
  const tasksDir = join(loreDir, '1-tasks');
  const taskNum = taskId.replace(/^0+/, '') || '0';

  for (const statusDir of ['active', 'blocked', 'archive']) {
    const statusPath = join(tasksDir, statusDir);
    if (!existsSync(statusPath)) continue;

    const items = readdirSync(statusPath);
    for (const item of items) {
      if (item.startsWith('_')) continue;

      const itemPath = join(statusPath, item);
      const itemId = item.split('_')[0].replace(/^0+/, '') || '0';

      if (itemId === taskNum) {
        const stat = statSync(itemPath);
        if (stat.isDirectory()) {
          const readme = join(itemPath, 'README.md');
          if (existsSync(readme)) return readme;
        } else if (item.endsWith('.md')) {
          return itemPath;
        }
      }
    }
  }

  return null;
}

function setTask(loreDir, sessionDir, taskId) {
  const taskPath = findTask(loreDir, taskId);

  if (!taskPath) {
    throw new Error(`Task ${taskId} not found in 1-tasks/{active,blocked,archive}/`);
  }

  const currentTaskMd = join(sessionDir, 'current-task.md');
  const currentTaskJson = join(sessionDir, 'current-task.json');

  try {
    if (existsSync(currentTaskMd)) unlinkSync(currentTaskMd);
  } catch (e) { /* ignore */ }

  const relativePath = join('..', relative(loreDir, taskPath));
  symlinkSync(relativePath, currentTaskMd);

  // Get task directory (parent of the task file for directory-based tasks, or dirname for file-based)
  const taskDir = relative(loreDir, dirname(taskPath));

  // Write task metadata for easy access by agents/scripts
  const taskMeta = {
    id: taskId,
    path: taskDir
  };
  writeFileSync(currentTaskJson, JSON.stringify(taskMeta, null, 2));

  return { taskId, path: relativePath };
}

function clearTask(sessionDir) {
  const currentTaskMd = join(sessionDir, 'current-task.md');
  const currentTaskJson = join(sessionDir, 'current-task.json');

  try {
    let cleared = false;
    if (existsSync(currentTaskMd)) {
      unlinkSync(currentTaskMd);
      cleared = true;
    }
    if (existsSync(currentTaskJson)) {
      unlinkSync(currentTaskJson);
      cleared = true;
    }
    return cleared ? { cleared: true } : { cleared: false, message: 'No task was set' };
  } catch (e) {
    return { cleared: false, error: e.message };
  }
}

function showSession(sessionDir) {
  const result = { user: null, task: null };

  const currentUserMd = join(sessionDir, 'current-user.md');
  if (existsSync(currentUserMd)) {
    const content = readFileSync(currentUserMd, 'utf8');
    for (const line of content.split('\n')) {
      if (line.startsWith('name:')) {
        result.user = line.split(':')[1].trim();
        break;
      }
    }
  }

  const currentTaskMd = join(sessionDir, 'current-task.md');
  try {
    const target = readlinkSync(currentTaskMd);
    const parts = target.split('/');
    for (const part of parts) {
      if (part && /^\d/.test(part) && part.includes('_')) {
        result.task = { id: part.split('_')[0], path: target };
        break;
      }
    }
  } catch (e) {
    result.task = null;
  }

  return result;
}

function listUsers(sessionDir) {
  const team = loadTeam(sessionDir);
  const users = [];

  for (const [userId, userData] of Object.entries(team)) {
    users.push({
      id: userId,
      name: userData.name || userId,
      role: userData.role || null,
    });
  }

  return users;
}

// ============================================================================
// Index Generation (from lore-generate-index.js)
// ============================================================================

function extractTitleFromContent(content) {
  for (const line of content.split('\n')) {
    if (line.startsWith('# ')) return line.slice(2).trim();
  }
  return 'Untitled';
}

function extractBlockedByFromHistory(history) {
  if (!history || !Array.isArray(history) || history.length === 0) return [];

  const latest = history[history.length - 1];
  if (latest.status === 'blocked') {
    const by = latest.by || [];
    return Array.isArray(by) ? by.map(String) : by ? [String(by)] : [];
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
        if (existsSync(readme)) taskPath = readme;
      }

      if (!taskPath) continue;

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

        let status = meta.status || 'active';
        if (subdir === 'archive') status = 'completed';
        else if (subdir === 'blocked') status = 'blocked';

        tasks.set(String(meta.id || taskId), {
          id: String(meta.id || taskId),
          title: meta.title || extractTitleFromContent(body),
          type: meta.type || 'FEATURE',
          status,
          path: relative(dirname(loreDir), taskPath),
          blockedBy: extractBlockedByFromHistory(meta.history || []),
          relatedTasks: meta.related_tasks || [],
          relatedAdr: meta.related_adr || [],
          tags: meta.tags || [],
        });
      } catch (e) { /* skip invalid */ }
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
    } catch (e) { /* skip invalid */ }
  }

  return adrs;
}

function computeBlocks(tasks) {
  const blocks = new Map();
  for (const [tid] of tasks) blocks.set(tid, []);

  for (const [, task] of tasks) {
    for (const blockerId of task.blockedBy) {
      if (blocks.has(blockerId)) blocks.get(blockerId).push(task.id);
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

    if (task.blockedBy.length === 0 || task.blockedBy.every(b => completedIds.has(b))) {
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
    '> Auto-generated. Use `lore-generate-index` tool to regenerate.',
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
      const priority = blockCount >= 3 ? ' [HIGH]' : '';
      const unblocks = blockCount > 0 ? `unblocks ${blockCount}` : 'no blockers';
      lines.push(`- **${task.id}** [${task.title}](${task.path}) — ${unblocks}${priority}`);
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
  lines.push('Set current task: use `lore-set-task` tool with task ID');
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

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  sections.push(`# Lore Index

> Auto-generated on ${dateStr}. Do not edit manually.
> Use \`lore-generate-index\` tool to regenerate.

Quick reference for task dependencies, status, and ADR relationships.`);

  const activeCount = [...tasks.values()].filter(t => t.status === 'active').length;
  const blockedCount = [...tasks.values()].filter(t => t.status === 'blocked').length;
  const completedCount = [...tasks.values()].filter(t => t.status === 'completed').length;
  const adrCount = adrs.size;

  sections.push(`
## Quick Stats

| Active | Blocked | Completed | ADRs |
|:------:|:-------:|:---------:|:----:|
| ${activeCount} | ${blockedCount} | ${completedCount} | ${adrCount} |`);

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
      const task = tasks.get(taskId);
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
- \`completed\` — Done, in archive

**Graph Arrows:**
- \`A --> B\` — A blocks B (B depends on A)
- \`ADR -.-> Task\` — ADR informs Task
`);

  return { readme: sections.join('\n'), next: nextContent, stats: { activeCount, blockedCount, completedCount, adrCount } };
}

function runGenerateIndex(loreDir) {
  const { readme, next, stats } = generateIndex(loreDir);

  const indexPath = join(loreDir, 'README.md');
  writeFileSync(indexPath, readme);

  const nextPath = join(loreDir, '0-session', 'next-tasks.md');
  if (existsSync(dirname(nextPath))) {
    writeFileSync(nextPath, next);
  }

  return {
    generated: [indexPath, nextPath],
    stats,
  };
}

// ============================================================================
// MCP Server Setup
// ============================================================================

const server = new McpServer({
  name: 'lore',
  version: '1.0.0',
});

// Tool: lore-set-user
server.registerTool(
  'lore-set-user',
  {
    title: 'Set User',
    description: 'Set current user from team.yaml',
    inputSchema: { user_id: z.string().describe('User ID from team.yaml (e.g., "mariusz")') },
  },
  async ({ user_id }) => {
    try {
      const sessionDir = getSessionDir();
      if (!existsSync(sessionDir)) {
        return { content: [{ type: 'text', text: `Error: 0-session/ directory not found. Run lore framework bootstrap first.` }] };
      }

      const result = setUser(sessionDir, user_id);
      return { content: [{ type: 'text', text: `User set: ${result.userId} (${result.name})` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// Tool: lore-set-task
server.registerTool(
  'lore-set-task',
  {
    title: 'Set Task',
    description: 'Set current task by ID (creates symlink to task file)',
    inputSchema: { task_id: z.string().describe('Task ID (e.g., "0042" or "18")') },
  },
  async ({ task_id }) => {
    try {
      const loreDir = getLoreDir();
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        return { content: [{ type: 'text', text: `Error: 0-session/ directory not found. Run lore framework bootstrap first.` }] };
      }

      const result = setTask(loreDir, sessionDir, task_id);
      return { content: [{ type: 'text', text: `Task set: ${result.taskId} -> ${result.path}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// Tool: lore-show-session
server.registerTool(
  'lore-show-session',
  {
    title: 'Show Session',
    description: 'Show current session state (user and task)',
    inputSchema: {},
  },
  async () => {
    try {
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        return { content: [{ type: 'text', text: `Error: 0-session/ directory not found. Run lore framework bootstrap first.` }] };
      }

      const result = showSession(sessionDir);
      const lines = [];

      if (result.user) {
        lines.push(`User: ${result.user}`);
      } else {
        const envUser = process.env.LORE_SESSION_CURRENT_USER;
        lines.push(envUser ? `User: not set (LORE_SESSION_CURRENT_USER=${envUser} available)` : 'User: not set');
      }

      if (result.task) {
        lines.push(`Task: ${result.task.id} -> ${result.task.path}`);
      } else {
        lines.push('Task: not set');
      }

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// Tool: lore-list-users
server.registerTool(
  'lore-list-users',
  {
    title: 'List Users',
    description: 'List available users from team.yaml',
    inputSchema: {},
  },
  async () => {
    try {
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        return { content: [{ type: 'text', text: `Error: 0-session/ directory not found. Run lore framework bootstrap first.` }] };
      }

      const users = listUsers(sessionDir);
      const lines = ['Available users:', ''];
      for (const user of users) {
        const role = user.role ? ` (${user.role})` : '';
        lines.push(`- ${user.id}: ${user.name}${role}`);
      }

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// Tool: lore-clear-task
server.registerTool(
  'lore-clear-task',
  {
    title: 'Clear Task',
    description: 'Clear current task symlink',
    inputSchema: {},
  },
  async () => {
    try {
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        return { content: [{ type: 'text', text: `Error: 0-session/ directory not found. Run lore framework bootstrap first.` }] };
      }

      const result = clearTask(sessionDir);
      if (result.cleared) {
        return { content: [{ type: 'text', text: 'Task cleared' }] };
      } else {
        return { content: [{ type: 'text', text: result.message || result.error || 'No task was set' }] };
      }
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// Tool: lore-generate-index
server.registerTool(
  'lore-generate-index',
  {
    title: 'Generate Index',
    description: 'Regenerate lore/README.md and 0-session/next-tasks.md from task and ADR frontmatter',
    inputSchema: {},
  },
  async () => {
    try {
      const loreDir = getLoreDir();

      if (!existsSync(loreDir)) {
        return { content: [{ type: 'text', text: `Error: lore/ directory not found at ${loreDir}` }] };
      }

      const result = runGenerateIndex(loreDir);
      const lines = [
        'Generated:',
        ...result.generated.map(p => `- ${p}`),
        '',
        `Stats: ${result.stats.activeCount} active, ${result.stats.blockedCount} blocked, ${result.stats.completedCount} completed, ${result.stats.adrCount} ADRs`,
      ];

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
