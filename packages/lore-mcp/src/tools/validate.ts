/**
 * Validation tool
 * - lore-validate: Validate frontmatter in tasks, ADRs, and notes
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';
import { globSync } from 'glob';
import { ZodError } from 'zod';
import {
  TaskFrontmatterSchema,
  AdrFrontmatterSchema,
  NoteFrontmatterSchema,
  NOTE_TYPES,
  ValidateInputSchema,
} from '../schemas/index.js';
import { logger } from '../utils/logger.js';
import { success, LoreError, wrapToolHandler } from '../utils/errors.js';

// ============================================================================
// Types
// ============================================================================

interface ValidationResult {
  errors: string[];
  warnings: string[];
  type: 'task' | 'adr' | 'note' | 'unknown';
  path: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((e) => {
    const path = e.path.length > 0 ? e.path.join('.') + ': ' : '';
    return `${path}${e.message}`;
  });
}

function validateTaskFrontmatter(meta: unknown, filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    TaskFrontmatterSchema.parse(meta);
  } catch (e) {
    if (e instanceof ZodError) {
      errors.push(...formatZodErrors(e));
    } else {
      errors.push(String(e));
    }
  }

  return { errors, warnings, type: 'task', path: filePath };
}

function validateAdrFrontmatter(meta: unknown, filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    AdrFrontmatterSchema.parse(meta);
  } catch (e) {
    if (e instanceof ZodError) {
      errors.push(...formatZodErrors(e));
    } else {
      errors.push(String(e));
    }
  }

  return { errors, warnings, type: 'adr', path: filePath };
}

function validateNoteFrontmatter(meta: unknown, filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    NoteFrontmatterSchema.parse(meta);
  } catch (e) {
    if (e instanceof ZodError) {
      errors.push(...formatZodErrors(e));
    } else {
      errors.push(String(e));
    }
  }

  // Check type matches filename prefix
  const filename = filePath.split('/').pop() || '';
  const prefixMap: Record<string, string> = {
    'Q-': 'question',
    'I-': 'idea',
    'R-': 'research',
    'S-': 'synthesis',
    'G-': 'generation',
  };

  const typedMeta = meta as { type?: string; spawned_from?: string; spawns?: string[] };

  for (const [prefix, expectedType] of Object.entries(prefixMap)) {
    if (filename.startsWith(prefix) && typedMeta.type && typedMeta.type !== expectedType) {
      errors.push(`Type mismatch: file prefix "${prefix}" expects type "${expectedType}" but found "${typedMeta.type}"`);
    }
  }

  // Warn about deprecated top-level spawned_from/spawns
  if (typedMeta.spawned_from) {
    warnings.push('Top-level "spawned_from" is deprecated. Move to history entry with spawned_from array.');
  }
  if (typedMeta.spawns) {
    warnings.push('Top-level "spawns" is deprecated. Move to history entry with spawns array.');
  }

  return { errors, warnings, type: 'note', path: filePath };
}

function detectContentType(filePath: string): 'task' | 'adr' | 'note' | null {
  if (filePath.includes('/1-tasks/')) {
    if (filePath.includes('/notes/')) {
      return 'note';
    }
    return 'task';
  }
  if (filePath.includes('/2-adrs/')) {
    return 'adr';
  }
  return null;
}

function validateFile(filePath: string): ValidationResult {
  const contentType = detectContentType(filePath);
  if (!contentType) {
    return {
      errors: [`Cannot determine content type for: ${filePath}`],
      warnings: [],
      type: 'unknown',
      path: filePath,
    };
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const { data: meta } = matter(content);

    if (!meta || Object.keys(meta).length === 0) {
      return { errors: ['No frontmatter found'], warnings: [], type: contentType, path: filePath };
    }

    switch (contentType) {
      case 'task':
        return validateTaskFrontmatter(meta, filePath);
      case 'adr':
        return validateAdrFrontmatter(meta, filePath);
      case 'note':
        return validateNoteFrontmatter(meta, filePath);
      default:
        return {
          errors: [`Unknown content type: ${contentType}`],
          warnings: [],
          type: contentType,
          path: filePath,
        };
    }
  } catch (e) {
    return {
      errors: [`Failed to parse file: ${e instanceof Error ? e.message : String(e)}`],
      warnings: [],
      type: contentType,
      path: filePath,
    };
  }
}

function validateAllContent(loreDir: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Validate tasks
  const tasksBase = join(loreDir, '1-tasks');
  for (const subdir of ['active', 'blocked', 'archive', 'backlog']) {
    const subdirPath = join(tasksBase, subdir);
    if (!existsSync(subdirPath)) continue;

    const items = readdirSync(subdirPath);
    for (const item of items) {
      if (item.startsWith('_')) continue;

      const itemPath = join(subdirPath, item);
      const stat = statSync(itemPath);

      if (stat.isFile() && item.endsWith('.md')) {
        results.push(validateFile(itemPath));
      } else if (stat.isDirectory()) {
        // Validate task README
        const readme = join(itemPath, 'README.md');
        if (existsSync(readme)) {
          results.push(validateFile(readme));
        }

        // Validate notes
        const notesDir = join(itemPath, 'notes');
        if (existsSync(notesDir)) {
          const noteFiles = globSync('**/*.md', { cwd: notesDir });
          for (const noteFile of noteFiles) {
            const notePath = join(notesDir, noteFile);
            results.push(validateFile(notePath));
          }
        }
      }
    }
  }

  // Validate ADRs
  const adrDir = join(loreDir, '2-adrs');
  if (existsSync(adrDir)) {
    const adrFiles = globSync('*.md', { cwd: adrDir });
    for (const file of adrFiles) {
      if (file.startsWith('_')) continue;
      results.push(validateFile(join(adrDir, file)));
    }
  }

  return results;
}

// ============================================================================
// Tool Registration
// ============================================================================

export function registerValidateTools(server: McpServer, getLoreDir: () => string, getProjectDir: () => string): void {
  server.registerTool(
    'lore-validate',
    {
      title: 'Validate Frontmatter',
      description: 'Validate frontmatter in tasks, ADRs, and notes. Can validate a single file or all content.',
      inputSchema: ValidateInputSchema,
    },
    wrapToolHandler(async ({ file_path }) => {
      const loreDir = getLoreDir();
      const projectDir = getProjectDir();

      if (!existsSync(loreDir)) {
        throw new LoreError(
          `lore/ directory not found at ${loreDir}`,
          'LORE_NOT_FOUND',
          'Initialize the lore directory structure first.'
        );
      }

      let results: ValidationResult[];
      if (file_path) {
        // Validate single file
        const fullPath = file_path.startsWith('/') ? file_path : join(projectDir, file_path);
        if (!existsSync(fullPath)) {
          throw new LoreError(`File not found: ${fullPath}`, 'FILE_NOT_FOUND', 'Check the file path and try again.');
        }
        results = [validateFile(fullPath)];
      } else {
        // Validate all content
        results = validateAllContent(loreDir);
      }

      // Format results
      const lines: string[] = [];
      let totalErrors = 0;
      let totalWarnings = 0;
      const filesWithErrors: string[] = [];
      const filesWithWarnings: string[] = [];

      for (const result of results) {
        if (result.errors.length > 0 || result.warnings.length > 0) {
          const relativePath = relative(projectDir, result.path);

          if (result.errors.length > 0) {
            filesWithErrors.push(relativePath);
            totalErrors += result.errors.length;
          }
          if (result.warnings.length > 0) {
            filesWithWarnings.push(relativePath);
            totalWarnings += result.warnings.length;
          }

          lines.push(`\n## ${relativePath} (${result.type})`);

          if (result.errors.length > 0) {
            lines.push('\n**Errors:**');
            for (const err of result.errors) {
              lines.push(`- ${err}`);
            }
          }

          if (result.warnings.length > 0) {
            lines.push('\n**Warnings:**');
            for (const warn of result.warnings) {
              lines.push(`- ${warn}`);
            }
          }
        }
      }

      // Summary
      const summaryLines = ['# Validation Results\n'];
      summaryLines.push(`**Files checked:** ${results.length}`);
      summaryLines.push(`**Errors:** ${totalErrors} in ${filesWithErrors.length} files`);
      summaryLines.push(`**Warnings:** ${totalWarnings} in ${filesWithWarnings.length} files`);

      if (totalErrors === 0 && totalWarnings === 0) {
        summaryLines.push('\nAll files valid!');
      }

      logger.info('Validation complete', {
        filesChecked: results.length,
        totalErrors,
        totalWarnings,
      });

      return success(summaryLines.join('\n') + lines.join('\n'));
    })
  );
}
