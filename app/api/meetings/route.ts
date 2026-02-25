import { getRepositories } from '@/lib/repositories';
import { MeetingReport, MeetingListResponse, SaveMeetingResponse } from '@/types/meeting';
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

    const result = getRepositories().meetings.create(rawNotes, report);

    const response: SaveMeetingResponse = result;
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[meetings] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save meeting' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const result = getRepositories().meetings.list(page, pageSize);

    const response: MeetingListResponse = { ...result, page, pageSize };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[meetings] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve meetings' },
      { status: 500 }
    );
  }
}
