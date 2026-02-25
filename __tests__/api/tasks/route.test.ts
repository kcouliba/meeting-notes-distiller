/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';

let testDb: Database.Database;

function resetDb() {
  if (testDb) testDb.close();
  testDb = new Database(':memory:');
  testDb.pragma('journal_mode = WAL');
  testDb.pragma('foreign_keys = ON');
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      raw_notes TEXT NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
  `);
}

jest.mock('@/lib/db', () => ({
  getDb: () => testDb,
}));

import { GET } from '@/app/api/tasks/route';

function seedData() {
  testDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-1', 'Sprint Planning', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

  testDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-2', 'Standup', 'notes', '{}', '2026-01-02T00:00:00.000Z', '2026-01-02T00:00:00.000Z');

  const now = '2026-01-01T00:00:00.000Z';
  const insert = testDb.prepare(
    `INSERT INTO tasks (id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run('t-1', 'm-1', 'Write tests', 'Alice', 'Feb 1', 'todo', 0, now, now);
  insert.run('t-2', 'm-1', 'Deploy app', 'Bob', null, 'in_progress', 0, now, now);
  insert.run('t-3', 'm-2', 'Review PR', null, 'Feb 5', 'todo', 1, now, now);
}

function makeGetRequest(params?: Record<string, string>): Request {
  const url = new URL('http://localhost:3000/api/tasks');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString(), { method: 'GET' });
}

describe('GET /api/tasks', () => {
  beforeEach(() => {
    resetDb();
    seedData();
  });
  afterAll(() => testDb?.close());

  it('returns all tasks with meeting titles', async () => {
    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tasks).toHaveLength(3);

    const task1 = body.tasks.find((t: { id: string }) => t.id === 't-1');
    expect(task1.meetingTitle).toBe('Sprint Planning');
    expect(task1.task).toBe('Write tests');
    expect(task1.assignee).toBe('Alice');
  });

  it('filters by status', async () => {
    const res = await GET(makeGetRequest({ status: 'in_progress' }));
    const body = await res.json();

    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].id).toBe('t-2');
    expect(body.tasks[0].status).toBe('in_progress');
  });

  it('filters by multiple statuses', async () => {
    const res = await GET(makeGetRequest({ status: 'todo,in_progress' }));
    const body = await res.json();

    expect(body.tasks).toHaveLength(3);
  });

  it('returns empty array when no tasks exist', async () => {
    testDb.exec('DELETE FROM tasks');

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(body.tasks).toHaveLength(0);
  });
});
