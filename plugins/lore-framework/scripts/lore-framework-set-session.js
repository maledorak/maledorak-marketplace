#!/usr/bin/env node
/**
 * Set up the current work session (user and task).
 *
 * Manages:
 * - current-user.md: Generated from team.yaml
 * - current-task.md: Symlink to active task
 *
 * Environment:
 *   LORE_SESSION_CURRENT_USER: User ID (used with --env flag)
 *
 * Usage:
 *   node set-session.js --user mariusz --task 0042
 *   node set-session.js --env --task 0042
 *   node set-session.js --show
 *   node set-session.js --list-users
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync, symlinkSync, readlinkSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_VAR = 'LORE_SESSION_CURRENT_USER';

function parseArgs(args) {
  const result = {
    user: null,
    task: null,
    env: false,
    quiet: false,
    show: false,
    listUsers: false,
    clearTask: false,
    projectDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--user' || arg === '-u') {
      result.user = args[++i];
    } else if (arg === '--task' || arg === '-t') {
      result.task = args[++i];
    } else if (arg === '--env') {
      result.env = true;
    } else if (arg === '--quiet' || arg === '-q') {
      result.quiet = true;
    } else if (arg === '--show') {
      result.show = true;
    } else if (arg === '--list-users') {
      result.listUsers = true;
    } else if (arg === '--clear-task') {
      result.clearTask = true;
    } else if (arg === '--project') {
      result.projectDir = args[++i];
    }
  }

  return result;
}

function loadTeam(sessionDir) {
  const teamFile = join(sessionDir, 'team.yaml');
  if (!existsSync(teamFile)) {
    console.error(`Error: team.yaml not found at ${teamFile}`);
    process.exit(1);
  }

  const content = readFileSync(teamFile, 'utf8');
  return parseYaml(content);
}

function generateCurrentUserMd(userId, userData, team) {
  const lines = [];

  // Frontmatter
  lines.push('---');
  lines.push(`name: ${userId}`);
  if (userData.github) {
    lines.push(`github: ${userData.github}`);
  }
  if (userData.role) {
    lines.push(`role: ${userData.role}`);
  }
  lines.push('---');
  lines.push('');

  // Header
  const name = userData.name || userId;
  lines.push(`# Current User: ${name}`);
  lines.push('');

  // Focus
  if (userData.focus) {
    lines.push(`**Focus:** ${userData.focus.trim()}`);
    lines.push('');
  }

  // Communication preferences
  if (userData.prompting) {
    lines.push('## Communication Preferences');
    lines.push('');
    lines.push(userData.prompting.trim());
    lines.push('');
  }

  // Note
  if (userData.note) {
    lines.push(`> ${userData.note}`);
    lines.push('');
  }

  // Rest of team
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

function setUser(sessionDir, userId, quiet = false) {
  const team = loadTeam(sessionDir);

  if (!team[userId]) {
    console.error(`Error: User '${userId}' not found in team.yaml`);
    console.error(`Available users: ${Object.keys(team).join(', ')}`);
    return false;
  }

  const userData = team[userId];
  const content = generateCurrentUserMd(userId, userData, team);

  const currentUserMd = join(sessionDir, 'current-user.md');
  writeFileSync(currentUserMd, content);

  if (!quiet) {
    console.log(`User: ${userId}`);
  }
  return true;
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
          if (existsSync(readme)) {
            return readme;
          }
        } else if (item.endsWith('.md')) {
          return itemPath;
        }
      }
    }
  }

  return null;
}

function setTask(loreDir, sessionDir, taskId, quiet = false) {
  const taskPath = findTask(loreDir, taskId);

  if (!taskPath) {
    console.error(`Error: Task ${taskId} not found in 1-tasks/{active,blocked,archive}/`);
    return false;
  }

  const currentTaskMd = join(sessionDir, 'current-task.md');

  // Remove existing symlink
  try {
    if (existsSync(currentTaskMd)) {
      unlinkSync(currentTaskMd);
    }
  } catch (e) {
    // Ignore
  }

  // Create relative symlink (from 0-session/ dir)
  const relativePath = join('..', relative(loreDir, taskPath));
  symlinkSync(relativePath, currentTaskMd);

  if (!quiet) {
    console.log(`Task: ${taskId} → ${relativePath}`);
  }
  return true;
}

function clearTask(sessionDir, quiet = false) {
  const currentTaskMd = join(sessionDir, 'current-task.md');

  try {
    if (existsSync(currentTaskMd)) {
      unlinkSync(currentTaskMd);
      if (!quiet) {
        console.log('Task: cleared');
      }
    } else {
      if (!quiet) {
        console.log('Task: none set');
      }
    }
  } catch (e) {
    // Ignore
  }

  return true;
}

function showSession(sessionDir) {
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
    const envUser = process.env[ENV_VAR];
    if (envUser) {
      console.log(`User: not set (${ENV_VAR}=${envUser} available)`);
    } else {
      console.log('User: not set');
    }
  }

  // Task
  const currentTaskMd = join(sessionDir, 'current-task.md');
  try {
    const target = readlinkSync(currentTaskMd);
    const parts = target.split('/');
    let taskId = null;
    for (const part of parts) {
      if (part && /^\d/.test(part) && part.includes('_')) {
        taskId = part.split('_')[0];
        break;
      }
    }
    if (taskId) {
      console.log(`Task: ${taskId} → ${target}`);
    }
  } catch (e) {
    if (existsSync(currentTaskMd)) {
      console.log('Task: exists but not a symlink (error)');
    } else {
      console.log('Task: not set');
    }
  }

  return true;
}

function listUsers(sessionDir) {
  const team = loadTeam(sessionDir);

  console.log('Available users:');
  for (const [userId, userData] of Object.entries(team)) {
    const name = userData.name || userId;
    const role = userData.role || '';
    console.log(`  ${userId}: ${name} (${role})`);
  }

  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  // Find directories
  const projectDir = args.projectDir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const loreDir = join(projectDir, 'lore');
  const sessionDir = join(loreDir, '0-session');

  if (!existsSync(sessionDir)) {
    if (!args.quiet) {
      console.error(`Error: 0-session/ directory not found at ${sessionDir}`);
    }
    process.exit(1);
  }

  // Handle commands
  if (args.listUsers) {
    process.exit(listUsers(sessionDir) ? 0 : 1);
  }

  if (args.show) {
    process.exit(showSession(sessionDir) ? 0 : 1);
  }

  if (args.clearTask) {
    process.exit(clearTask(sessionDir, args.quiet) ? 0 : 1);
  }

  // Set user and/or task
  let success = true;

  // User from --env or --user
  let userId = null;
  if (args.env) {
    userId = process.env[ENV_VAR];
    if (!userId) {
      console.error(`Error: ${ENV_VAR} environment variable not set`);
      process.exit(1);
    }
  } else if (args.user) {
    userId = args.user;
  }

  if (userId) {
    success = setUser(sessionDir, userId, args.quiet) && success;
  }

  if (args.task) {
    success = setTask(loreDir, sessionDir, args.task, args.quiet) && success;
  }

  // If no action specified, show session
  if (!userId && !args.task) {
    process.exit(showSession(sessionDir) ? 0 : 1);
  }

  process.exit(success ? 0 : 1);
}

main();
