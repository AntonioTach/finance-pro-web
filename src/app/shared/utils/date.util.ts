/**
 * YYYY-MM-DD for a Date in the user's LOCAL timezone.
 * (`toISOString().split('T')[0]` uses UTC and shifts the day in the evening
 * for negative-offset timezones like Mexico.)
 */
export function toLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD string as a local-midnight Date. */
export function fromLocalDateStr(value: string): Date {
  return new Date(value.substring(0, 10) + 'T00:00:00');
}
