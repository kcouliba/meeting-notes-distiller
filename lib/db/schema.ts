import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const meetings = sqliteTable('meetings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  rawNotes: text('raw_notes').notNull(),
  reportJson: text('report_json').notNull(),
  createdAt: text('created_at').notNull().default("datetime('now')"),
  updatedAt: text('updated_at').notNull().default("datetime('now')"),
}, (table) => [
  index('idx_meetings_created_at').on(table.createdAt),
]);

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  task: text('task').notNull(),
  assignee: text('assignee'),
  deadline: text('deadline'),
  status: text('status', { enum: ['todo', 'in_progress', 'in_review', 'done'] }).notNull().default('todo'),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull().default("datetime('now')"),
  updatedAt: text('updated_at').notNull().default("datetime('now')"),
}, (table) => [
  index('idx_tasks_status').on(table.status),
  index('idx_tasks_meeting_id').on(table.meetingId),
  index('idx_tasks_status_position').on(table.status, table.position),
]);

export const meetingsRelations = relations(meetings, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  meeting: one(meetings, {
    fields: [tasks.meetingId],
    references: [meetings.id],
  }),
}));

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
