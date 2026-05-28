// Hebrew normalization + Israeli-ID helpers shared by edge functions.
// Mirrors the frontend lib/hebrew so parsing rules stay identical (spec §7, §17).

const APOSTROPHE_VARIANTS = /['’״׳`]/g;

export function normalizeHebrew(input: string): string {
  return (input ?? '')
    .replace(APOSTROPHE_VARIANTS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Zero-pad / strip to a 9-digit Israeli ID. Returns null if impossible.
export function normalizeIdNumber(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 9) return null;
  const padded = digits.padStart(9, '0');
  return /^[0-9]{9}$/.test(padded) ? padded : null;
}

export const ALLOWED_GRADES = [
  'שיעור א',
  'שיעור ב',
  'שיעור ג',
  'שיעור ד-ה',
  'אברכים ובוגרים',
];

export function normalizeClassId(raw: string): string {
  const v = normalizeHebrew(raw);
  if (!v) return v;
  return v.startsWith('כיתה ') ? v : `כיתה ${v}`;
}

// Map a tolerated Hebrew header to its canonical DB field.
export function mapHeader(header: string): string | null {
  const h = normalizeHebrew(header);
  if (h === 'שם מלא' || h === 'שם') return 'full_name';
  if (h === 'תעודת זהות' || h === 'תז' || h === 'ת.ז') return 'id_number';
  if (h === 'שכבה' || h === 'שיעור') return 'grade';
  if (h === 'כיתה') return 'class_id';
  if (h === 'טלפון') return 'phone'; // tolerated, ignored
  return null;
}
