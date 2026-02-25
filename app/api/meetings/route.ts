import { getDb } from '@/lib/db';
import { MeetingReport, MeetingListItem, MeetingListResponse, SaveMeetingResponse } from '@/types/meeting';
import { NextResponse } from 'next/server';

function isValidReport(report: unknown): report is MeetingReport {
  if (!report || typeof report !== 'object') return false;
  const r = report as Record<string, unknown>;
  return (
    Array.isArray(r.summary) &&
    Array.isArray(r.decisions) &&
    Array.isArray(r.actions) &&
    Array.isArray(r.pending) &&
    Array.isArray(r.participants)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawNotes, report } = body;

    if (!rawNotes || typeof rawNotes !== 'string' || rawNotes.trim().length === 0) {
      return NextResponse.json(
        { error: 'rawNotes and report are required' },
        { status: 400 }
      );
    }

    if (!isValidReport(report)) {
      return NextResponse.json(
        { error: 'Invalid report structure' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const title =
      report.summary.length > 0 && report.summary[0]
        ? report.summary[0].slice(0, 80) + (report.summary[0].length > 80 ? '...' : '')
        : 'Untitled Meeting';
    const now = new Date().toISOString();

    const db = getDb();
    db.prepare(
      `INSERT INTO meetings (id, title, raw_notes, report_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, title, rawNotes, JSON.stringify(report), now, now);

    // Auto-populate tasks from action items
    if (report.actions.length > 0) {
      const maxPosRow = db.prepare(
        `SELECT COALESCE(MAX(position), -1) AS max_pos FROM tasks WHERE status = 'todo'`
      ).get() as { max_pos: number };
      let nextPos = maxPosRow.max_pos + 1;

      const insertTask = db.prepare(
        `INSERT INTO tasks (id, meeting_id, task, assignee, deadline, status, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'todo', ?, ?, ?)`
      );

      for (const action of report.actions) {
        insertTask.run(
          crypto.randomUUID(),
          id,
          action.task,
          action.assignee || null,
          action.deadline || null,
          nextPos++,
          now,
          now
        );
      }
    }

    console.log(`[meetings] Saved meeting ${id}: "${title}"`);

    const response: SaveMeetingResponse = { id, title, createdAt: now };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[meetings] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save meeting' },
      { status: 500 }
    );
  }
}

interface MeetingRow {
  id: string;
  title: string;
  report_json: string;
  created_at: string;
}

interface CountRow {
  total: number;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
    const offset = (page - 1) * pageSize;

    const db = getDb();

    const rows = db.prepare(
      `SELECT id, title, report_json, created_at
       FROM meetings
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).all(pageSize, offset) as MeetingRow[];

    const { total } = db.prepare(
      `SELECT COUNT(*) as total FROM meetings`
    ).get() as CountRow;

    const meetings: MeetingListItem[] = rows.map((row) => {
      const report = JSON.parse(row.report_json) as MeetingReport;
      return {
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        participantCount: report.participants.length,
        actionCount: report.actions.length,
      };
    });

    const response: MeetingListResponse = { meetings, total, page, pageSize };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[meetings] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve meetings' },
      { status: 500 }
    );
  }
}
