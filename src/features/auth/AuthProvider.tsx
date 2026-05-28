// Single auth context for both roles (spec §18.3). Reads tokens from localStorage
// on boot; exposes parsed claims and login/logout. The active PostgREST token is
// set by the layout that mounts (student vs admin).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { tokenStore, decodeJwt, isExpired } from '@/lib/api/tokenStore';
import type { StudentSession } from '@/lib/api/auth';

interface StudentClaims {
  student_id: string;
}

interface AuthState {
  studentToken: string | null;
  adminToken: string | null;
  studentId: string | null;
  loginStudent: (session: StudentSession) => void;
  logoutStudent: () => void;
  loginAdmin: (token: string) => void;
  logoutAdmin: () => void;
  /** Choose which token PostgREST should use for the current app. */
  activate: (role: 'student' | 'admin') => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [studentToken, setStudentToken] = useState<string | null>(() => {
    const t = tokenStore.getStudent();
    return t && !isExpired(t) ? t : null;
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const t = tokenStore.getAdmin();
    return t && !isExpired(t) ? t : null;
  });

  // Cache the student's display fields alongside the token.
  useEffect(() => {
    if (studentToken && isExpired(studentToken)) {
      tokenStore.clearStudent();
      setStudentToken(null);
    }
  }, [studentToken]);

  const loginStudent = useCallback((session: StudentSession) => {
    tokenStore.setStudent(session.token);
    localStorage.setItem('rh.student.profile', JSON.stringify(session));
    setStudentToken(session.token);
    tokenStore.setActive(session.token);
  }, []);

  const logoutStudent = useCallback(() => {
    tokenStore.clearStudent();
    localStorage.removeItem('rh.student.profile');
    setStudentToken(null);
    tokenStore.setActive(null);
  }, []);

  const loginAdmin = useCallback((token: string) => {
    tokenStore.setAdmin(token);
    setAdminToken(token);
    tokenStore.setActive(token);
  }, []);

  const logoutAdmin = useCallback(() => {
    tokenStore.clearAdmin();
    setAdminToken(null);
    tokenStore.setActive(null);
  }, []);

  const activate = useCallback(
    (role: 'student' | 'admin') => {
      tokenStore.setActive(role === 'student' ? studentToken : adminToken);
    },
    [studentToken, adminToken],
  );

  const studentId = useMemo(
    () => (studentToken ? decodeJwt<StudentClaims>(studentToken)?.student_id ?? null : null),
    [studentToken],
  );

  const value = useMemo<AuthState>(
    () => ({
      studentToken,
      adminToken,
      studentId,
      loginStudent,
      logoutStudent,
      loginAdmin,
      logoutAdmin,
      activate,
    }),
    [studentToken, adminToken, studentId, loginStudent, logoutStudent, loginAdmin, logoutAdmin, activate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useStudentProfile(): StudentSession | null {
  const raw = localStorage.getItem('rh.student.profile');
  return raw ? (JSON.parse(raw) as StudentSession) : null;
}
