import { MeetingReport, OutputFormat } from '@/types/meeting';
import { toMarkdown } from '@/lib/formatters/markdown';
import { toSlack } from '@/lib/formatters/slack';
import { toEmail } from '@/lib/formatters/email';
import { toNotion } from '@/lib/formatters/notion';
import { NextResponse } from 'next/server';

const formatters: Record<OutputFormat, (report: MeetingReport) => string> = {
  markdown: toMarkdown,
  slack: toSlack,
  email: toEmail,
  notion: toNotion,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { report, format } = body as {
      report: MeetingReport;
      format: OutputFormat;
    };

    if (!report || !format) {
      return NextResponse.json(
        { error: 'Both report and format are required' },
        { status: 400 }
      );
    }

    const validFormats: OutputFormat[] = ['markdown', 'slack', 'email', 'notion'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    const formatter = formatters[format];
    const formatted = formatter(report);

    return NextResponse.json({ formatted });
  } catch (error) {
    console.error('Format API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while formatting the report' },
      { status: 500 }
    );
  }
}
