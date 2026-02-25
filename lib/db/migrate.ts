import type Database from 'better-sqlite3';
import { MeetingReport } from '@/types/meeting';

export function ensureTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      raw_notes TEXT NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      task TEXT NOT NULL,
      assignee TEXT,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','in_review','done')),
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status_position ON tasks(status, position);
  `);
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
    `INSERT INTO tasks (id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'todo', ?, ?, ?)`
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
