/**
 * Zod validation schemas for lore frontmatter
 */

import { z } from 'zod';

// ============================================================================
// Enum Values
// ============================================================================

export const TASK_TYPES = ['BUG', 'FEATURE', 'RESEARCH', 'REFACTOR', 'DOCS'] as const;
export const TASK_STATUSES = ['active', 'blocked', 'completed', 'superseded', 'canceled', 'backlog'] as const;
export const ADR_STATUSES = ['proposed', 'accepted', 'deprecated', 'superseded'] as const;
export const NOTE_TYPES = ['question', 'idea', 'research', 'synthesis', 'generation'] as const;
export const NOTE_STATUSES = ['seed', 'developing', 'mature', 'superseded'] as const;
export const CANCEL_REASONS = ['pivot', 'obsolete', 'duplicate'] as const;

// ============================================================================
// Common Schemas
// ============================================================================

export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format');
export const IdSchema = z.string().regex(/^\d+$/, 'Must be numeric (e.g., "0001")');

// ============================================================================
// History Entry Schemas
// ============================================================================

export const BaseHistoryEntrySchema = z.object({
  date: DateSchema,
  who: z.string().min(1, 'who is required'),
  note: z.string().optional(),
});

export const TaskHistoryEntrySchema = BaseHistoryEntrySchema.extend({
  status: z.enum(TASK_STATUSES),
  by: z.array(z.string()).optional(),
  reason: z.enum(CANCEL_REASONS).optional(),
}).refine(
  (entry) => {
    if (entry.status === 'blocked' || entry.status === 'superseded') {
      return entry.by && entry.by.length > 0;
    }
    return true;
  },
  { message: '"by" is required for blocked/superseded status' }
).refine(
  (entry) => {
    if (entry.status === 'canceled') {
      return !!entry.reason;
    }
    return true;
  },
  { message: '"reason" is required for canceled status' }
);

export const AdrHistoryEntrySchema = BaseHistoryEntrySchema.extend({
  status: z.enum(ADR_STATUSES),
  by: z.string().optional(),
}).refine(
  (entry) => {
    if (entry.status === 'superseded') {
      return !!entry.by;
    }
    return true;
  },
  { message: '"by" is required for superseded status' }
);

export const NoteHistoryEntrySchema = BaseHistoryEntrySchema.extend({
  status: z.enum(NOTE_STATUSES),
  by: z.string().optional(),
  spawned_from: z.array(z.string()).optional(),
  spawns: z.array(z.string()).optional(),
}).refine(
  (entry) => {
    if (entry.status === 'superseded') {
      return !!entry.by;
    }
    return true;
  },
  { message: '"by" is required for superseded status' }
);

// ============================================================================
// Frontmatter Schemas
// ============================================================================

export const TaskFrontmatterSchema = z.object({
  id: IdSchema,
  title: z.string().min(1, 'title is required'),
  type: z.enum(TASK_TYPES),
  status: z.enum(TASK_STATUSES),
  related_adr: z.array(z.string()).optional(),
  related_tasks: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  history: z.array(TaskHistoryEntrySchema).min(1, 'history must have at least one entry'),
});

export const AdrFrontmatterSchema = z.object({
  id: IdSchema,
  title: z.string().min(1, 'title is required'),
  status: z.enum(ADR_STATUSES),
  deciders: z.array(z.string()).min(1, 'deciders must have at least one entry'),
  related_tasks: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  history: z.array(AdrHistoryEntrySchema).min(1, 'history must have at least one entry'),
});

export const NoteFrontmatterSchema = z.object({
  title: z.string().min(1, 'title is required'),
  type: z.enum(NOTE_TYPES),
  status: z.enum(NOTE_STATUSES),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  history: z.array(NoteHistoryEntrySchema).min(1, 'history must have at least one entry'),
  // Deprecated fields - warn but allow
  spawned_from: z.string().optional(),
  spawns: z.array(z.string()).optional(),
});

// ============================================================================
// Tool Input Schemas
// ============================================================================

export const SetUserInputSchema = z.object({
  user_id: z.string().describe('User ID from team.yaml (e.g., "mariusz")'),
});

export const SetTaskInputSchema = z.object({
  task_id: z.string().describe('Task ID (e.g., "0042" or "18")'),
});

export const ValidateInputSchema = z.object({
  file_path: z.string().optional().describe('Optional: path to a specific file to validate. If not provided, validates all content.'),
});

// ============================================================================
// Type Exports
// ============================================================================

export type TaskType = (typeof TASK_TYPES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type AdrStatus = (typeof ADR_STATUSES)[number];
export type NoteType = (typeof NOTE_TYPES)[number];
export type NoteStatus = (typeof NOTE_STATUSES)[number];
export type CancelReason = (typeof CANCEL_REASONS)[number];

export type TaskFrontmatter = z.infer<typeof TaskFrontmatterSchema>;
export type AdrFrontmatter = z.infer<typeof AdrFrontmatterSchema>;
export type NoteFrontmatter = z.infer<typeof NoteFrontmatterSchema>;
