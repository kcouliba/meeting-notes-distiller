import { parseSrt } from '@/lib/parsers/srt';

describe('parseSrt', () => {
  it('extracts dialogue text from standard SRT', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Sarah: Let's discuss the Q2 roadmap.

2
00:00:04,500 --> 00:00:08,000
Pierre: I think we should focus on hiring.`;

    const result = parseSrt(srt);

    expect(result).toContain("Sarah: Let's discuss the Q2 roadmap.");
    expect(result).toContain('Pierre: I think we should focus on hiring.');
    expect(result).not.toContain('00:00:01,000');
    expect(result).not.toContain('-->');
  });

  it('strips HTML formatting tags (<b>, <i>)', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
This is <b>bold</b> and <i>italic</i> text.`;

    const result = parseSrt(srt);
    expect(result).toBe('This is bold and italic text.');
  });

  it('preserves multi-line cue content', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
First line of cue.
Second line of cue.

2
00:00:04,500 --> 00:00:08,000
Another cue.`;

    const result = parseSrt(srt);

    expect(result).toContain('First line of cue.');
    expect(result).toContain('Second line of cue.');
    expect(result).toContain('Another cue.');
  });

  it('returns empty string for empty SRT', () => {
    const result = parseSrt('');
    expect(result).toBe('');
  });

  it('strips numeric cue identifiers', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hello.

2
00:00:04,500 --> 00:00:08,000
World.`;

    const result = parseSrt(srt);

    expect(result).not.toMatch(/^\d+$/m);
    expect(result).toContain('Hello.');
    expect(result).toContain('World.');
  });

  it('collapses 3+ consecutive newlines into 2', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
First line.



2
00:00:10,000 --> 00:00:14,000
Second line after gap.`;

    const result = parseSrt(srt);

    expect(result).toContain('First line.');
    expect(result).toContain('Second line after gap.');
    expect(result).not.toMatch(/\n{3,}/);
  });
});
