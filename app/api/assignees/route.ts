import { getRepositories } from '@/lib/repositories';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const assignees = getRepositories().tasks.listAssignees();
    return NextResponse.json({ assignees });
  } catch (error) {
    console.error('[assignees] GET error:', error);
    return NextResponse.json({ error: 'Failed to list assignees' }, { status: 500 });
  }
}
