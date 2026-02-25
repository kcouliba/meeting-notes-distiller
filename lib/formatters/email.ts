import { MeetingReport } from '@/types/meeting';
import { getLocale } from '@/lib/locales';

export function toEmail(report: MeetingReport, language: string = 'en'): string {
  const l = getLocale(language);
  const sections: string[] = [];

  sections.push(`Subject: ${l.emailSubject}\n`);
  sections.push(`${l.emailGreeting}\n`);
  sections.push(`${l.emailIntro}\n`);

  if (report.summary.length > 0) {
    sections.push(l.summary.toUpperCase());
    sections.push('-'.repeat(l.summary.length));
    report.summary.forEach((point) => {
      sections.push(`- ${point}`);
    });
    sections.push('');
  }

  if (report.decisions.length > 0) {
    sections.push(l.decisions.toUpperCase());
    sections.push('-'.repeat(l.decisions.length));
    report.decisions.forEach((decision, i) => {
      sections.push(`${i + 1}. ${decision}`);
    });
    sections.push('');
  }

  if (report.actions.length > 0) {
    sections.push(l.actionItems.toUpperCase());
    sections.push('-'.repeat(l.actionItems.length));
    report.actions.forEach((action, i) => {
      sections.push(`${i + 1}. ${action.task}`);
      if (action.assignee) {
        sections.push(`   ${l.assignedTo}: ${action.assignee}`);
      }
      if (action.deadline) {
        sections.push(`   ${l.deadline}: ${action.deadline}`);
      }
    });
    sections.push('');
  }

  if (report.pending.length > 0) {
    sections.push(l.pendingItems.toUpperCase());
    sections.push('-'.repeat(l.pendingItems.length));
    report.pending.forEach((item, i) => {
      sections.push(`${i + 1}. ${item}`);
    });
    sections.push('');
  }

  if (report.participants.length > 0) {
    sections.push(l.participants.toUpperCase());
    sections.push('-'.repeat(l.participants.length));
    sections.push(report.participants.join(', '));
    sections.push('');
  }

  sections.push(l.emailSignoff);

  return sections.join('\n');
}
