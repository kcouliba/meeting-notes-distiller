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

import { PATCH, DELETE } from '@/app/api/tasks/[id]/route';

function seedData() {
  testDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-1', 'Meeting', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

  const now = '2026-01-01T00:00:00.000Z';
  testDb.prepare(
    `INSERT INTO tasks (id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('t-1', 'm-1', 'Write tests', 'Alice', 'Feb 1', 'todo', 0, now, now);
}

function makePatchRequest(id: string, body: Record<string, unknown>): [Request, { params: { id: string } }] {
  return [
    new Request(`http://localhost:3000/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: { id } },
  ];
}

function makeDeleteRequest(id: string): [Request, { params: { id: string } }] {
  return [
    new Request(`http://localhost:3000/api/tasks/${id}`, { method: 'DELETE' }),
    { params: { id } },
  ];
}

describe('PATCH /api/tasks/[id]', () => {
  beforeEach(() => {
    resetDb();
    seedData();
  });
  afterAll(() => testDb?.close());

  it('updates task status', async () => {
    const [req, params] = makePatchRequest('t-1', { status: 'in_progress' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = testDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-1') as { status: string };
    expect(row.status).toBe('in_progress');
  });

  it('updates task position', async () => {
    const [req, params] = makePatchRequest('t-1', { position: 5 });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = testDb.prepare('SELECT position FROM tasks WHERE id = ?').get('t-1') as { position: number };
    expect(row.position).toBe(5);
  });

  it('updates multiple fields at once', async () => {
    const [req, params] = makePatchRequest('t-1', { status: 'done', assignee: 'Bob', deadline: 'Mar 1' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = testDb.prepare('SELECT status, assignee, deadline FROM tasks WHERE id = ?').get('t-1') as {
      status: string;
      assignee: string;
      deadline: string;
    };
    expect(row.status).toBe('done');
    expect(row.assignee).toBe('Bob');
    expect(row.deadline).toBe('Mar 1');
  });

  it('returns 404 for non-existent task', async () => {
    const [req, params] = makePatchRequest('nonexistent', { status: 'done' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid status', async () => {
    const [req, params] = makePatchRequest('t-1', { status: 'invalid' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(400);
  });

  it('returns 400 when no fields provided', async () => {
    const [req, params] = makePatchRequest('t-1', {});
    const res = await PATCH(req, params);

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    resetDb();
    seedData();
  });
  afterAll(() => testDb?.close());

  it('deletes an existing task', async () => {
    const [req, params] = makeDeleteRequest('t-1');
    const res = await DELETE(req, params);

    expect(res.status).toBe(200);

    const row = testDb.prepare('SELECT * FROM tasks WHERE id = ?').get('t-1');
    expect(row).toBeUndefined();
  });

  it('returns 404 for non-existent task', async () => {
    const [req, params] = makeDeleteRequest('nonexistent');
    const res = await DELETE(req, params);

    expect(res.status).toBe(404);
  });
});
