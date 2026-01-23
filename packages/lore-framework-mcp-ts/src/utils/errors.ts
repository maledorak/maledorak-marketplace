/**
 * Error formatting utilities for MCP tools
 * Provides user-friendly error messages with actionable hints
 */

import { logger } from './logger.js';

export interface McpToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export class LoreError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly hint?: string
  ) {
    super(message);
    this.name = 'LoreError';
  }
}

/**
 * Format error for MCP tool response with actionable hints
 */
export function formatError(error: unknown): McpToolResult {
  if (error instanceof LoreError) {
    let message = `Error [${error.code}]: ${error.message}`;
    if (error.hint) {
      message += `\n\nHint: ${error.hint}`;
    }
    logger.error(error.message, { code: error.code });
    return { content: [{ type: 'text', text: message }], isError: true };
  }

  if (error instanceof Error) {
    // Provide hints for common errors
    let hint = '';

    if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      hint = '\n\nHint: Make sure the lore/ directory exists. Run lore framework bootstrap first.';
    } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
      hint = '\n\nHint: Check file permissions in the lore/ directory.';
    } else if (error.message.includes('YAML') || error.message.includes('yaml')) {
      hint = '\n\nHint: Check YAML syntax in the file. Common issues: incorrect indentation, missing quotes.';
    }

    logger.error(error.message, { stack: error.stack });
    return { content: [{ type: 'text', text: `Error: ${error.message}${hint}` }], isError: true };
  }

  logger.error('Unknown error', { error: String(error) });
  return { content: [{ type: 'text', text: `Error: ${String(error)}` }], isError: true };
}

/**
 * Create success response
 */
export function success(text: string): McpToolResult {
  return { content: [{ type: 'text', text }] };
}

/**
 * Wrap tool handler with error formatting
 */
export function wrapToolHandler<T>(
  handler: (args: T) => Promise<McpToolResult>
): (args: T) => Promise<McpToolResult> {
  return async (args: T) => {
    try {
      return await handler(args);
    } catch (error) {
      return formatError(error);
    }
  };
}
