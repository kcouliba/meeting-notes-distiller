import { MeetingReport } from '@/types/meeting';

export function toNotion(report: MeetingReport): string {
  const sections: string[] = [];

  sections.push('# Meeting Report\n');

  if (report.summary.length > 0) {
    sections.push('## Summary\n');
    sections.push('> **Key Points**\n');
    report.summary.forEach((point) => {
      sections.push(`> - ${point}`);
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
      let line = `- [ ] ${action.task}`;
      if (action.assignee) {
        line += ` — @${action.assignee}`;
      }
      if (action.deadline) {
        line += ` | Due: ${action.deadline}`;
      }
      sections.push(line);
    });
    sections.push('');
  }

  if (report.pending.length > 0) {
    sections.push('## Pending Items\n');
    sections.push('> **Needs Follow-up**\n');
    report.pending.forEach((item) => {
      sections.push(`> - ${item}`);
    });
    sections.push('');
  }

  if (report.participants.length > 0) {
    sections.push('## Participants\n');
    sections.push(report.participants.map((p) => `@${p}`).join(', '));
    sections.push('');
  }

  return sections.join('\n');
}
