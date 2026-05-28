// Date formatting in Asia/Jerusalem with the Hebrew locale (spec §7.5).
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const TZ = 'Asia/Jerusalem';

function zoned(input: string | Date): Date {
  return toZonedTime(typeof input === 'string' ? new Date(input) : input, TZ);
}

/** Long: "יום ראשון, 14 ביוני 2026, 19:30". */
export function formatLong(input: string | Date): string {
  return format(zoned(input), "EEEE, d בMMMM yyyy, HH:mm", { locale: he });
}

/** Short date+time: "14/06/2026 19:30". */
export function formatShort(input: string | Date): string {
  return format(zoned(input), 'dd/MM/yyyy HH:mm', { locale: he });
}

/** Date only: "14 ביוני 2026". */
export function formatDate(input: string | Date): string {
  return format(zoned(input), 'd בMMMM yyyy', { locale: he });
}

/** True if the deadline has passed. */
export function isPast(input: string | Date): boolean {
  return new Date(typeof input === 'string' ? input : input.getTime()).getTime() <= Date.now();
}
