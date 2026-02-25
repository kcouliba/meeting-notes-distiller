import { parseTranscriptFile, isFileParseError } from '@/lib/parsers';
import type { FileParseResult, FileParseError } from '@/types/meeting';

function createMockFile(content: string, name: string, options?: FilePropertyBag): File {
  const file = new File([content], name, options);
  // jsdom's File/Blob may not support text() — define it directly
  file.text = () => Promise.resolve(content);
  return file;
}

describe('parseTranscriptFile', () => {
  it('routes .vtt files to VTT parser', async () => {
    const vttContent = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello from VTT.`;
    const file = createMockFile(vttContent, 'meeting.vtt', { type: 'text/vtt' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
    const parsed = result as FileParseResult;
    expect(parsed.text).toBe('Hello from VTT.');
    expect(parsed.extension).toBe('.vtt');
    expect(parsed.filename).toBe('meeting.vtt');
    expect(parsed.charCount).toBe(15);
  });

  it('routes .srt files to SRT parser', async () => {
    const srtContent = `1
00:00:01,000 --> 00:00:04,000
Hello from SRT.`;
    const file = createMockFile(srtContent, 'meeting.srt');

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
    const parsed = result as FileParseResult;
    expect(parsed.text).toBe('Hello from SRT.');
    expect(parsed.extension).toBe('.srt');
  });

  it('uses raw text for .txt files', async () => {
    const content = 'Just some plain text notes.';
    const file = createMockFile(content, 'notes.txt', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
    const parsed = result as FileParseResult;
    expect(parsed.text).toBe('Just some plain text notes.');
    expect(parsed.extension).toBe('.txt');
  });

  it('rejects unsupported file types', async () => {
    const file = createMockFile('content', 'document.pdf', { type: 'application/pdf' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(true);
    const error = result as FileParseError;
    expect(error.code).toBe('UNSUPPORTED_TYPE');
    expect(error.message).toContain('.vtt, .srt, or .txt');
  });

  it('rejects .docx files', async () => {
    const file = createMockFile('content', 'document.docx');

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(true);
    expect((result as FileParseError).code).toBe('UNSUPPORTED_TYPE');
  });

  it('rejects files over 500 KB', async () => {
    const largeContent = 'a'.repeat(512_001);
    const file = createMockFile(largeContent, 'large.txt', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(true);
    const error = result as FileParseError;
    expect(error.code).toBe('FILE_TOO_LARGE');
    expect(error.message).toContain('500 KB');
  });

  it('accepts files exactly at 500 KB limit', async () => {
    const content = 'a'.repeat(512_000);
    const file = createMockFile(content, 'exact.txt', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
  });

  it('rejects empty files', async () => {
    const file = createMockFile('', 'empty.txt', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(true);
    const error = result as FileParseError;
    expect(error.code).toBe('EMPTY_FILE');
    expect(error.message).toContain('empty');
  });

  it('rejects VTT files with only headers (no dialogue)', async () => {
    const file = createMockFile('WEBVTT\n\n', 'empty.vtt', { type: 'text/vtt' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(true);
    expect((result as FileParseError).code).toBe('EMPTY_FILE');
  });

  it('strips BOM from file content', async () => {
    const content = '\uFEFFJust some text with BOM.';
    const file = createMockFile(content, 'bom.txt', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
    const parsed = result as FileParseResult;
    expect(parsed.text).toBe('Just some text with BOM.');
    expect(parsed.text).not.toContain('\uFEFF');
  });

  it('normalizes Windows line endings', async () => {
    const content = 'Line one.\r\nLine two.\r\nLine three.';
    const file = createMockFile(content, 'windows.txt', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
    const parsed = result as FileParseResult;
    expect(parsed.text).not.toContain('\r\n');
    expect(parsed.text).toContain('Line one.\nLine two.\nLine three.');
  });

  it('handles case-insensitive file extensions', async () => {
    const file = createMockFile('some text', 'NOTES.TXT', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
    expect((result as FileParseResult).extension).toBe('.txt');
  });

  it('returns correct charCount', async () => {
    const content = 'Hello world';
    const file = createMockFile(content, 'test.txt', { type: 'text/plain' });

    const result = await parseTranscriptFile(file);

    expect(isFileParseError(result)).toBe(false);
    expect((result as FileParseResult).charCount).toBe(11);
  });
});

describe('isFileParseError', () => {
  it('returns true for error objects', () => {
    const error: FileParseError = { code: 'EMPTY_FILE', message: 'Empty' };
    expect(isFileParseError(error)).toBe(true);
  });

  it('returns false for success results', () => {
    const result: FileParseResult = {
      text: 'hello',
      filename: 'test.txt',
      extension: '.txt',
      charCount: 5,
    };
    expect(isFileParseError(result)).toBe(false);
  });
});
