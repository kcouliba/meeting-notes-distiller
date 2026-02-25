import { getAIProvider } from '@/lib/ai';
import { MeetingReport } from '@/types/meeting';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notes } = body;

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Notes are required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (notes.length > 50000) {
      return NextResponse.json(
        { error: 'Notes must not exceed 50,000 characters' },
        { status: 400 }
      );
    }

    const provider = getAIProvider();
    console.log(`[distill] Received ${notes.length} chars of notes (provider: ${provider.name})`);

    const startTime = Date.now();
    const text = await provider.generate(notes.trim());
    const elapsed = Date.now() - startTime;

    console.log(`[distill] ${provider.name} responded in ${elapsed}ms (${text.length} chars)`);

    if (!text) {
      console.error(`[distill] Empty response from ${provider.name}`);
      return NextResponse.json(
        { error: 'No response received from AI' },
        { status: 500 }
      );
    }

    let report: MeetingReport;
    try {
      report = JSON.parse(text);
    } catch {
      console.error('[distill] Failed to parse JSON:', text.slice(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse AI response as valid JSON' },
        { status: 500 }
      );
    }

    // Default language if AI omits it
    if (!report.language || typeof report.language !== 'string') {
      report.language = 'en';
    }

    // Validate the structure
    if (
      !Array.isArray(report.summary) ||
      !Array.isArray(report.decisions) ||
      !Array.isArray(report.actions) ||
      !Array.isArray(report.pending) ||
      !Array.isArray(report.participants)
    ) {
      console.error('[distill] Invalid report structure:', Object.keys(report));
      return NextResponse.json(
        { error: 'AI response does not match expected report structure' },
        { status: 500 }
      );
    }

    console.log(`[distill] Success — ${report.summary.length} summary points, ${report.actions.length} actions, ${report.participants.length} participants`);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Distill API error:', error);

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('api key') || message.includes('unauthorized') || message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Invalid API key configuration' },
          { status: 500 }
        );
      }
      if (message.includes('rate limit') || message.includes('quota') || message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again shortly.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your notes' },
      { status: 500 }
    );
  }
}
