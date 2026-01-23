#!/usr/bin/env node
/**
 * MCP Server for Lore Framework
 *
 * Provides tools for managing lore/ directory:
 * - lore-framework_set-user: Set current user from team.yaml
 * - lore-framework_set-task: Set current task symlink
 * - lore-framework_show-session: Show current session state
 * - lore-framework_list-users: List available users from team.yaml
 * - lore-framework_clear-task: Clear current task symlink
 * - lore-framework_generate-index: Regenerate lore/README.md and next-tasks.md
 * - lore-framework_validate: Validate frontmatter in tasks, ADRs, and notes
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { join } from 'path';
import { registerSessionTools } from './tools/session.js';
import { registerIndexTools } from './tools/index-generator.js';
import { registerValidateTools } from './tools/validate.js';
import { logger } from './utils/logger.js';

// ============================================================================
// Configuration
// ============================================================================

const VERSION = '1.2.0';

function getProjectDir(): string {
  return process.cwd();
}

function getLoreDir(): string {
  return join(getProjectDir(), 'lore');
}

function getSessionDir(): string {
  return join(getLoreDir(), '0-session');
}

// ============================================================================
// Server Setup
// ============================================================================

async function main(): Promise<void> {
  logger.info('Starting lore-mcp server', { version: VERSION });

  const server = new McpServer({
    name: 'lore',
    version: VERSION,
  });

  // Register all tools
  registerSessionTools(server, getLoreDir, getSessionDir, getProjectDir);
  registerIndexTools(server, getLoreDir);
  registerValidateTools(server, getLoreDir, getProjectDir);

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Server connected', { transport: 'stdio' });
}

main().catch((error) => {
  logger.error('Fatal error', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
