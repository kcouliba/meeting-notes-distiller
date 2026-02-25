import { toNotion } from '@/lib/formatters/notion';
import { fullReport, emptyReport, minimalReport } from '../../fixtures/sampleReport';

describe('toNotion', () => {
  it('is compatible with Notion markdown format', () => {
    const result = toNotion(fullReport);

    expect(result).toContain('# Meeting Report');
    expect(result).toContain('## Summary');
    expect(result).toContain('## Decisions');
    expect(result).toContain('## Action Items');
  });

  it('uses blockquote callout for summary', () => {
    const result = toNotion(fullReport);

    expect(result).toContain('> **Key Points**');
    fullReport.summary.forEach((point) => {
      expect(result).toContain(`> - ${point}`);
    });
  });

  it('uses checkbox format for actions', () => {
    const result = toNotion(fullReport);

    expect(result).toContain('- [ ] Prepare the migration plan');
  });

  it('includes assignees with @ prefix and em-dash separator', () => {
    const result = toNotion(fullReport);

    expect(result).toContain('— @Bob');
    expect(result).toContain('Due: Jan 30');
  });

  it('uses @ prefix for participants', () => {
    const result = toNotion(fullReport);

    expect(result).toContain('@Alice');
    expect(result).toContain('@Bob');
    expect(result).toContain('@Charlie');
  });

  it('handles empty data', () => {
    const result = toNotion(emptyReport);

    expect(result).toContain('# Meeting Report');
    expect(result).not.toContain('## Summary');
    expect(result).not.toContain('## Decisions');
    expect(result).not.toContain('## Action Items');
  });

  it('handles actions without assignee or deadline', () => {
    const result = toNotion(minimalReport);

    expect(result).toContain('- [ ] Review the PR');
    expect(result).not.toContain('— @null');
    expect(result).not.toContain('Due: null');
  });
});
