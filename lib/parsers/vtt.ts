/**
 * Parses WebVTT (.vtt) content into plain text.
 * Strips the WEBVTT header, metadata blocks, timestamps, cue identifiers, and HTML-like tags.
 */
export function parseVtt(content: string): string {
  const lines = content.split('\n');
  const filtered: string[] = [];

  const timestampRegex = /^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/;
  const cueIdRegex = /^\d+$/;
  const metadataRegex = /^(WEBVTT|NOTE|STYLE|REGION)/;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip header, metadata, timestamps, and cue identifiers
    if (metadataRegex.test(trimmed)) continue;
    if (timestampRegex.test(trimmed)) continue;
    if (cueIdRegex.test(trimmed)) continue;

    filtered.push(trimmed);
  }

  let result = filtered.join('\n');

  // Strip HTML-like tags (e.g. <v>, <b>, <i>)
  result = result.replace(/<[^>]+>/g, '');

  // Collapse 3+ consecutive newlines into 2
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
