// Israeli ID handling (spec §7.6, §17.2): zero-pad to 9 digits, validate format.
// We deliberately do NOT enforce the check-digit algorithm: the source CSV is the
// authority and login matches stored values verbatim.

/** Strip non-digits and zero-pad to 9 digits. Returns null if not representable. */
export function normalizeIdNumber(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 9) return null;
  return digits.padStart(9, '0');
}

/** True when the input, once normalized, is a valid 9-digit ID. */
export function isValidIdNumber(raw: string): boolean {
  const n = normalizeIdNumber(raw);
  return n !== null && /^[0-9]{9}$/.test(n);
}

/** Display form: continuous 9-digit number, never with dashes (spec §7.6). */
export function formatIdNumber(idNumber: string): string {
  return (idNumber ?? '').replace(/\D/g, '').padStart(9, '0');
}
