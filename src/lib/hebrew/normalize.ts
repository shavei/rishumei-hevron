// Hebrew normalization for equality comparison (spec §7.7).
// Pattern lifted conceptually from the attendance project's normalizeTabName.

const APOSTROPHE_VARIANTS = /['’״׳`]/g;

/** Strip apostrophe variants and collapse whitespace for safe equality checks. */
export function normalizeHebrew(input: string): string {
  return (input ?? '')
    .replace(APOSTROPHE_VARIANTS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Case/whitespace/apostrophe-insensitive equality of two Hebrew strings. */
export function hebrewEquals(a: string, b: string): boolean {
  return normalizeHebrew(a) === normalizeHebrew(b);
}
