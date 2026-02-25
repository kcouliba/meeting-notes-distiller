/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createTestDb } from '@/__tests__/helpers/test-db';
import { MeetingsRepository } from '@/lib/repositories/meetings.repository';
import { TasksRepository } from '@/lib/repositories/tasks.repository';
import * as schema from '@/lib/db/schema';

let testDb: BetterSQLite3Database<typeof schema>;
let rawDb: Database.Database;

function resetDb() {
  if (rawDb) rawDb.close();
  const result = createTestDb();
  testDb = result.db;
  rawDb = result.rawDb;
}

jest.mock('@/lib/repositories', () => ({
  getRepositories: () => ({
    meetings: new MeetingsRepository(testDb),
    tasks: new TasksRepository(testDb),
  }),
}));

import { PATCH, DELETE } from '@/app/api/tasks/[id]/route';

function seedData() {
  rawDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-1', 'Meeting', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

  const now = '2026-01-01T00:00:00.000Z';
  rawDb.prepare(
    `INSERT INTO tasks (id, meeting_id, title, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('t-1', 'm-1', 'Write tests', 'Write tests', 'Alice', 'Feb 1', 'todo', 0, now, now);
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
  afterAll(() => rawDb?.close());

  it('updates task status', async () => {
    const [req, params] = makePatchRequest('t-1', { status: 'in_progress' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-1') as { status: string };
    expect(row.status).toBe('in_progress');
  });

  it('updates task position', async () => {
    const [req, params] = makePatchRequest('t-1', { position: 5 });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT position FROM tasks WHERE id = ?').get('t-1') as { position: number };
    expect(row.position).toBe(5);
  });

  it('updates multiple fields at once', async () => {
    const [req, params] = makePatchRequest('t-1', { status: 'done', assignee: 'Bob', deadline: 'Mar 1' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT status, assignee, deadline FROM tasks WHERE id = ?').get('t-1') as {
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

  it('accepts archived status', async () => {
    const [req, params] = makePatchRequest('t-1', { status: 'archived' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-1') as { status: string };
    expect(row.status).toBe('archived');
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

  it('updates task title', async () => {
    const [req, params] = makePatchRequest('t-1', { title: 'New title' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT title FROM tasks WHERE id = ?').get('t-1') as { title: string };
    expect(row.title).toBe('New title');
  });

  it('trims whitespace from title', async () => {
    const [req, params] = makePatchRequest('t-1', { title: '  Trimmed title  ' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT title FROM tasks WHERE id = ?').get('t-1') as { title: string };
    expect(row.title).toBe('Trimmed title');
  });

  it('updates task description', async () => {
    const [req, params] = makePatchRequest('t-1', { task: 'Updated description' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT task FROM tasks WHERE id = ?').get('t-1') as { task: string };
    expect(row.task).toBe('Updated description');
  });

  it('trims whitespace from task description', async () => {
    const [req, params] = makePatchRequest('t-1', { task: '  Trimmed text  ' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT task FROM tasks WHERE id = ?').get('t-1') as { task: string };
    expect(row.task).toBe('Trimmed text');
  });

  it('returns 400 for empty task description', async () => {
    const [req, params] = makePatchRequest('t-1', { task: '   ' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Task description cannot be empty');
  });
});

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    resetDb();
    seedData();
  });
  afterAll(() => rawDb?.close());

  it('deletes an existing task', async () => {
    const [req, params] = makeDeleteRequest('t-1');
    const res = await DELETE(req, params);

    expect(res.status).toBe(200);

    const row = rawDb.prepare('SELECT * FROM tasks WHERE id = ?').get('t-1');
    expect(row).toBeUndefined();
  });

  it('returns 404 for non-existent task', async () => {
    const [req, params] = makeDeleteRequest('nonexistent');
    const res = await DELETE(req, params);

    expect(res.status).toBe(404);
  });
});
