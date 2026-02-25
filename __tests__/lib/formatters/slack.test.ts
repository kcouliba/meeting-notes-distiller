import { toSlack } from '@/lib/formatters/slack';
import { fullReport, emptyReport, frenchReport } from '../../fixtures/sampleReport';

describe('toSlack', () => {
  it('uses Slack mrkdwn formatting with bold asterisks', () => {
    const result = toSlack(fullReport, 'en');

    // Slack uses *bold* not **bold**
    expect(result).toContain('*Meeting Report*');
    expect(result).toContain('*Summary*');
    expect(result).toContain('*Decisions*');
    expect(result).toContain('*Action Items*');
  });

  it('includes proper emojis for sections', () => {
    const result = toSlack(fullReport, 'en');

    expect(result).toContain(':clipboard:');
    expect(result).toContain(':memo:');
    expect(result).toContain(':white_check_mark:');
    expect(result).toContain(':dart:');
  });

  it('formats actions with bold assignees and italic deadlines', () => {
    const result = toSlack(fullReport, 'en');

    expect(result).toContain('*@Bob*');
    expect(result).toContain('_(Jan 30)_');
  });

  it('includes pending section with hourglass emoji', () => {
    const result = toSlack(fullReport, 'en');

    expect(result).toContain(':hourglass_flowing_sand:');
    expect(result).toContain('*Pending Items*');
  });

  it('includes participants section', () => {
    const result = toSlack(fullReport, 'en');

    expect(result).toContain(':busts_in_silhouette:');
    expect(result).toContain('Alice, Bob, Charlie');
  });

  it('handles empty data', () => {
    const result = toSlack(emptyReport, 'en');

    expect(result).toContain(':clipboard:');
    expect(result).not.toContain('*Summary*');
    expect(result).not.toContain('*Decisions*');
    expect(result).not.toContain('*Action Items*');
  });

  it('formats a French report with French labels', () => {
    const result = toSlack(frenchReport, 'fr');

    expect(result).toContain('*Compte rendu de réunion*');
    expect(result).toContain('*Résumé*');
    expect(result).toContain('*Décisions*');
    expect(result).toContain('*Actions à mener*');
    expect(result).toContain('*Points en suspens*');
    expect(result).toContain('*Participants*');
  });
});
