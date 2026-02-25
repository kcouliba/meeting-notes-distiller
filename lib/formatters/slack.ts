import { MeetingReport } from '@/types/meeting';

export function toSlack(report: MeetingReport): string {
  const sections: string[] = [];

  sections.push(':clipboard: *Meeting Report*\n');

  if (report.summary.length > 0) {
    sections.push(':memo: *Summary*');
    report.summary.forEach((point) => {
      sections.push(`\u2022 ${point}`);
    });
    sections.push('');
  }

  if (report.decisions.length > 0) {
    sections.push(':white_check_mark: *Decisions*');
    report.decisions.forEach((decision) => {
      sections.push(`\u2022 ${decision}`);
    });
    sections.push('');
  }

  if (report.actions.length > 0) {
    sections.push(':dart: *Action Items*');
    report.actions.forEach((action) => {
      let line = `\u2022 ${action.task}`;
      if (action.assignee) {
        line += ` \u2192 *@${action.assignee}*`;
      }
      if (action.deadline) {
        line += ` _(${action.deadline})_`;
      }
      sections.push(line);
    });
    sections.push('');
  }

  if (report.pending.length > 0) {
    sections.push(':hourglass_flowing_sand: *Pending*');
    report.pending.forEach((item) => {
      sections.push(`\u2022 ${item}`);
    });
    sections.push('');
  }

  if (report.participants.length > 0) {
    sections.push(':busts_in_silhouette: *Participants*');
    sections.push(report.participants.join(', '));
    sections.push('');
  }

  return sections.join('\n');
}
