/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createTestDb } from '@/__tests__/helpers/test-db';
import { TasksRepository } from '@/lib/repositories/tasks.repository';
import * as schema from '@/lib/db/schema';

let db: BetterSQLite3Database<typeof schema>;
let rawDb: Database.Database;
let repo: TasksRepository;

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
  insert.run('t-4', 'm-2', 'Fix bug', 'Charlie', null, 'done', 0, now, now);
}

beforeEach(() => {
  if (rawDb) rawDb.close();
  const result = createTestDb();
  db = result.db;
  rawDb = result.rawDb;
  repo = new TasksRepository(db);
  seedData();
});

afterAll(() => rawDb?.close());

describe('TasksRepository', () => {
  describe('list()', () => {
    it('returns all tasks with meeting titles', () => {
      const tasks = repo.list();
      expect(tasks).toHaveLength(4);

      const t1 = tasks.find(t => t.id === 't-1');
      expect(t1).toBeDefined();
      expect(t1!.meetingTitle).toBe('Sprint Planning');
      expect(t1!.task).toBe('Write tests');
      expect(t1!.assignee).toBe('Alice');
    });

    it('filters by single status', () => {
      const tasks = repo.list('in_progress');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('t-2');
      expect(tasks[0].status).toBe('in_progress');
    });

    it('filters by multiple statuses', () => {
      const tasks = repo.list('todo,done');
      expect(tasks).toHaveLength(3);
      const statuses = new Set(tasks.map(t => t.status));
      expect(statuses).toEqual(new Set(['todo', 'done']));
    });

    it('ignores invalid status values in filter', () => {
      const tasks = repo.list('invalid,todo');
      expect(tasks).toHaveLength(2);
      expect(tasks.every(t => t.status === 'todo')).toBe(true);
    });

    it('returns all tasks when filter has only invalid values', () => {
      const tasks = repo.list('invalid');
      expect(tasks).toHaveLength(4);
    });

    it('returns empty array when no tasks exist', () => {
      rawDb.exec('DELETE FROM tasks');
      const tasks = repo.list();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('update()', () => {
    it('updates status', () => {
      const result = repo.update('t-1', { status: 'in_progress' });
      expect(result).toBe(true);

      const row = rawDb.prepare('SELECT status FROM tasks WHERE id = ?').get('t-1') as { status: string };
      expect(row.status).toBe('in_progress');
    });

    it('updates assignee and deadline', () => {
      const result = repo.update('t-1', { assignee: 'Dave', deadline: 'Mar 1' });
      expect(result).toBe(true);

      const row = rawDb.prepare('SELECT assignee, deadline FROM tasks WHERE id = ?').get('t-1') as { assignee: string; deadline: string };
      expect(row.assignee).toBe('Dave');
      expect(row.deadline).toBe('Mar 1');
    });

    it('updates multiple fields at once', () => {
      const result = repo.update('t-1', { status: 'done', position: 5, assignee: null });
      expect(result).toBe(true);

      const row = rawDb.prepare('SELECT status, position, assignee FROM tasks WHERE id = ?').get('t-1') as { status: string; position: number; assignee: string | null };
      expect(row.status).toBe('done');
      expect(row.position).toBe(5);
      expect(row.assignee).toBeNull();
    });

    it('sets updatedAt on update', () => {
      const before = rawDb.prepare('SELECT updated_at FROM tasks WHERE id = ?').get('t-1') as { updated_at: string };
      repo.update('t-1', { status: 'done' });
      const after = rawDb.prepare('SELECT updated_at FROM tasks WHERE id = ?').get('t-1') as { updated_at: string };

      expect(after.updated_at).not.toBe(before.updated_at);
    });

    it('returns false for missing ID', () => {
      expect(repo.update('nonexistent', { status: 'done' })).toBe(false);
    });
  });

  describe('delete()', () => {
    it('removes task and returns true', () => {
      expect(repo.delete('t-1')).toBe(true);

      const row = rawDb.prepare('SELECT * FROM tasks WHERE id = ?').get('t-1');
      expect(row).toBeUndefined();
    });

    it('returns false for missing ID', () => {
      expect(repo.delete('nonexistent')).toBe(false);
    });
  });

  describe('reorder()', () => {
    it('batch updates status and position in a transaction', () => {
      repo.reorder([
        { id: 't-1', status: 'in_progress', position: 0 },
        { id: 't-2', status: 'done', position: 1 },
        { id: 't-3', status: 'in_progress', position: 1 },
      ]);

      const t1 = rawDb.prepare('SELECT status, position FROM tasks WHERE id = ?').get('t-1') as { status: string; position: number };
      const t2 = rawDb.prepare('SELECT status, position FROM tasks WHERE id = ?').get('t-2') as { status: string; position: number };
      const t3 = rawDb.prepare('SELECT status, position FROM tasks WHERE id = ?').get('t-3') as { status: string; position: number };

      expect(t1).toEqual({ status: 'in_progress', position: 0 });
      expect(t2).toEqual({ status: 'done', position: 1 });
      expect(t3).toEqual({ status: 'in_progress', position: 1 });
    });

    it('sets updatedAt for all reordered tasks', () => {
      const before = rawDb.prepare('SELECT updated_at FROM tasks WHERE id = ?').get('t-1') as { updated_at: string };

      repo.reorder([{ id: 't-1', status: 'done', position: 0 }]);

      const after = rawDb.prepare('SELECT updated_at FROM tasks WHERE id = ?').get('t-1') as { updated_at: string };
      expect(after.updated_at).not.toBe(before.updated_at);
    });
  });
});
