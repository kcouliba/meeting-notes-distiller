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

import { POST } from '@/app/api/tasks/archive/route';

function seedData() {
  rawDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-1', 'Meeting', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

  const now = '2026-01-01T00:00:00.000Z';
  const insert = rawDb.prepare(
    `INSERT INTO tasks (id, meeting_id, title, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run('t-1', 'm-1', 'Task 1', 'Task 1', 'Alice', null, 'todo', 0, now, now);
  insert.run('t-2', 'm-1', 'Task 2', 'Task 2', 'Bob', null, 'done', 0, now, now);
  insert.run('t-3', 'm-1', 'Task 3', 'Task 3', null, null, 'done', 1, now, now);
  insert.run('t-4', 'm-1', 'Task 4', 'Task 4', null, null, 'in_progress', 0, now, now);
}

describe('POST /api/tasks/archive', () => {
  beforeEach(() => {
    resetDb();
    seedData();
  });
  afterAll(() => rawDb?.close());

  it('archives all done tasks and returns count', async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.archived).toBe(2);

    const t2 = rawDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-2') as { status: string };
    const t3 = rawDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-3') as { status: string };
    expect(t2.status).toBe('archived');
    expect(t3.status).toBe('archived');
  });

  it('does not affect non-done tasks', async () => {
    await POST();

    const t1 = rawDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-1') as { status: string };
    const t4 = rawDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-4') as { status: string };
    expect(t1.status).toBe('todo');
    expect(t4.status).toBe('in_progress');
  });

  it('returns 0 when no done tasks exist', async () => {
    rawDb.exec("DELETE FROM tasks WHERE status = 'done'");

    const res = await POST();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.archived).toBe(0);
  });
});
