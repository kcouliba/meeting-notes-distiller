import { getRepositories } from '@/lib/repositories';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const archived = getRepositories().tasks.archiveDone();

    return NextResponse.json({ success: true, archived });
  } catch (error) {
    console.error('[tasks] archive error:', error);
    return NextResponse.json({ error: 'Failed to archive tasks' }, { status: 500 });
  }
}
