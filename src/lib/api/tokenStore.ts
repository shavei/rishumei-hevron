// Token storage for our self-minted JWTs (spec §10, §18.3).
// One active token is sent to PostgREST; which one depends on the current app
// (student or admin). localStorage persists across reloads for session restore.

const STUDENT_KEY = 'rh.student.token';
const ADMIN_KEY = 'rh.admin.token';

let activeToken: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const tokenStore = {
  getActive(): string | null {
    return activeToken;
  },
  setActive(token: string | null) {
    activeToken = token;
    notify();
  },
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  // persisted per-role tokens
  getStudent: () => localStorage.getItem(STUDENT_KEY),
  setStudent(token: string) {
    localStorage.setItem(STUDENT_KEY, token);
  },
  clearStudent() {
    localStorage.removeItem(STUDENT_KEY);
  },
  getAdmin: () => localStorage.getItem(ADMIN_KEY),
  setAdmin(token: string) {
    localStorage.setItem(ADMIN_KEY, token);
  },
  clearAdmin() {
    localStorage.removeItem(ADMIN_KEY);
  },
};

/** Decode a JWT payload without verifying (client display only). */
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** True if the token is missing or past its `exp`. */
export function isExpired(token: string | null): boolean {
  if (!token) return true;
  const claims = decodeJwt<{ exp?: number }>(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now();
}
