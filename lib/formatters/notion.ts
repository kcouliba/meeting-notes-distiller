import { MeetingReport } from '@/types/meeting';
import { getLocale } from '@/lib/locales';

export function toNotion(report: MeetingReport, language: string = 'en'): string {
  const l = getLocale(language);
  const sections: string[] = [];

  sections.push(`# ${l.meetingReport}\n`);

  if (report.summary.length > 0) {
    sections.push(`## ${l.summary}\n`);
    sections.push(`> **${l.keyPoints}**\n`);
    report.summary.forEach((point) => {
      sections.push(`> - ${point}`);
    });
    sections.push('');
  }

  if (report.decisions.length > 0) {
    sections.push(`## ${l.decisions}\n`);
    report.decisions.forEach((decision) => {
      sections.push(`- ${decision}`);
    });
    sections.push('');
  }

  if (report.actions.length > 0) {
    sections.push(`## ${l.actionItems}\n`);
    report.actions.forEach((action) => {
      let line = `- [ ] ${action.task}`;
      if (action.assignee) {
        line += ` — @${action.assignee}`;
      }
      if (action.deadline) {
        line += ` | ${l.due}: ${action.deadline}`;
      }
      sections.push(line);
    });
    sections.push('');
  }

  if (report.pending.length > 0) {
    sections.push(`## ${l.pendingItems}\n`);
    sections.push(`> **${l.needsFollowup}**\n`);
    report.pending.forEach((item) => {
      sections.push(`> - ${item}`);
    });
    sections.push('');
  }

  if (report.participants.length > 0) {
    sections.push(`## ${l.participants}\n`);
    sections.push(report.participants.map((p) => `@${p}`).join(', '));
    sections.push('');
  }

  return sections.join('\n');
}
