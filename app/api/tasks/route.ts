import { getDb } from '@/lib/db';
import { TaskRecord, TaskListResponse, TaskStatus } from '@/types/meeting';
import { NextResponse } from 'next/server';

interface TaskRow {
  id: string;
  meeting_id: string;
  meeting_title: string;
  task: string;
  assignee: string | null;
  deadline: string | null;
  status: string;
  position: number;
  created_at: string;
  updated_at: string;
}

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const db = getDb();

    let query = `
      SELECT t.id, t.meeting_id, m.title AS meeting_title, t.task, t.assignee,
             t.deadline, t.status, t.position, t.created_at, t.updated_at
      FROM tasks t
      JOIN meetings m ON t.meeting_id = m.id
    `;
    const params: string[] = [];

    if (statusFilter) {
      const statuses = statusFilter.split(',').filter((s) => VALID_STATUSES.includes(s as TaskStatus));
      if (statuses.length > 0) {
        const placeholders = statuses.map(() => '?').join(',');
        query += ` WHERE t.status IN (${placeholders})`;
        params.push(...statuses);
      }
    }

    query += ` ORDER BY t.status, t.position`;

    const rows = db.prepare(query).all(...params) as TaskRow[];

    const tasks: TaskRecord[] = rows.map((row) => ({
      id: row.id,
      meetingId: row.meeting_id,
      meetingTitle: row.meeting_title,
      task: row.task,
      assignee: row.assignee,
      deadline: row.deadline,
      status: row.status as TaskStatus,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const response: TaskListResponse = { tasks };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[tasks] GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve tasks' }, { status: 500 });
  }
}
