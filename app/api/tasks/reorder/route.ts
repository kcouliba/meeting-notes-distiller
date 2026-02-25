import { getDb } from '@/lib/db';
import { TaskStatus } from '@/types/meeting';
import { NextResponse } from 'next/server';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

interface ReorderUpdate {
  id: string;
  status: TaskStatus;
  position: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { updates } = body as { updates: ReorderUpdate[] };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    for (const update of updates) {
      if (!update.id || !VALID_STATUSES.includes(update.status) || typeof update.position !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have id, valid status, and numeric position' },
          { status: 400 }
        );
      }
    }

    const db = getDb();
    const now = new Date().toISOString();

    const stmt = db.prepare(
      `UPDATE tasks SET status = ?, position = ?, updated_at = ? WHERE id = ?`
    );

    const transaction = db.transaction((items: ReorderUpdate[]) => {
      for (const item of items) {
        stmt.run(item.status, item.position, now, item.id);
      }
    });

    transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[tasks] reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
