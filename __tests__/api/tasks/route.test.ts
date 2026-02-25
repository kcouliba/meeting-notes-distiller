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

import { GET } from '@/app/api/tasks/route';

function seedData() {
  rawDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-1', 'Sprint Planning', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

  rawDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-2', 'Standup', 'notes', '{}', '2026-01-02T00:00:00.000Z', '2026-01-02T00:00:00.000Z');

  const now = '2026-01-01T00:00:00.000Z';
  const insert = rawDb.prepare(
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
  afterAll(() => rawDb?.close());

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
    rawDb.exec('DELETE FROM tasks');

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(body.tasks).toHaveLength(0);
  });
});
