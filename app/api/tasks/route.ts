import { getRepositories } from '@/lib/repositories';
import { TaskListResponse } from '@/types/meeting';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const repos = getRepositories();
    repos.tasks.archiveStale();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const tasks = repos.tasks.list(statusFilter);

    const response: TaskListResponse = { tasks };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[tasks] GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve tasks' }, { status: 500 });
  }
}
