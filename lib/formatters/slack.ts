import { MeetingReport } from '@/types/meeting';
import { getLocale } from '@/lib/locales';

export function toSlack(report: MeetingReport, language: string = 'en'): string {
  const l = getLocale(language);
  const sections: string[] = [];

  sections.push(`:clipboard: *${l.meetingReport}*\n`);

  if (report.summary.length > 0) {
    sections.push(`:memo: *${l.summary}*`);
    report.summary.forEach((point) => {
      sections.push(`• ${point}`);
    });
    sections.push('');
  }

  if (report.decisions.length > 0) {
    sections.push(`:white_check_mark: *${l.decisions}*`);
    report.decisions.forEach((decision) => {
      sections.push(`• ${decision}`);
    });
    sections.push('');
  }

  if (report.actions.length > 0) {
    sections.push(`:dart: *${l.actionItems}*`);
    report.actions.forEach((action) => {
      let line = `• ${action.task}`;
      if (action.assignee) {
        line += ` → *@${action.assignee}*`;
      }
      if (action.deadline) {
        line += ` _(${action.deadline})_`;
      }
      sections.push(line);
    });
    sections.push('');
  }

  if (report.pending.length > 0) {
    sections.push(`:hourglass_flowing_sand: *${l.pendingItems}*`);
    report.pending.forEach((item) => {
      sections.push(`• ${item}`);
    });
    sections.push('');
  }

  if (report.participants.length > 0) {
    sections.push(`:busts_in_silhouette: *${l.participants}*`);
    sections.push(report.participants.join(', '));
    sections.push('');
  }

  return sections.join('\n');
}
