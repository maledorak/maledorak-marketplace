/**
 * Session management tools
 * - lore-set-user: Set current user from team.yaml
 * - lore-set-task: Set current task symlink
 * - lore-show-session: Show current session state
 * - lore-list-users: List available users
 * - lore-clear-task: Clear current task
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
import { SetUserInputSchema, SetTaskInputSchema } from '../schemas/index.js';
import { logger } from '../utils/logger.js';
import { success, formatError, LoreError, wrapToolHandler } from '../utils/errors.js';

// ============================================================================
// Helper Functions
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

function loadTeam(sessionDir: string): Team {
  const teamFile = join(sessionDir, 'team.yaml');
  if (!existsSync(teamFile)) {
    throw new LoreError(
      `team.yaml not found at ${teamFile}`,
      'TEAM_NOT_FOUND',
      'Create a team.yaml file in lore/0-session/ with your team members.'
    );
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
// Tool Registration
// ============================================================================

export function registerSessionTools(
  server: McpServer,
  getLoreDir: () => string,
  getSessionDir: () => string,
  getProjectDir: () => string
): void {
  // Tool: lore-set-user
  server.registerTool(
    'lore_set-user',
    {
      title: 'Set User',
      description: 'Set current user from team.yaml',
      inputSchema: SetUserInputSchema,
    },
    wrapToolHandler(async ({ user_id }) => {
      const sessionDir = getSessionDir();
      if (!existsSync(sessionDir)) {
        throw new LoreError(
          '0-session/ directory not found',
          'SESSION_NOT_FOUND',
          'Run lore framework bootstrap first to create the directory structure.'
        );
      }

      const team = loadTeam(sessionDir);

      if (!team[user_id]) {
        const available = Object.keys(team).join(', ');
        throw new LoreError(
          `User '${user_id}' not found in team.yaml`,
          'USER_NOT_FOUND',
          `Available users: ${available}`
        );
      }

      const userData = team[user_id];
      const content = generateCurrentUserMd(user_id, userData, team);
      const currentUserMd = join(sessionDir, 'current-user.md');
      writeFileSync(currentUserMd, content);

      logger.info('User set', { userId: user_id, name: userData.name || user_id });
      return success(`User set: ${user_id} (${userData.name || user_id})`);
    })
  );

  // Tool: lore-set-task
  server.registerTool(
    'lore_set-task',
    {
      title: 'Set Task',
      description: 'Set current task by ID (creates symlink to task file)',
      inputSchema: SetTaskInputSchema,
    },
    wrapToolHandler(async ({ task_id }) => {
      const loreDir = getLoreDir();
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        throw new LoreError(
          '0-session/ directory not found',
          'SESSION_NOT_FOUND',
          'Run lore framework bootstrap first to create the directory structure.'
        );
      }

      const taskPath = findTask(loreDir, task_id);

      if (!taskPath) {
        throw new LoreError(
          `Task ${task_id} not found`,
          'TASK_NOT_FOUND',
          'Check task ID or look in 1-tasks/{active,blocked,archive,backlog}/'
        );
      }

      const currentTaskMd = join(sessionDir, 'current-task.md');
      const currentTaskJson = join(sessionDir, 'current-task.json');

      try {
        if (existsSync(currentTaskMd)) unlinkSync(currentTaskMd);
      } catch {
        /* ignore */
      }

      const relativePath = join('..', relative(loreDir, taskPath));
      symlinkSync(relativePath, currentTaskMd);

      // Get task directory
      const taskDir = relative(loreDir, dirname(taskPath));

      // Write task metadata
      const taskMeta = { id: task_id, path: taskDir };
      writeFileSync(currentTaskJson, JSON.stringify(taskMeta, null, 2));

      logger.info('Task set', { taskId: task_id, path: relativePath });
      return success(`Task set: ${task_id} -> ${relativePath}`);
    })
  );

  // Tool: lore-show-session
  server.registerTool(
    'lore_show-session',
    {
      title: 'Show Session',
      description: 'Show current session state (user and task)',
      inputSchema: {},
    },
    wrapToolHandler(async () => {
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        throw new LoreError(
          '0-session/ directory not found',
          'SESSION_NOT_FOUND',
          'Run lore framework bootstrap first to create the directory structure.'
        );
      }

      const result: { user: string | null; task: { id: string; path: string } | null } = {
        user: null,
        task: null,
      };

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
      } catch {
        result.task = null;
      }

      const lines: string[] = [];

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

      return success(lines.join('\n'));
    })
  );

  // Tool: lore-list-users
  server.registerTool(
    'lore_list-users',
    {
      title: 'List Users',
      description: 'List available users from team.yaml',
      inputSchema: {},
    },
    wrapToolHandler(async () => {
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        throw new LoreError(
          '0-session/ directory not found',
          'SESSION_NOT_FOUND',
          'Run lore framework bootstrap first to create the directory structure.'
        );
      }

      const team = loadTeam(sessionDir);
      const lines = ['Available users:', ''];

      for (const [userId, userData] of Object.entries(team)) {
        const name = userData.name || userId;
        const role = userData.role ? ` (${userData.role})` : '';
        lines.push(`- ${userId}: ${name}${role}`);
      }

      return success(lines.join('\n'));
    })
  );

  // Tool: lore-clear-task
  server.registerTool(
    'lore_clear-task',
    {
      title: 'Clear Task',
      description: 'Clear current task symlink',
      inputSchema: {},
    },
    wrapToolHandler(async () => {
      const sessionDir = getSessionDir();

      if (!existsSync(sessionDir)) {
        throw new LoreError(
          '0-session/ directory not found',
          'SESSION_NOT_FOUND',
          'Run lore framework bootstrap first to create the directory structure.'
        );
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

      if (cleared) {
        logger.info('Task cleared');
        return success('Task cleared');
      }
      return success('No task was set');
    })
  );
}
