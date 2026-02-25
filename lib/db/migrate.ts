import type Database from 'better-sqlite3';
import { MeetingReport } from '@/types/meeting';

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
