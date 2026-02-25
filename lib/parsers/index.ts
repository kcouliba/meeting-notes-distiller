import type { FileParseResult, FileParseError, SupportedFileExtension } from '@/types/meeting';
import { SUPPORTED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '@/types/meeting';
import { parseVtt } from './vtt';
import { parseSrt } from './srt';

function isFileParseError(result: FileParseResult | FileParseError): result is FileParseError {
  return 'code' in result;
}

export { isFileParseError };

export async function parseTranscriptFile(
  file: File
): Promise<FileParseResult | FileParseError> {
  // Get file extension
  const name = file.name.toLowerCase();
  const dotIndex = name.lastIndexOf('.');
  const extension = dotIndex >= 0 ? name.slice(dotIndex) : '';

  // Validate extension
  if (!SUPPORTED_EXTENSIONS.includes(extension as SupportedFileExtension)) {
    return {
      code: 'UNSUPPORTED_TYPE',
      message: 'Unsupported file type. Please upload a .vtt, .srt, or .txt file.',
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: 'FILE_TOO_LARGE',
      message: 'File is too large (max 500 KB). Try a shorter transcript.',
    };
  }

  try {
    let content = await file.text();

    // Strip BOM
    content = content.replace(/^\uFEFF/, '');

    // Normalize Windows line endings
    content = content.replace(/\r\n/g, '\n');

    let text: string;

    switch (extension as SupportedFileExtension) {
      case '.vtt':
        text = parseVtt(content);
        break;
      case '.srt':
        text = parseSrt(content);
        break;
      case '.txt':
        text = content.trim();
        break;
      default:
        text = content.trim();
    }

    if (!text) {
      return {
        code: 'EMPTY_FILE',
        message: 'The file appears to be empty.',
      };
    }

    return {
      text,
      filename: file.name,
      extension: extension as SupportedFileExtension,
      charCount: text.length,
    };
  } catch {
    return {
      code: 'PARSE_ERROR',
      message: 'Could not parse the file. Please check the file format.',
    };
  }
}
