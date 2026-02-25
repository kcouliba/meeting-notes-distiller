import { eq, inArray } from 'drizzle-orm';
import { meetings, tasks } from '@/lib/db/schema';
import type { DrizzleDb } from '@/lib/db';
import { TaskRecord, TaskStatus } from '@/types/meeting';

export interface TaskUpdateFields {
  status?: TaskStatus;
  position?: number;
  assignee?: string | null;
  deadline?: string | null;
}

export interface ReorderUpdate {
  id: string;
  status: TaskStatus;
  position: number;
}

export class TasksRepository {
  constructor(private db: DrizzleDb) {}

  list(statusFilter?: string | null): TaskRecord[] {
    const query = this.db
      .select({
        id: tasks.id,
        meetingId: tasks.meetingId,
        meetingTitle: meetings.title,
        task: tasks.task,
        assignee: tasks.assignee,
        deadline: tasks.deadline,
        status: tasks.status,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .innerJoin(meetings, eq(tasks.meetingId, meetings.id));

    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

    if (statusFilter) {
      const statuses = statusFilter
        .split(',')
        .filter((s): s is TaskStatus => validStatuses.includes(s as TaskStatus));

      if (statuses.length > 0) {
        const rows = query
          .where(inArray(tasks.status, statuses))
          .orderBy(tasks.status, tasks.position)
          .all();
        return rows.map(mapTaskRow);
      }
    }

    const rows = query.orderBy(tasks.status, tasks.position).all();
    return rows.map(mapTaskRow);
  }

  update(id: string, fields: TaskUpdateFields): boolean {
    const setClauses: Record<string, unknown> = {};

    if (fields.status !== undefined) {
      setClauses.status = fields.status;
    }
    if (fields.position !== undefined) {
      setClauses.position = fields.position;
    }
    if (fields.assignee !== undefined) {
      setClauses.assignee = fields.assignee;
    }
    if (fields.deadline !== undefined) {
      setClauses.deadline = fields.deadline;
    }

    setClauses.updatedAt = new Date().toISOString();

    const result = this.db
      .update(tasks)
      .set(setClauses)
      .where(eq(tasks.id, id))
      .run();

    return result.changes > 0;
  }

  delete(id: string): boolean {
    const result = this.db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .run();

    return result.changes > 0;
  }

  reorder(updates: ReorderUpdate[]): void {
    const now = new Date().toISOString();

    this.db.transaction((tx) => {
      for (const item of updates) {
        tx.update(tasks)
          .set({ status: item.status, position: item.position, updatedAt: now })
          .where(eq(tasks.id, item.id))
          .run();
      }
    });
  }
}

function mapTaskRow(row: {
  id: string;
  meetingId: string;
  meetingTitle: string;
  task: string;
  assignee: string | null;
  deadline: string | null;
  status: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}): TaskRecord {
  return {
    id: row.id,
    meetingId: row.meetingId,
    meetingTitle: row.meetingTitle,
    task: row.task,
    assignee: row.assignee,
    deadline: row.deadline,
    status: row.status as TaskStatus,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
