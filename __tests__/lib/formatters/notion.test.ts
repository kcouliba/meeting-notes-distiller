import { toNotion } from '@/lib/formatters/notion';
import { fullReport, emptyReport, minimalReport, frenchReport } from '../../fixtures/sampleReport';

describe('toNotion', () => {
  it('is compatible with Notion markdown format', () => {
    const result = toNotion(fullReport, 'en');

    expect(result).toContain('# Meeting Report');
    expect(result).toContain('## Summary');
    expect(result).toContain('## Decisions');
    expect(result).toContain('## Action Items');
  });

  it('uses blockquote callout for summary', () => {
    const result = toNotion(fullReport, 'en');

    expect(result).toContain('> **Key Points**');
    fullReport.summary.forEach((point) => {
      expect(result).toContain(`> - ${point}`);
    });
  });

  it('uses checkbox format for actions', () => {
    const result = toNotion(fullReport, 'en');

    expect(result).toContain('- [ ] Prepare the migration plan');
  });

  it('includes assignees with @ prefix and em-dash separator', () => {
    const result = toNotion(fullReport, 'en');

    expect(result).toContain('— @Bob');
    expect(result).toContain('Due: Jan 30');
  });

  it('uses @ prefix for participants', () => {
    const result = toNotion(fullReport, 'en');

    expect(result).toContain('@Alice');
    expect(result).toContain('@Bob');
    expect(result).toContain('@Charlie');
  });

  it('handles empty data', () => {
    const result = toNotion(emptyReport, 'en');

    expect(result).toContain('# Meeting Report');
    expect(result).not.toContain('## Summary');
    expect(result).not.toContain('## Decisions');
    expect(result).not.toContain('## Action Items');
  });

  it('handles actions without assignee or deadline', () => {
    const result = toNotion(minimalReport, 'en');

    expect(result).toContain('- [ ] Review the PR');
    expect(result).not.toContain('— @null');
    expect(result).not.toContain('Due: null');
  });

  it('formats a French report with French labels', () => {
    const result = toNotion(frenchReport, 'fr');

    expect(result).toContain('# Compte rendu de réunion');
    expect(result).toContain('## Résumé');
    expect(result).toContain('> **Points clés**');
    expect(result).toContain('## Décisions');
    expect(result).toContain('## Actions à mener');
    expect(result).toContain('## Points en suspens');
    expect(result).toContain('> **Suivi nécessaire**');
    expect(result).toContain('Échéance: 30 jan.');
  });
});
