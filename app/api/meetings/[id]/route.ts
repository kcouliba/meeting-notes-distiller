import { getRepositories } from '@/lib/repositories';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const record = getRepositories().meetings.findById(params.id);

    if (!record) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[meetings] GET ${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve meeting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = getRepositories().meetings.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(`[meetings] DELETE ${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
