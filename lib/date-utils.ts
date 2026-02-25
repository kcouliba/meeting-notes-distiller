const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // Verify the date components match (catches overflow like Feb 30 → Mar 2)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDeadline(value: string | null): string {
  if (!value) return '';
  if (isIsoDate(value)) {
    return formatter.format(new Date(value + 'T00:00:00'));
  }
  // Legacy freeform strings pass through unchanged
  return value;
}
