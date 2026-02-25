import { MeetingReport } from '@/types/meeting';

export function toEmail(report: MeetingReport): string {
  const sections: string[] = [];

  sections.push('Subject: Meeting Report\n');
  sections.push('Hello,\n');
  sections.push('Please find below the summary of our meeting.\n');

  if (report.summary.length > 0) {
    sections.push('SUMMARY');
    sections.push('-------');
    report.summary.forEach((point) => {
      sections.push(`- ${point}`);
    });
    sections.push('');
  }

  if (report.decisions.length > 0) {
    sections.push('DECISIONS');
    sections.push('---------');
    report.decisions.forEach((decision, i) => {
      sections.push(`${i + 1}. ${decision}`);
    });
    sections.push('');
  }

  if (report.actions.length > 0) {
    sections.push('ACTION ITEMS');
    sections.push('------------');
    report.actions.forEach((action, i) => {
      sections.push(`${i + 1}. ${action.task}`);
      if (action.assignee) {
        sections.push(`   Assigned to: ${action.assignee}`);
      }
      if (action.deadline) {
        sections.push(`   Deadline: ${action.deadline}`);
      }
    });
    sections.push('');
  }

  if (report.pending.length > 0) {
    sections.push('PENDING ITEMS');
    sections.push('-------------');
    report.pending.forEach((item, i) => {
      sections.push(`${i + 1}. ${item}`);
    });
    sections.push('');
  }

  if (report.participants.length > 0) {
    sections.push('PARTICIPANTS');
    sections.push('------------');
    sections.push(report.participants.join(', '));
    sections.push('');
  }

  sections.push('Best regards');

  return sections.join('\n');
}
