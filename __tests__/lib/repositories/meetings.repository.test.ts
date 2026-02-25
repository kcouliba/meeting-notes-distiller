/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createTestDb } from '@/__tests__/helpers/test-db';
import { MeetingsRepository } from '@/lib/repositories/meetings.repository';
import { MeetingReport } from '@/types/meeting';
import * as schema from '@/lib/db/schema';

let db: BetterSQLite3Database<typeof schema>;
let rawDb: Database.Database;
let repo: MeetingsRepository;

function makeReport(overrides: Partial<MeetingReport> = {}): MeetingReport {
  return {
    summary: ['Discussed the Q1 roadmap and assigned tasks'],
    decisions: ['Adopt TypeScript for all new services'],
    actions: [
      { task: 'Write migration guide', assignee: 'Alice', deadline: 'Feb 1' },
      { task: 'Update CI pipeline', assignee: 'Bob', deadline: null },
    ],
    participants: ['Alice', 'Bob', 'Charlie'],
    pending: ['Budget approval'],
    ...overrides,
  };
}

beforeEach(() => {
  if (rawDb) rawDb.close();
  const result = createTestDb();
  db = result.db;
  rawDb = result.rawDb;
  repo = new MeetingsRepository(db);
});

afterAll(() => rawDb?.close());

describe('MeetingsRepository', () => {
  describe('create()', () => {
    it('inserts a meeting and auto-creates tasks', () => {
      const report = makeReport();
      const result = repo.create('raw meeting notes', report);

      expect(result.id).toBeDefined();
      expect(result.title).toBe('Discussed the Q1 roadmap and assigned tasks');
      expect(result.createdAt).toBeDefined();

      // Verify meeting row
      const meeting = rawDb.prepare('SELECT * FROM meetings WHERE id = ?').get(result.id) as Record<string, unknown>;
      expect(meeting).toBeDefined();
      expect(meeting.raw_notes).toBe('raw meeting notes');

      // Verify tasks were auto-created
      const tasks = rawDb.prepare('SELECT * FROM tasks WHERE meeting_id = ? ORDER BY position').all(result.id) as Record<string, unknown>[];
      expect(tasks).toHaveLength(2);
      expect(tasks[0].task).toBe('Write migration guide');
      expect(tasks[0].assignee).toBe('Alice');
      expect(tasks[0].status).toBe('todo');
      expect(tasks[1].task).toBe('Update CI pipeline');
      expect(tasks[1].assignee).toBe('Bob');
    });

    it('generates title from first summary line, truncated at 80 chars', () => {
      const longSummary = 'A'.repeat(100);
      const report = makeReport({ summary: [longSummary] });
      const result = repo.create('notes', report);

      expect(result.title).toBe('A'.repeat(80) + '...');
    });

    it('uses "Untitled Meeting" when summary is empty', () => {
      const report = makeReport({ summary: [] });
      const result = repo.create('notes', report);

      expect(result.title).toBe('Untitled Meeting');
    });

    it('creates meeting with no tasks when actions is empty', () => {
      const report = makeReport({ actions: [] });
      const result = repo.create('notes', report);

      const tasks = rawDb.prepare('SELECT * FROM tasks WHERE meeting_id = ?').all(result.id);
      expect(tasks).toHaveLength(0);
    });

    it('assigns sequential positions to tasks', () => {
      const report = makeReport();
      const result = repo.create('notes', report);

      const tasks = rawDb.prepare('SELECT position FROM tasks WHERE meeting_id = ? ORDER BY position').all(result.id) as { position: number }[];
      expect(tasks[0].position).toBe(0);
      expect(tasks[1].position).toBe(1);
    });

    it('continues position numbering from existing tasks', () => {
      // Create first meeting with 2 tasks (positions 0, 1)
      repo.create('first', makeReport());

      // Create second meeting — tasks should start at position 2
      const result = repo.create('second', makeReport());
      const tasks = rawDb.prepare('SELECT position FROM tasks WHERE meeting_id = ? ORDER BY position').all(result.id) as { position: number }[];
      expect(tasks[0].position).toBe(2);
      expect(tasks[1].position).toBe(3);
    });
  });

  describe('findById()', () => {
    it('returns full meeting record', () => {
      const report = makeReport();
      const { id } = repo.create('notes', report);

      const found = repo.findById(id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(id);
      expect(found!.rawNotes).toBe('notes');
      expect(found!.report.participants).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(found!.report.actions).toHaveLength(2);
    });

    it('returns null for missing ID', () => {
      expect(repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('list()', () => {
    it('returns paginated results ordered by created_at DESC', () => {
      // Insert meetings with explicit timestamps so ordering is deterministic
      for (let i = 1; i <= 5; i++) {
        const ts = `2026-01-0${i}T00:00:00.000Z`;
        rawDb.prepare(
          `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(`m-${i}`, `Meeting ${i}`, 'notes', JSON.stringify(makeReport()), ts, ts);
      }

      const page1 = repo.list(1, 3);
      expect(page1.total).toBe(5);
      expect(page1.meetings).toHaveLength(3);
      // Most recent first
      expect(page1.meetings[0].title).toBe('Meeting 5');
      expect(page1.meetings[2].title).toBe('Meeting 3');

      const page2 = repo.list(2, 3);
      expect(page2.meetings).toHaveLength(2);
      expect(page2.meetings[0].title).toBe('Meeting 2');
    });

    it('includes participant and action counts', () => {
      rawDb.prepare(
        `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('m-1', 'Test', 'notes', JSON.stringify(makeReport()), '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

      const { meetings } = repo.list(1, 10);
      expect(meetings[0].participantCount).toBe(3);
      expect(meetings[0].actionCount).toBe(2);
    });

    it('returns empty list when no meetings exist', () => {
      const { meetings, total } = repo.list(1, 10);
      expect(meetings).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  describe('delete()', () => {
    it('removes meeting and returns true', () => {
      const { id } = repo.create('notes', makeReport());
      expect(repo.delete(id)).toBe(true);

      const row = rawDb.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
      expect(row).toBeUndefined();
    });

    it('cascade deletes associated tasks', () => {
      const { id } = repo.create('notes', makeReport());
      const tasksBefore = rawDb.prepare('SELECT * FROM tasks WHERE meeting_id = ?').all(id);
      expect(tasksBefore.length).toBeGreaterThan(0);

      repo.delete(id);

      const tasksAfter = rawDb.prepare('SELECT * FROM tasks WHERE meeting_id = ?').all(id);
      expect(tasksAfter).toHaveLength(0);
    });

    it('returns false for missing ID', () => {
      expect(repo.delete('nonexistent')).toBe(false);
    });
  });
});
