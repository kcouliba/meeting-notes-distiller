import { MeetingReport } from '@/types/meeting';

export function toMarkdown(report: MeetingReport): string {
  const sections: string[] = [];

  sections.push('# Meeting Report\n');

  if (report.summary.length > 0) {
    sections.push('## Summary\n');
    report.summary.forEach((point) => {
      sections.push(`- ${point}`);
    });
    sections.push('');
  }

  if (report.decisions.length > 0) {
    sections.push('## Decisions\n');
    report.decisions.forEach((decision) => {
      sections.push(`- ${decision}`);
    });
    sections.push('');
  }

  if (report.actions.length > 0) {
    sections.push('## Action Items\n');
    report.actions.forEach((action) => {
      let line = `- [ ] **${action.task}**`;
      if (action.assignee) {
        line += ` \u2192 @${action.assignee}`;
      }
      if (action.deadline) {
        line += ` (by ${action.deadline})`;
      }
      sections.push(line);
    });
    sections.push('');
  }

  if (report.pending.length > 0) {
    sections.push('## Pending Items\n');
    report.pending.forEach((item) => {
      sections.push(`- ${item}`);
    });
    sections.push('');
  }

  if (report.participants.length > 0) {
    sections.push('## Participants\n');
    sections.push(report.participants.join(', '));
    sections.push('');
  }

  return sections.join('\n');
}
