// ============================================================
// @pgos/api — Database Schema
// Drizzle PostgreSQL ORM Schema Definitions
// ============================================================

import { pgTable, uuid, varchar, text, decimal, jsonb, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// Projects Table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  repoUrl: text('repo_url'),
  repoType: varchar('repo_type', { length: 50 }).default('git'),
  rootPath: text('root_path').notNull(),
  config: jsonb('config').default({}),
  healthScore: decimal('health_score', { precision: 5, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Snapshots Table
export const snapshots = pgTable('snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }),
  label: varchar('label', { length: 100 }).default('checkpoint'), // stable, pre-ai, checkpoint
  trigger: varchar('trigger', { length: 100 }).notNull(), // manual, pre-action, scheduled
  contents: jsonb('contents').notNull(), // manifest file listing
  storagePath: text('storage_path').notNull(),
  sizeBytes: integer('size_bytes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Validations Table
export const validations = pgTable('validations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  snapshotId: uuid('snapshot_id').references(() => snapshots.id),
  type: varchar('type', { length: 100 }).notNull(), // completion, architecture, hallucination
  status: varchar('status', { length: 50 }).notNull(), // pass, fail, warning, partial
  score: decimal('score', { precision: 5, scale: 2 }),
  results: jsonb('results').notNull(), // detailed array of validation items
  requirements: jsonb('requirements'), // matching requirements list
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Memories Table
export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // decision, pattern, lesson, constraint
  content: text('content').notNull(),
  metadata: jsonb('metadata').default({}),
  relevanceScore: decimal('relevance_score', { precision: 5, scale: 2 }).default('1.0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow(),
});

// Agent Tasks Table
export const agentTasks = pgTable('agent_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  agentType: varchar('agent_type', { length: 100 }).notNull(), // architect, coder, reviewer, planner
  parentTaskId: uuid('parent_task_id'), // hierarchical reference
  description: text('description').notNull(),
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  status: varchar('status', { length: 50 }).default('pending'),
  assignedModel: varchar('assigned_model', { length: 200 }),
  tokensUsed: integer('tokens_used').default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
