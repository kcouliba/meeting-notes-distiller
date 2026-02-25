import { getDb } from '@/lib/db';
import { MeetingReport, MeetingRecord } from '@/types/meeting';
import { NextResponse } from 'next/server';

interface MeetingRow {
  id: string;
  title: string;
  raw_notes: string;
  report_json: string;
  created_at: string;
  updated_at: string;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();

    const row = db.prepare(
      `SELECT * FROM meetings WHERE id = ?`
    ).get(params.id) as MeetingRow | undefined;

    if (!row) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    const record: MeetingRecord = {
      id: row.id,
      title: row.title,
      rawNotes: row.raw_notes,
      report: JSON.parse(row.report_json) as MeetingReport,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[meetings] GET ${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve meeting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();

    const existing = db.prepare(
      `SELECT id FROM meetings WHERE id = ?`
    ).get(params.id) as { id: string } | undefined;

    if (!existing) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    db.prepare(`DELETE FROM meetings WHERE id = ?`).run(params.id);

    console.log(`[meetings] Deleted meeting ${params.id}`);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(`[meetings] DELETE ${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
