import type Database from 'better-sqlite3';
import { MeetingReport } from '@/types/meeting';

/**
 * SQLite doesn't support ALTER TABLE to modify CHECK constraints.
 * Recreate the tasks table with the updated constraint that includes 'archived'.
 */
export function migrateTasksStatusConstraint(db: Database.Database): void {
  const tableInfo = db.prepare(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'`
  ).get() as { sql: string } | undefined;

  if (!tableInfo) return;

  // Only run if the old CHECK constraint is present (without 'archived')
  if (!tableInfo.sql.includes("CHECK") || tableInfo.sql.includes("'archived'")) return;

  db.exec(`
    CREATE TABLE tasks_new (
      id TEXT PRIMARY KEY NOT NULL,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      task TEXT NOT NULL,
      assignee TEXT,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','in_review','done','archived')),
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      title TEXT NOT NULL DEFAULT ''
    );
    INSERT INTO tasks_new SELECT id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at, title FROM tasks;
    DROP TABLE tasks;
    ALTER TABLE tasks_new RENAME TO tasks;
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status_position ON tasks(status, position);
  `);

  console.log('[db] Migrated tasks table: added archived to status constraint');
}

export function backfillTasks(db: Database.Database): void {
  const meetings = db.prepare(
    `SELECT m.id, m.report_json FROM meetings m
     WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.meeting_id = m.id)`
  ).all() as { id: string; report_json: string }[];

  if (meetings.length === 0) return;

  const maxPosRow = db.prepare(
    `SELECT COALESCE(MAX(position), -1) AS max_pos FROM tasks WHERE status = 'todo'`
  ).get() as { max_pos: number };
  let nextPos = maxPosRow.max_pos + 1;

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO tasks (id, meeting_id, title, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?)`
  );

  const run = db.transaction(() => {
    for (const meeting of meetings) {
      let report: MeetingReport;
      try {
        report = JSON.parse(meeting.report_json);
      } catch {
        continue;
      }
      if (!Array.isArray(report.actions)) continue;

      for (const action of report.actions) {
        insert.run(
          crypto.randomUUID(),
          meeting.id,
          action.title || '',
          action.task,
          action.assignee || null,
          action.deadline || null,
          nextPos++,
          now,
          now
        );
      }
    }
  });

  run();

  if (meetings.length > 0) {
    console.log(`[db] Backfilled tasks for ${meetings.length} existing meeting(s)`);
  }
}
