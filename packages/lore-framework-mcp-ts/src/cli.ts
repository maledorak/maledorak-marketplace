#!/usr/bin/env node
/**
 * CLI interface for lore-framework-mcp
 *
 * Usage:
 *   npx lore-framework-mcp set-user <user_id>
 *   npx lore-framework-mcp set-user --env
 *   npx lore-framework-mcp set-task <task_id>
 *   npx lore-framework-mcp show-session
 *   npx lore-framework-mcp list-users
 *   npx lore-framework-mcp clear-task
 *   npx lore-framework-mcp generate-index [--next-only] [--quiet]
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
  symlinkSync,
  readlinkSync,
} from 'fs';
import { join, dirname, relative } from 'path';
import { parse as parseYaml } from 'yaml';
import matter from 'gray-matter';
import { globSync } from 'glob';

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  name?: string;
  github?: string;
  role?: string;
  focus?: string;
  prompting?: string;
  note?: string;
}

type Team = Record<string, TeamMember>;

interface CliArgs {
  command: string;
  args: string[];
  flags: {
    env: boolean;
    nextOnly: boolean;
    quiet: boolean;
  };
}

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2); // Remove node and script path
  const command = args[0] || 'help';
  const positional: string[] = [];
  const flags = { env: false, nextOnly: false, quiet: false };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--env') {
      flags.env = true;
    } else if (arg === '--next-only') {
      flags.nextOnly = true;
    } else if (arg === '--quiet' || arg === '-q') {
      flags.quiet = true;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  return { command, args: positional, flags };
}

// ============================================================================
// Directory Helpers
// ============================================================================

function getProjectDir(): string {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function getLoreDir(): string {
  return join(getProjectDir(), 'lore');
}

function getSessionDir(): string {
  return join(getLoreDir(), '0-session');
}

// ============================================================================
// Session Functions
// ============================================================================

function loadTeam(sessionDir: string): Team {
  const teamFile = join(sessionDir, 'team.yaml');
  if (!existsSync(teamFile)) {
    throw new Error(`team.yaml not found at ${teamFile}`);
  }
  const content = readFileSync(teamFile, 'utf8');
  return parseYaml(content) as Team;
}

function generateCurrentUserMd(userId: string, userData: TeamMember, team: Team): string {
  const lines: string[] = [];

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

function findTask(loreDir: string, taskId: string): string | null {
  const tasksDir = join(loreDir, '1-tasks');
  const taskNum = taskId.replace(/^0+/, '') || '0';

  for (const statusDir of ['active', 'blocked', 'archive', 'backlog']) {
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

// ============================================================================
// Index Generation (simplified for CLI)
// ============================================================================

interface Task {
  id: string;
  title: string;
  type: string;
  status: string;
  path: string;
  blockedBy: string[];
  relatedAdr: string[];
}

interface Adr {
  id: string;
  title: string;
  status: string;
  path: string;
  relatedTasks: string[];
}

function extractTitleFromContent(content: string): string {
  for (const line of content.split('\n')) {
    if (line.startsWith('# ')) return line.slice(2).trim();
  }
  return 'Untitled';
}

function extractBlockedByFromHistory(history: Array<{ status?: string; by?: string | string[] }>): string[] {
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
          blockedBy: extractBlockedByFromHistory((meta.history as Array<{ status?: string; by?: string | string[] }>) || []),
          relatedAdr: (meta.related_adr as string[]) || [],
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
      });
    } catch {
      /* skip invalid */
    }
  }

  return adrs;
}

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

function generateNext(tasks: Map<string, Task>, blocks: Map<string, string[]>): string {
  const ready: Task[] = [];
  const completedIds = new Set([...tasks.values()].filter((t) => t.status === 'completed').map((t) => t.id));

  for (const [, task] of tasks) {
    if (!['active', 'blocked'].includes(task.status)) continue;
    if (task.blockedBy.length === 0 || task.blockedBy.every((b) => completedIds.has(b))) {
      ready.push(task);
    }
  }

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

function generateReadme(tasks: Map<string, Task>, adrs: Map<string, Adr>, blocks: Map<string, string[]>): string {
  const sections: string[] = [];

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const activeCount = [...tasks.values()].filter((t) => t.status === 'active').length;
  const blockedCount = [...tasks.values()].filter((t) => t.status === 'blocked').length;
  const backlogCount = [...tasks.values()].filter((t) => t.status === 'backlog').length;
  const completedCount = [...tasks.values()].filter((t) => t.status === 'completed').length;
  const adrCount = adrs.size;

  sections.push(`# Lore Index

> Auto-generated on ${dateStr}. Do not edit manually.
> Use \`lore-framework_generate-index\` tool to regenerate.

Quick reference for task dependencies, status, and ADR relationships.

## Quick Stats

| Active | Blocked | Backlog | Completed | ADRs |
|:------:|:-------:|:-------:|:---------:|:----:|
| ${activeCount} | ${blockedCount} | ${backlogCount} | ${completedCount} | ${adrCount} |`);

  // Ready to start
  const ready: Task[] = [];
  const completedIds = new Set([...tasks.values()].filter((t) => t.status === 'completed').map((t) => t.id));
  for (const [, task] of tasks) {
    if (!['active', 'blocked'].includes(task.status)) continue;
    if (task.blockedBy.length === 0 || task.blockedBy.every((b) => completedIds.has(b))) {
      ready.push(task);
    }
  }

  if (ready.length > 0) {
    sections.push('\n## Ready to Start\n\nThese tasks have no blockers (or all blockers completed):\n');
    for (const task of ready.sort((a, b) => a.id.localeCompare(b.id))) {
      const blockCount = blocks.get(task.id)?.length || 0;
      const priority = blockCount >= 3 ? '**HIGH**' : blockCount >= 1 ? 'medium' : 'low';
      sections.push(`- **Task ${task.id}**: [${task.title}](${task.path}) — blocks ${blockCount} tasks (${priority})`);
    }
  }

  // Task status table
  sections.push('\n## Task Status\n');
  sections.push('| ID | Title | Type | Status | Blocked By | Blocks | ADRs |');
  sections.push('|:---|:------|:-----|:-------|:-----------|:-------|:-----|');

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
    sections.push(`| ${task.id} | [${title}](${task.path}) | ${task.type} | ${statusDisplay} | ${blockedBy} | ${taskBlocks} | ${relatedAdr} |`);
  }

  // ADR table
  if (adrs.size > 0) {
    sections.push('\n## Architecture Decision Records\n');
    sections.push('| ID | Title | Status | Related Tasks |');
    sections.push('|:---|:------|:-------|:--------------|');
    for (const adr of [...adrs.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      const related = adr.relatedTasks.length > 0 ? adr.relatedTasks.join(', ') : '—';
      sections.push(`| ${adr.id} | [${adr.title}](${adr.path}) | ${adr.status} | ${related} |`);
    }
  }

  return sections.join('\n');
}

// ============================================================================
// CLI Commands
// ============================================================================

function cmdSetUser(args: string[], flags: { env: boolean; quiet: boolean }): number {
  const sessionDir = getSessionDir();

  if (!existsSync(sessionDir)) {
    console.error('Error: 0-session/ directory not found');
    return 1;
  }

  let userId: string | undefined;
  if (flags.env) {
    userId = process.env.LORE_SESSION_CURRENT_USER;
    if (!userId) {
      console.error('Error: LORE_SESSION_CURRENT_USER not set');
      return 1;
    }
  } else {
    userId = args[0];
    if (!userId) {
      console.error('Usage: lore-framework-mcp set-user <user_id> | --env');
      return 1;
    }
  }

  const team = loadTeam(sessionDir);
  if (!team[userId]) {
    console.error(`Error: User '${userId}' not found`);
    console.error(`Available: ${Object.keys(team).join(', ')}`);
    return 1;
  }

  const userData = team[userId];
  const content = generateCurrentUserMd(userId, userData, team);
  writeFileSync(join(sessionDir, 'current-user.md'), content);

  if (!flags.quiet) {
    console.log(`User: ${userId}`);
  }
  return 0;
}

function cmdSetTask(args: string[], flags: { quiet: boolean }): number {
  const loreDir = getLoreDir();
  const sessionDir = getSessionDir();

  if (!existsSync(sessionDir)) {
    console.error('Error: 0-session/ directory not found');
    return 1;
  }

  const taskId = args[0];
  if (!taskId) {
    console.error('Usage: lore-framework-mcp set-task <task_id>');
    return 1;
  }

  const taskPath = findTask(loreDir, taskId);
  if (!taskPath) {
    console.error(`Error: Task ${taskId} not found`);
    return 1;
  }

  const currentTaskMd = join(sessionDir, 'current-task.md');
  const currentTaskJson = join(sessionDir, 'current-task.json');

  try {
    if (existsSync(currentTaskMd)) unlinkSync(currentTaskMd);
  } catch { /* ignore */ }

  const relativePath = join('..', relative(loreDir, taskPath));
  symlinkSync(relativePath, currentTaskMd);

  const taskDir = relative(loreDir, dirname(taskPath));
  writeFileSync(currentTaskJson, JSON.stringify({ id: taskId, path: taskDir }, null, 2));

  if (!flags.quiet) {
    console.log(`Task: ${taskId} -> ${relativePath}`);
  }
  return 0;
}

function cmdShowSession(): number {
  const sessionDir = getSessionDir();

  if (!existsSync(sessionDir)) {
    console.error('Error: 0-session/ directory not found');
    return 1;
  }

  // User
  const currentUserMd = join(sessionDir, 'current-user.md');
  if (existsSync(currentUserMd)) {
    const content = readFileSync(currentUserMd, 'utf8');
    for (const line of content.split('\n')) {
      if (line.startsWith('name:')) {
        console.log(`User: ${line.split(':')[1].trim()}`);
        break;
      }
    }
  } else {
    const envUser = process.env.LORE_SESSION_CURRENT_USER;
    console.log(envUser ? `User: not set (LORE_SESSION_CURRENT_USER=${envUser} available)` : 'User: not set');
  }

  // Task
  const currentTaskMd = join(sessionDir, 'current-task.md');
  try {
    const target = readlinkSync(currentTaskMd);
    const parts = target.split('/');
    for (const part of parts) {
      if (part && /^\d/.test(part) && part.includes('_')) {
        console.log(`Task: ${part.split('_')[0]} -> ${target}`);
        break;
      }
    }
  } catch {
    console.log('Task: not set');
  }

  return 0;
}

function cmdListUsers(): number {
  const sessionDir = getSessionDir();

  if (!existsSync(sessionDir)) {
    console.error('Error: 0-session/ directory not found');
    return 1;
  }

  const team = loadTeam(sessionDir);
  console.log('Available users:');
  for (const [userId, userData] of Object.entries(team)) {
    const name = userData.name || userId;
    const role = userData.role ? ` (${userData.role})` : '';
    console.log(`  ${userId}: ${name}${role}`);
  }

  return 0;
}

function cmdClearTask(flags: { quiet: boolean }): number {
  const sessionDir = getSessionDir();

  if (!existsSync(sessionDir)) {
    console.error('Error: 0-session/ directory not found');
    return 1;
  }

  const currentTaskMd = join(sessionDir, 'current-task.md');
  const currentTaskJson = join(sessionDir, 'current-task.json');

  let cleared = false;
  if (existsSync(currentTaskMd)) {
    unlinkSync(currentTaskMd);
    cleared = true;
  }
  if (existsSync(currentTaskJson)) {
    unlinkSync(currentTaskJson);
    cleared = true;
  }

  if (!flags.quiet) {
    console.log(cleared ? 'Task: cleared' : 'Task: none set');
  }
  return 0;
}

function cmdGenerateIndex(flags: { nextOnly: boolean; quiet: boolean }): number {
  const loreDir = getLoreDir();

  if (!existsSync(loreDir)) {
    console.error(`Error: lore/ directory not found at ${loreDir}`);
    return 1;
  }

  const tasks = parseTasks(loreDir);
  const adrs = parseAdrs(loreDir);
  const blocks = computeBlocks(tasks);

  // Generate next-tasks.md
  const nextContent = generateNext(tasks, blocks);
  const nextPath = join(loreDir, '0-session', 'next-tasks.md');
  if (existsSync(dirname(nextPath))) {
    writeFileSync(nextPath, nextContent);
    if (!flags.quiet) {
      console.log(`Generated ${nextPath}`);
    }
  }

  // Generate README.md (unless --next-only)
  if (!flags.nextOnly) {
    const readmeContent = generateReadme(tasks, adrs, blocks);
    const readmePath = join(loreDir, 'README.md');
    writeFileSync(readmePath, readmeContent);
    if (!flags.quiet) {
      console.log(`Generated ${readmePath}`);
    }
  }

  return 0;
}

function cmdHelp(): number {
  console.log(`lore-framework-mcp - CLI and MCP server for Lore Framework

Usage:
  npx lore-framework-mcp [command] [options]

Commands:
  set-user <id>       Set current user from team.yaml
  set-user --env      Set user from LORE_SESSION_CURRENT_USER env var
  set-task <id>       Set current task by ID
  show-session        Show current session state
  list-users          List available users from team.yaml
  clear-task          Clear current task
  generate-index      Regenerate lore/README.md and next-tasks.md
  help                Show this help message

Options:
  --env               Use LORE_SESSION_CURRENT_USER for set-user
  --next-only         Only generate next-tasks.md (skip README.md)
  --quiet, -q         Suppress output

MCP Server:
  Run without arguments to start the MCP server (stdio transport).
`);
  return 0;
}

// ============================================================================
// Main
// ============================================================================

export function runCli(argv: string[]): number {
  const { command, args, flags } = parseArgs(argv);

  switch (command) {
    case 'set-user':
      return cmdSetUser(args, { env: flags.env, quiet: flags.quiet });
    case 'set-task':
      return cmdSetTask(args, { quiet: flags.quiet });
    case 'show-session':
      return cmdShowSession();
    case 'list-users':
      return cmdListUsers();
    case 'clear-task':
      return cmdClearTask({ quiet: flags.quiet });
    case 'generate-index':
      return cmdGenerateIndex({ nextOnly: flags.nextOnly, quiet: flags.quiet });
    case 'help':
    case '--help':
    case '-h':
      return cmdHelp();
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run with "help" for usage information.');
      return 1;
  }
}
