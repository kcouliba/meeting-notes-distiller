import { toSlack } from '@/lib/formatters/slack';
import { fullReport, emptyReport } from '../../fixtures/sampleReport';

describe('toSlack', () => {
  it('uses Slack mrkdwn formatting with bold asterisks', () => {
    const result = toSlack(fullReport);

    // Slack uses *bold* not **bold**
    expect(result).toContain('*Meeting Report*');
    expect(result).toContain('*Summary*');
    expect(result).toContain('*Decisions*');
    expect(result).toContain('*Action Items*');
  });

  it('includes proper emojis for sections', () => {
    const result = toSlack(fullReport);

    expect(result).toContain(':clipboard:');
    expect(result).toContain(':memo:');
    expect(result).toContain(':white_check_mark:');
    expect(result).toContain(':dart:');
  });

  it('formats actions with bold assignees and italic deadlines', () => {
    const result = toSlack(fullReport);

    expect(result).toContain('*@Bob*');
    expect(result).toContain('_(Jan 30)_');
  });

  it('includes pending section with hourglass emoji', () => {
    const result = toSlack(fullReport);

    expect(result).toContain(':hourglass_flowing_sand:');
    expect(result).toContain('*Pending*');
  });

  it('includes participants section', () => {
    const result = toSlack(fullReport);

    expect(result).toContain(':busts_in_silhouette:');
    expect(result).toContain('Alice, Bob, Charlie');
  });

  it('handles empty data', () => {
    const result = toSlack(emptyReport);

    expect(result).toContain(':clipboard:');
    expect(result).not.toContain('*Summary*');
    expect(result).not.toContain('*Decisions*');
    expect(result).not.toContain('*Action Items*');
  });
});
