import { eq, sql, desc } from 'drizzle-orm';
import { meetings, tasks } from '@/lib/db/schema';
import type { DrizzleDb } from '@/lib/db';
import { MeetingReport, MeetingRecord, MeetingListItem } from '@/types/meeting';

export class MeetingsRepository {
  constructor(private db: DrizzleDb) {}

  create(rawNotes: string, report: MeetingReport): { id: string; title: string; createdAt: string } {
    const id = crypto.randomUUID();
    const title =
      report.summary.length > 0 && report.summary[0]
        ? report.summary[0].slice(0, 80) + (report.summary[0].length > 80 ? '...' : '')
        : 'Untitled Meeting';
    const now = new Date().toISOString();

    this.db.insert(meetings).values({
      id,
      title,
      rawNotes,
      reportJson: JSON.stringify(report),
      createdAt: now,
      updatedAt: now,
    }).run();

    if (report.actions.length > 0) {
      const maxPosResult = this.db
        .select({ maxPos: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
        .from(tasks)
        .where(eq(tasks.status, 'todo'))
        .get();
      let nextPos = (maxPosResult?.maxPos ?? -1) + 1;

      for (const action of report.actions) {
        this.db.insert(tasks).values({
          id: crypto.randomUUID(),
          meetingId: id,
          title: action.title || '',
          task: action.task,
          assignee: action.assignee || null,
          deadline: action.deadline || null,
          status: 'todo',
          position: nextPos++,
          createdAt: now,
          updatedAt: now,
        }).run();
      }
    }

    console.log(`[meetings] Saved meeting ${id}: "${title}"`);
    return { id, title, createdAt: now };
  }

  findById(id: string): MeetingRecord | null {
    const row = this.db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id))
      .get();

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      rawNotes: row.rawNotes,
      report: JSON.parse(row.reportJson) as MeetingReport,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  list(page: number, pageSize: number): { meetings: MeetingListItem[]; total: number } {
    const offset = (page - 1) * pageSize;

    const rows = this.db
      .select({
        id: meetings.id,
        title: meetings.title,
        reportJson: meetings.reportJson,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .orderBy(desc(meetings.createdAt))
      .limit(pageSize)
      .offset(offset)
      .all();

    const countResult = this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(meetings)
      .get();

    const total = countResult?.total ?? 0;

    const items: MeetingListItem[] = rows.map((row) => {
      const report = JSON.parse(row.reportJson) as MeetingReport;
      return {
        id: row.id,
        title: row.title,
        createdAt: row.createdAt,
        participantCount: report.participants.length,
        actionCount: report.actions.length,
      };
    });

    return { meetings: items, total };
  }

  delete(id: string): boolean {
    const existing = this.db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.id, id))
      .get();

    if (!existing) return false;

    this.db.delete(meetings).where(eq(meetings.id, id)).run();
    console.log(`[meetings] Deleted meeting ${id}`);
    return true;
  }
}
