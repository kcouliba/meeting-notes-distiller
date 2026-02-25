import { toMarkdown } from '@/lib/formatters/markdown';
import { fullReport, emptyReport, minimalReport } from '../../fixtures/sampleReport';

describe('toMarkdown', () => {
  it('formats a complete report correctly', () => {
    const result = toMarkdown(fullReport);

    expect(result).toContain('# Meeting Report');
    expect(result).toContain('## Summary');
    expect(result).toContain('## Decisions');
    expect(result).toContain('## Action Items');
    expect(result).toContain('## Pending Items');
    expect(result).toContain('## Participants');

    // Check summary points
    fullReport.summary.forEach((point) => {
      expect(result).toContain(`- ${point}`);
    });

    // Check decisions
    fullReport.decisions.forEach((decision) => {
      expect(result).toContain(decision);
    });

    // Check actions with assignees and deadlines
    expect(result).toContain('Prepare the migration plan');
    expect(result).toContain('@Bob');
    expect(result).toContain('Jan 30');

    // Check participants
    expect(result).toContain('Alice, Bob, Charlie');
  });

  it('handles empty sections gracefully', () => {
    const result = toMarkdown(emptyReport);

    expect(result).toContain('# Meeting Report');
    // Should not contain section headers for empty arrays
    expect(result).not.toContain('## Summary');
    expect(result).not.toContain('## Decisions');
    expect(result).not.toContain('## Action Items');
    expect(result).not.toContain('## Pending Items');
    expect(result).not.toContain('## Participants');
  });

  it('handles actions without assignees or deadlines', () => {
    const result = toMarkdown(minimalReport);

    expect(result).toContain('Review the PR');
    // Should not have an assignee arrow when assignee is null
    expect(result).not.toContain('→ @null');
    // Should not have deadline when it's null
    expect(result).not.toContain('(by null)');
  });

  it('uses checkbox format for action items', () => {
    const result = toMarkdown(fullReport);

    expect(result).toContain('- [ ] **Prepare the migration plan**');
  });
});
