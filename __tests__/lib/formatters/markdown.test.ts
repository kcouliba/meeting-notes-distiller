import { toMarkdown } from '@/lib/formatters/markdown';
import { fullReport, emptyReport, minimalReport, frenchReport } from '../../fixtures/sampleReport';

describe('toMarkdown', () => {
  it('formats a complete report correctly', () => {
    const result = toMarkdown(fullReport, 'en');

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
    const result = toMarkdown(emptyReport, 'en');

    expect(result).toContain('# Meeting Report');
    // Should not contain section headers for empty arrays
    expect(result).not.toContain('## Summary');
    expect(result).not.toContain('## Decisions');
    expect(result).not.toContain('## Action Items');
    expect(result).not.toContain('## Pending Items');
    expect(result).not.toContain('## Participants');
  });

  it('handles actions without assignees or deadlines', () => {
    const result = toMarkdown(minimalReport, 'en');

    expect(result).toContain('Review the PR');
    // Should not have an assignee arrow when assignee is null
    expect(result).not.toContain('→ @null');
    // Should not have deadline when it's null
    expect(result).not.toContain('(by null)');
  });

  it('uses checkbox format for action items', () => {
    const result = toMarkdown(fullReport, 'en');

    expect(result).toContain('- [ ] **Prepare the migration plan**');
  });

  it('formats a French report with French labels', () => {
    const result = toMarkdown(frenchReport, 'fr');

    expect(result).toContain('# Compte rendu de réunion');
    expect(result).toContain('## Résumé');
    expect(result).toContain('## Décisions');
    expect(result).toContain('## Actions à mener');
    expect(result).toContain('## Points en suspens');
    expect(result).toContain('## Participants');

    // Check French content is present
    expect(result).toContain('Préparer le plan de migration');
    expect(result).toContain('@Bob');
    expect(result).toContain('pour le 30 jan.');
  });
});
