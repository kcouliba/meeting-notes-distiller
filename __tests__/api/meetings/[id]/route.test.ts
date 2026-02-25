/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { MeetingReport } from '@/types/meeting';

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
    CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);
  `);
}

jest.mock('@/lib/db', () => ({
  getDb: () => testDb,
}));

import { GET, DELETE } from '@/app/api/meetings/[id]/route';

const sampleReport: MeetingReport = {
  summary: ['Discussed Q1 roadmap'],
  decisions: ['Adopt CI/CD pipeline'],
  actions: [{ task: 'Prepare plan', assignee: 'Bob', deadline: 'Jan 30' }],
  pending: ['Hire contractor?'],
  participants: ['Alice', 'Bob'],
};

function seedMeeting(id: string, title: string = 'Test Meeting') {
  testDb.prepare(
    `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, title, 'raw notes here', JSON.stringify(sampleReport), '2026-02-24T10:00:00.000Z', '2026-02-24T10:00:00.000Z');
}

function makeRequest(id: string, method: string = 'GET'): [Request, { params: { id: string } }] {
  const req = new Request(`http://localhost:3000/api/meetings/${id}`, { method });
  return [req, { params: { id } }];
}

describe('GET /api/meetings/[id]', () => {
  beforeEach(() => resetDb());
  afterAll(() => testDb?.close());

  it('returns a full meeting record', async () => {
    seedMeeting('meet-1', 'My Meeting');
    const [req, context] = makeRequest('meet-1');
    const res = await GET(req, context);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('meet-1');
    expect(body.title).toBe('My Meeting');
    expect(body.rawNotes).toBe('raw notes here');
    expect(body.report).toEqual(sampleReport);
    expect(body.createdAt).toBe('2026-02-24T10:00:00.000Z');
    expect(body.updatedAt).toBe('2026-02-24T10:00:00.000Z');
  });

  it('returns 404 for non-existent ID', async () => {
    const [req, context] = makeRequest('nonexistent');
    const res = await GET(req, context);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Meeting not found');
  });

  it('correctly parses report_json into report object', async () => {
    seedMeeting('meet-2');
    const [req, context] = makeRequest('meet-2');
    const res = await GET(req, context);
    const body = await res.json();

    expect(body.report.summary).toEqual(sampleReport.summary);
    expect(body.report.actions).toEqual(sampleReport.actions);
    expect(body.report.participants).toEqual(sampleReport.participants);
  });
});

describe('DELETE /api/meetings/[id]', () => {
  beforeEach(() => resetDb());
  afterAll(() => testDb?.close());

  it('deletes a meeting and returns success', async () => {
    seedMeeting('del-1');
    const [req, context] = makeRequest('del-1', 'DELETE');
    const res = await DELETE(req, context);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.deleted).toBe(true);
  });

  it('actually removes the meeting from the database', async () => {
    seedMeeting('del-2');
    const [req, context] = makeRequest('del-2', 'DELETE');
    await DELETE(req, context);

    const row = testDb.prepare('SELECT id FROM meetings WHERE id = ?').get('del-2');
    expect(row).toBeUndefined();
  });

  it('returns 404 for non-existent ID', async () => {
    const [req, context] = makeRequest('nonexistent', 'DELETE');
    const res = await DELETE(req, context);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Meeting not found');
  });

  it('deleted meeting returns 404 on subsequent GET', async () => {
    seedMeeting('del-3');
    const [delReq, delCtx] = makeRequest('del-3', 'DELETE');
    await DELETE(delReq, delCtx);

    const [getReq, getCtx] = makeRequest('del-3');
    const res = await GET(getReq, getCtx);

    expect(res.status).toBe(404);
  });
});
