import { toEmail } from '@/lib/formatters/email';
import { fullReport, emptyReport } from '../../fixtures/sampleReport';

describe('toEmail', () => {
  it('has professional email structure', () => {
    const result = toEmail(fullReport);

    expect(result).toContain('Subject: Meeting Report');
    expect(result).toContain('Hello,');
    expect(result).toContain('Best regards');
  });

  it('includes all sections with proper formatting', () => {
    const result = toEmail(fullReport);

    expect(result).toContain('SUMMARY');
    expect(result).toContain('DECISIONS');
    expect(result).toContain('ACTION ITEMS');
    expect(result).toContain('PENDING ITEMS');
    expect(result).toContain('PARTICIPANTS');
  });

  it('uses numbered lists for decisions and actions', () => {
    const result = toEmail(fullReport);

    expect(result).toContain('1. Adopt the new CI/CD pipeline');
    expect(result).toContain('2. Marketing budget approved');
    expect(result).toContain('1. Prepare the migration plan');
  });

  it('includes assignee and deadline info for actions', () => {
    const result = toEmail(fullReport);

    expect(result).toContain('Assigned to: Bob');
    expect(result).toContain('Deadline: Jan 30');
  });

  it('handles empty data', () => {
    const result = toEmail(emptyReport);

    expect(result).toContain('Subject: Meeting Report');
    expect(result).toContain('Hello,');
    expect(result).toContain('Best regards');
    expect(result).not.toContain('SUMMARY');
    expect(result).not.toContain('DECISIONS');
    expect(result).not.toContain('ACTION ITEMS');
  });
});
