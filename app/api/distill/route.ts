import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { MeetingReport } from '@/types/meeting';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

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

    console.log(`[distill] Received ${notes.length} chars of notes`);

    const startTime = Date.now();
    const result = await model.generateContent(notes.trim());
    const elapsed = Date.now() - startTime;
    const text = result.response.text();

    console.log(`[distill] Gemini responded in ${elapsed}ms (${text.length} chars)`);

    if (!text) {
      console.error('[distill] Empty response from Gemini');
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
