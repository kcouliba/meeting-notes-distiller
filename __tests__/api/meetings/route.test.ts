/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { MeetingReport } from '@/types/meeting';
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

// Import after mock setup
import { POST, GET } from '@/app/api/meetings/route';

const sampleReport: MeetingReport = {
  summary: ['Discussed Q1 roadmap and approved key initiatives'],
  decisions: ['Adopt the new CI/CD pipeline'],
  actions: [{ title: 'Prepare migration', task: 'Prepare migration plan', assignee: 'Bob', deadline: 'Jan 30' }],
  pending: ['Hire contractor?'],
  participants: ['Alice', 'Bob'],
};

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(params?: Record<string, string>): Request {
  const url = new URL('http://localhost:3000/api/meetings');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString(), { method: 'GET' });
}

describe('POST /api/meetings', () => {
  beforeEach(() => resetDb());
  afterAll(() => rawDb?.close());

  it('creates a meeting and returns 201', async () => {
    const req = makePostRequest({ rawNotes: 'Some notes', report: sampleReport });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.id).toBeDefined();
    expect(body.title).toBe('Discussed Q1 roadmap and approved key initiatives');
    expect(body.createdAt).toBeDefined();
  });

  it('generates title from first summary point', async () => {
    const req = makePostRequest({ rawNotes: 'notes', report: sampleReport });
    const res = await POST(req);
    const body = await res.json();

    expect(body.title).toBe(sampleReport.summary[0]);
  });

  it('truncates long titles to 80 chars with ellipsis', async () => {
    const longSummary = 'A'.repeat(100);
    const report = { ...sampleReport, summary: [longSummary] };
    const req = makePostRequest({ rawNotes: 'notes', report });
    const res = await POST(req);
    const body = await res.json();

    expect(body.title).toBe('A'.repeat(80) + '...');
  });

  it('defaults to "Untitled Meeting" when summary is empty', async () => {
    const report = { ...sampleReport, summary: [] };
    const req = makePostRequest({ rawNotes: 'notes', report });
    const res = await POST(req);
    const body = await res.json();

    expect(body.title).toBe('Untitled Meeting');
  });

  it('returns 400 when rawNotes is missing', async () => {
    const req = makePostRequest({ report: sampleReport });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('rawNotes and report are required');
  });

  it('returns 400 when rawNotes is empty string', async () => {
    const req = makePostRequest({ rawNotes: '   ', report: sampleReport });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when report is invalid', async () => {
    const req = makePostRequest({ rawNotes: 'notes', report: { summary: 'not an array' } });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid report structure');
  });

  it('returns 400 when report is missing fields', async () => {
    const req = makePostRequest({ rawNotes: 'notes', report: { summary: [] } });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('persists meeting in the database', async () => {
    const req = makePostRequest({ rawNotes: 'My notes', report: sampleReport });
    const res = await POST(req);
    const body = await res.json();

    const row = rawDb.prepare('SELECT * FROM meetings WHERE id = ?').get(body.id) as {
      id: string;
      raw_notes: string;
      report_json: string;
    };

    expect(row).toBeDefined();
    expect(row.raw_notes).toBe('My notes');
    expect(JSON.parse(row.report_json)).toEqual(sampleReport);
  });

  it('auto-creates tasks from action items', async () => {
    const req = makePostRequest({ rawNotes: 'notes', report: sampleReport });
    const res = await POST(req);
    const body = await res.json();

    const tasks = rawDb.prepare('SELECT * FROM tasks WHERE meeting_id = ?').all(body.id) as {
      id: string;
      task: string;
      assignee: string | null;
      deadline: string | null;
      status: string;
    }[];

    expect(tasks).toHaveLength(1);
    expect(tasks[0].task).toBe('Prepare migration plan');
    expect(tasks[0].assignee).toBe('Bob');
    expect(tasks[0].deadline).toBe('Jan 30');
    expect(tasks[0].status).toBe('todo');
  });

  it('creates no tasks when actions array is empty', async () => {
    const reportNoActions = { ...sampleReport, actions: [] };
    const req = makePostRequest({ rawNotes: 'notes', report: reportNoActions });
    const res = await POST(req);
    const body = await res.json();

    const tasks = rawDb.prepare('SELECT * FROM tasks WHERE meeting_id = ?').all(body.id) as unknown[];
    expect(tasks).toHaveLength(0);
  });
});

describe('GET /api/meetings', () => {
  beforeEach(() => {
    resetDb();
    // Seed 3 meetings
    const insert = rawDb.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    insert.run('id-1', 'First', 'notes1', JSON.stringify(sampleReport), '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    insert.run('id-2', 'Second', 'notes2', JSON.stringify(sampleReport), '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
    insert.run('id-3', 'Third', 'notes3', JSON.stringify(sampleReport), '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z');
  });
  afterAll(() => rawDb?.close());

  it('returns paginated list of meetings', async () => {
    const req = makeGetRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meetings).toHaveLength(3);
    expect(body.total).toBe(3);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
  });

  it('returns meetings sorted by created_at descending', async () => {
    const req = makeGetRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(body.meetings[0].id).toBe('id-3');
    expect(body.meetings[1].id).toBe('id-2');
    expect(body.meetings[2].id).toBe('id-1');
  });

  it('includes participantCount and actionCount', async () => {
    const req = makeGetRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(body.meetings[0].participantCount).toBe(2);
    expect(body.meetings[0].actionCount).toBe(1);
  });

  it('respects page and pageSize params', async () => {
    const req = makeGetRequest({ page: '2', pageSize: '1' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.meetings).toHaveLength(1);
    expect(body.meetings[0].id).toBe('id-2');
    expect(body.total).toBe(3);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(1);
  });

  it('clamps pageSize to max 100', async () => {
    const req = makeGetRequest({ pageSize: '999' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.pageSize).toBe(100);
  });

  it('defaults invalid page to 1', async () => {
    const req = makeGetRequest({ page: 'abc' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.page).toBe(1);
  });

  it('returns empty list when no meetings exist', async () => {
    rawDb.exec('DELETE FROM meetings');

    const req = makeGetRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(body.meetings).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});
