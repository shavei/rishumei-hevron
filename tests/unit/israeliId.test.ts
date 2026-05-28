import { describe, expect, it } from 'vitest';
import { formatIdNumber, isValidIdNumber, normalizeIdNumber } from '@/lib/hebrew/israeliId';
import { normalizeHebrew, hebrewEquals } from '@/lib/hebrew/normalize';

describe('israeli id', () => {
  it('zero-pads to 9 digits', () => {
    expect(normalizeIdNumber('12345678')).toBe('012345678');
    expect(normalizeIdNumber('1')).toBe('000000001');
  });
  it('strips non-digits', () => {
    expect(normalizeIdNumber('012-345-678')).toBe('012345678');
  });
  it('rejects over-length', () => {
    expect(normalizeIdNumber('1234567890')).toBeNull();
  });
  it('validates 9-digit forms', () => {
    expect(isValidIdNumber('12345678')).toBe(true);
    expect(isValidIdNumber('abc')).toBe(false);
  });
  it('formats without dashes', () => {
    expect(formatIdNumber('12345678')).toBe('012345678');
  });
});

describe('hebrew normalization', () => {
  it('strips apostrophe variants and collapses whitespace', () => {
    expect(normalizeHebrew("שיעור  א'")).toBe('שיעור א');
  });
  it('compares with tolerance', () => {
    expect(hebrewEquals("שיעור א'", 'שיעור א')).toBe(true);
  });
});
