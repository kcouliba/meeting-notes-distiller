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

import { GET } from '@/app/api/assignees/route';

function seedData() {
  const report = JSON.stringify({
    summary: [],
    decisions: [],
    actions: [],
    pending: [],
    participants: ['Alice', 'Bob', 'Charlie'],
  });

  rawDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('m-1', 'Sprint Planning', 'notes', report, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

  const now = '2026-01-01T00:00:00.000Z';
  const insert = rawDb.prepare(
    `INSERT INTO tasks (id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run('t-1', 'm-1', 'Write tests', 'Alice', null, 'todo', 0, now, now);
  insert.run('t-2', 'm-1', 'Deploy app', 'Dave', null, 'in_progress', 0, now, now);
  insert.run('t-3', 'm-1', 'Fix bug', null, null, 'todo', 1, now, now);
}

describe('GET /api/assignees', () => {
  beforeEach(() => {
    resetDb();
    seedData();
  });
  afterAll(() => rawDb?.close());

  it('returns sorted, deduplicated assignees from tasks and meeting participants', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.assignees).toEqual(['Alice', 'Bob', 'Charlie', 'Dave']);
  });

  it('returns empty array when no assignees or participants exist', async () => {
    rawDb.exec('DELETE FROM tasks');
    rawDb.exec('DELETE FROM meetings');
    rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('m-empty', 'Empty', 'notes', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

    const res = await GET();
    const data = await res.json();
    expect(data.assignees).toEqual([]);
  });

  it('handles malformed report_json gracefully', async () => {
    rawDb.exec('DELETE FROM tasks');
    rawDb.exec('DELETE FROM meetings');
    rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('m-bad', 'Bad', 'notes', 'not-json', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.assignees).toEqual([]);
  });
});
