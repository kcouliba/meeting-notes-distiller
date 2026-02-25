import { getDb } from '@/lib/db';
import { TaskStatus } from '@/types/meeting';
import { NextResponse } from 'next/server';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      setClauses.push('status = ?');
      values.push(body.status);
    }

    if (body.position !== undefined) {
      setClauses.push('position = ?');
      values.push(body.position);
    }

    if (body.assignee !== undefined) {
      setClauses.push('assignee = ?');
      values.push(body.assignee);
    }

    if (body.deadline !== undefined) {
      setClauses.push('deadline = ?');
      values.push(body.deadline);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    const db = getDb();
    const result = db.prepare(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`
    ).run(...values);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[tasks] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const db = getDb();

    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[tasks] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
