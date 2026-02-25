import { eq, inArray, isNotNull, and, lte } from 'drizzle-orm';
import { meetings, tasks } from '@/lib/db/schema';
import type { DrizzleDb } from '@/lib/db';
import { TaskRecord, TaskStatus, MeetingReport } from '@/types/meeting';

export interface TaskUpdateFields {
  status?: TaskStatus;
  position?: number;
  title?: string;
  assignee?: string | null;
  deadline?: string | null;
  task?: string;
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
        title: tasks.title,
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

    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done', 'archived'];

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
    if (fields.title !== undefined) {
      setClauses.title = fields.title;
    }
    if (fields.task !== undefined) {
      setClauses.task = fields.task;
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

  archiveStale(daysThreshold = 7): number {
    const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const result = this.db
      .update(tasks)
      .set({ status: 'archived', updatedAt: now })
      .where(and(eq(tasks.status, 'done'), lte(tasks.updatedAt, cutoff)))
      .run();

    return result.changes;
  }

  archiveDone(): number {
    const now = new Date().toISOString();

    const result = this.db
      .update(tasks)
      .set({ status: 'archived', updatedAt: now })
      .where(eq(tasks.status, 'done'))
      .run();

    return result.changes;
  }

  listAssignees(): string[] {
    // Get distinct non-null assignees from tasks
    const taskAssignees = this.db
      .selectDistinct({ assignee: tasks.assignee })
      .from(tasks)
      .where(isNotNull(tasks.assignee))
      .all()
      .map((row) => row.assignee!)
      .filter((a) => a.trim() !== '');

    // Extract participants from meetings.report_json
    const meetingRows = this.db
      .select({ reportJson: meetings.reportJson })
      .from(meetings)
      .all();

    const participantSet = new Set<string>(taskAssignees);

    for (const row of meetingRows) {
      try {
        const report: MeetingReport = JSON.parse(row.reportJson);
        if (Array.isArray(report.participants)) {
          for (const p of report.participants) {
            if (typeof p === 'string' && p.trim() !== '') {
              participantSet.add(p.trim());
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    return Array.from(participantSet).sort((a, b) => a.localeCompare(b));
  }
}

function mapTaskRow(row: {
  id: string;
  meetingId: string;
  meetingTitle: string;
  title: string;
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
    title: row.title,
    task: row.task,
    assignee: row.assignee,
    deadline: row.deadline,
    status: row.status as TaskStatus,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
