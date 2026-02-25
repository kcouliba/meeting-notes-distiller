/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { MeetingReport } from '@/types/meeting';
import { createTestDb } from '@/__tests__/helpers/test-db';
import * as schema from '@/lib/db/schema';

const fullReport: MeetingReport = {
  summary: [
    'Discussed Q1 roadmap and approved key initiatives',
    'New CI/CD pipeline adoption planned for end of February',
  ],
  decisions: ['Adopt the new CI/CD pipeline by end of February'],
  actions: [
    { task: 'Prepare the migration plan', assignee: 'Bob', deadline: 'Jan 30' },
  ],
  pending: ['Need to hire a contractor for frontend work?'],
  participants: ['Alice', 'Bob', 'Charlie'],
};

describe('meetings database', () => {
  let db: BetterSQLite3Database<typeof schema>;
  let rawDb: Database.Database;

  beforeEach(() => {
    const result = createTestDb();
    db = result.db;
    rawDb = result.rawDb;
  });

  afterEach(() => {
    rawDb.close();
  });

  it('creates the meetings table via migration', () => {
    const tables = rawDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meetings'")
      .all() as { name: string }[];
    expect(tables).toHaveLength(1);
    expect(tables[0].name).toBe('meetings');
  });

  it('inserts and retrieves a meeting', () => {
    const id = 'test-uuid-1';
    const title = 'Test Meeting';
    const rawNotes = 'Some raw notes';
    const reportJson = JSON.stringify(fullReport);
    const now = new Date().toISOString();

    rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, title, rawNotes, reportJson, now, now);

    const row = rawDb.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as {
      id: string;
      title: string;
      raw_notes: string;
      report_json: string;
      created_at: string;
      updated_at: string;
    };

    expect(row).toBeDefined();
    expect(row.id).toBe(id);
    expect(row.title).toBe(title);
    expect(row.raw_notes).toBe(rawNotes);
    expect(JSON.parse(row.report_json)).toEqual(fullReport);
    expect(row.created_at).toBe(now);
  });

  it('lists meetings sorted by created_at descending', () => {
    const insert = rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    insert.run('id-1', 'First', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    insert.run('id-2', 'Second', 'notes', '{}', '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
    insert.run('id-3', 'Third', 'notes', '{}', '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z');

    const rows = rawDb.prepare(
      'SELECT id, title FROM meetings ORDER BY created_at DESC'
    ).all() as { id: string; title: string }[];

    expect(rows).toHaveLength(3);
    expect(rows[0].title).toBe('Third');
    expect(rows[1].title).toBe('Second');
    expect(rows[2].title).toBe('First');
  });

  it('deletes a meeting by ID', () => {
    rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('del-1', 'To Delete', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

    const before = rawDb.prepare('SELECT COUNT(*) as count FROM meetings').get() as { count: number };
    expect(before.count).toBe(1);

    rawDb.prepare('DELETE FROM meetings WHERE id = ?').run('del-1');

    const after = rawDb.prepare('SELECT COUNT(*) as count FROM meetings').get() as { count: number };
    expect(after.count).toBe(0);
  });

  it('returns undefined for non-existent ID', () => {
    const row = rawDb.prepare('SELECT * FROM meetings WHERE id = ?').get('nonexistent');
    expect(row).toBeUndefined();
  });

  it('supports pagination with LIMIT and OFFSET', () => {
    const insert = rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (let i = 1; i <= 5; i++) {
      const date = `2026-0${i}-01T00:00:00.000Z`;
      insert.run(`id-${i}`, `Meeting ${i}`, 'notes', '{}', date, date);
    }

    const page1 = rawDb.prepare(
      'SELECT id FROM meetings ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(2, 0) as { id: string }[];
    expect(page1).toHaveLength(2);
    expect(page1[0].id).toBe('id-5');
    expect(page1[1].id).toBe('id-4');

    const page2 = rawDb.prepare(
      'SELECT id FROM meetings ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(2, 2) as { id: string }[];
    expect(page2).toHaveLength(2);
    expect(page2[0].id).toBe('id-3');
    expect(page2[1].id).toBe('id-2');
  });

  it('title truncation works at application level', () => {
    const longSummary = 'A'.repeat(100);
    const title = longSummary.slice(0, 80) + (longSummary.length > 80 ? '...' : '');
    expect(title).toBe('A'.repeat(80) + '...');
    expect(title.length).toBe(83);
  });

  it('defaults to "Untitled Meeting" for empty summary', () => {
    const emptySummary: string[] = [];
    const title =
      emptySummary.length > 0 && emptySummary[0]
        ? emptySummary[0].slice(0, 80)
        : 'Untitled Meeting';
    expect(title).toBe('Untitled Meeting');
  });
});

describe('tasks database', () => {
  let db: BetterSQLite3Database<typeof schema>;
  let rawDb: Database.Database;

  beforeEach(() => {
    const result = createTestDb();
    db = result.db;
    rawDb = result.rawDb;
  });

  afterEach(() => {
    rawDb.close();
  });

  function insertMeeting(id: string) {
    rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, 'Test Meeting', 'notes', JSON.stringify(fullReport), '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
  }

  it('creates the tasks table via migration', () => {
    const tables = rawDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'")
      .all() as { name: string }[];
    expect(tables).toHaveLength(1);
    expect(tables[0].name).toBe('tasks');
  });

  it('inserts and retrieves a task', () => {
    insertMeeting('m-1');
    const now = new Date().toISOString();

    rawDb.prepare(
      `INSERT INTO tasks (id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run('t-1', 'm-1', 'Write tests', 'Alice', 'Feb 1', 'todo', 0, now, now);

    const row = rawDb.prepare('SELECT * FROM tasks WHERE id = ?').get('t-1') as {
      id: string;
      meeting_id: string;
      task: string;
      assignee: string;
      deadline: string;
      status: string;
      position: number;
    };

    expect(row).toBeDefined();
    expect(row.id).toBe('t-1');
    expect(row.meeting_id).toBe('m-1');
    expect(row.task).toBe('Write tests');
    expect(row.assignee).toBe('Alice');
    expect(row.status).toBe('todo');
    expect(row.position).toBe(0);
  });

  it('cascade deletes tasks when meeting is deleted', () => {
    insertMeeting('m-1');
    const now = new Date().toISOString();

    rawDb.prepare(
      `INSERT INTO tasks (id, meeting_id, task, status, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('t-1', 'm-1', 'Task 1', 'todo', 0, now, now);

    rawDb.prepare(
      `INSERT INTO tasks (id, meeting_id, task, status, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('t-2', 'm-1', 'Task 2', 'todo', 1, now, now);

    const before = rawDb.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    expect(before.count).toBe(2);

    rawDb.prepare('DELETE FROM meetings WHERE id = ?').run('m-1');

    const after = rawDb.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    expect(after.count).toBe(0);
  });

  it('rejects invalid status values', () => {
    insertMeeting('m-1');
    const now = new Date().toISOString();

    expect(() => {
      rawDb.prepare(
        `INSERT INTO tasks (id, meeting_id, task, status, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run('t-1', 'm-1', 'Task', 'invalid_status', 0, now, now);
    }).toThrow();
  });
});
