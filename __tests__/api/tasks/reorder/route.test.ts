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

import { POST } from '@/app/api/tasks/reorder/route';

function seedData() {
  rawDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-1', 'Sprint Planning', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

  const now = '2026-01-01T00:00:00.000Z';
  const insert = rawDb.prepare(
    `INSERT INTO tasks (id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run('t-1', 'm-1', 'Write tests', 'Alice', null, 'todo', 0, now, now);
  insert.run('t-2', 'm-1', 'Deploy app', 'Bob', null, 'todo', 1, now, now);
  insert.run('t-3', 'm-1', 'Review PR', null, null, 'in_progress', 0, now, now);
}

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/tasks/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/tasks/reorder', () => {
  beforeEach(() => {
    resetDb();
    seedData();
  });
  afterAll(() => rawDb?.close());

  it('reorders tasks successfully', async () => {
    const res = await POST(makePostRequest({
      updates: [
        { id: 't-1', status: 'in_progress', position: 1 },
        { id: 't-2', status: 'done', position: 0 },
        { id: 't-3', status: 'todo', position: 0 },
      ],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('verifies database state after reorder', async () => {
    await POST(makePostRequest({
      updates: [
        { id: 't-1', status: 'in_progress', position: 1 },
        { id: 't-2', status: 'done', position: 0 },
      ],
    }));

    const t1 = rawDb.prepare('SELECT status, position FROM tasks WHERE id = ?').get('t-1') as { status: string; position: number };
    const t2 = rawDb.prepare('SELECT status, position FROM tasks WHERE id = ?').get('t-2') as { status: string; position: number };

    expect(t1).toEqual({ status: 'in_progress', position: 1 });
    expect(t2).toEqual({ status: 'done', position: 0 });
  });

  it('returns 400 for empty updates array', async () => {
    const res = await POST(makePostRequest({ updates: [] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('updates array is required');
  });

  it('returns 400 for missing updates field', async () => {
    const res = await POST(makePostRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('updates array is required');
  });

  it('returns 400 for invalid status', async () => {
    const res = await POST(makePostRequest({
      updates: [{ id: 't-1', status: 'invalid_status', position: 0 }],
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('valid status');
  });

  it('returns 400 for missing position', async () => {
    const res = await POST(makePostRequest({
      updates: [{ id: 't-1', status: 'todo' }],
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('numeric position');
  });

  it('returns 400 for missing id', async () => {
    const res = await POST(makePostRequest({
      updates: [{ status: 'todo', position: 0 }],
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
  });
});
