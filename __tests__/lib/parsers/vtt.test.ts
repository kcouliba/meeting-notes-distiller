import { parseVtt } from '@/lib/parsers/vtt';

describe('parseVtt', () => {
  it('extracts dialogue text from standard VTT', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Sarah: Let's discuss the Q2 roadmap.

00:00:04.500 --> 00:00:08.000
Pierre: I think we should focus on hiring.`;

    const result = parseVtt(vtt);

    expect(result).toContain("Sarah: Let's discuss the Q2 roadmap.");
    expect(result).toContain('Pierre: I think we should focus on hiring.');
    expect(result).not.toContain('WEBVTT');
    expect(result).not.toContain('00:00:01.000');
    expect(result).not.toContain('-->');
  });

  it('strips HTML-like voice tags (<v>)', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
<v Sarah>Let's discuss the Q2 roadmap.</v>

00:00:04.500 --> 00:00:08.000
<v Pierre>I think we should focus on hiring.</v>`;

    const result = parseVtt(vtt);

    expect(result).toContain("Let's discuss the Q2 roadmap.");
    expect(result).toContain('I think we should focus on hiring.');
    expect(result).not.toContain('<v');
    expect(result).not.toContain('</v>');
  });

  it('strips STYLE, REGION, and NOTE keyword lines', () => {
    const vtt = `WEBVTT

STYLE

REGION

NOTE This is a comment

00:00:01.000 --> 00:00:04.000
Hello world.`;

    const result = parseVtt(vtt);

    expect(result).toContain('Hello world.');
    expect(result).not.toContain('STYLE');
    expect(result).not.toContain('REGION');
    expect(result).not.toContain('NOTE');
  });

  it('strips numeric cue identifiers', () => {
    const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
First line.

2
00:00:04.500 --> 00:00:08.000
Second line.`;

    const result = parseVtt(vtt);

    expect(result).toContain('First line.');
    expect(result).toContain('Second line.');
    // Cue IDs should not appear as standalone lines
    expect(result).not.toMatch(/^\d+$/m);
  });

  it('returns empty string for empty VTT (header only)', () => {
    const vtt = `WEBVTT

`;

    const result = parseVtt(vtt);
    expect(result).toBe('');
  });

  it('collapses 3+ consecutive newlines into 2', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
First line.



00:00:10.000 --> 00:00:14.000
Second line after gap.`;

    const result = parseVtt(vtt);

    expect(result).toContain('First line.');
    expect(result).toContain('Second line after gap.');
    // Should not have 3+ consecutive newlines
    expect(result).not.toMatch(/\n{3,}/);
  });

  it('strips bold and italic HTML tags', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
This is <b>bold</b> and <i>italic</i> text.`;

    const result = parseVtt(vtt);
    expect(result).toBe('This is bold and italic text.');
  });
});
