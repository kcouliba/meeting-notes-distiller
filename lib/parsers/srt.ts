/**
 * Parses SubRip (.srt) content into plain text.
 * Strips cue identifiers, timestamps, and HTML-like formatting tags.
 */
export function parseSrt(content: string): string {
  const lines = content.split('\n');
  const filtered: string[] = [];

  const timestampRegex = /^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/;
  const cueIdRegex = /^\d+$/;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip timestamps and cue identifiers
    if (timestampRegex.test(trimmed)) continue;
    if (cueIdRegex.test(trimmed)) continue;

    filtered.push(trimmed);
  }

  let result = filtered.join('\n');

  // Strip HTML-like tags (e.g. <b>, <i>)
  result = result.replace(/<[^>]+>/g, '');

  // Collapse 3+ consecutive newlines into 2
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
