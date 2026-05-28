// Student login (spec §18.1): ID-only, auto-attempt at 9 valid digits, confirm step.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidIdNumber, normalizeIdNumber } from '@/lib/hebrew/israeliId';
import { studentLogin, type StudentSession } from '@/lib/api/auth';
import { useAuth } from '@/features/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

export function StudentLoginPage() {
  const [id, setId] = useState('');
  const [session, setSession] = useState<StudentSession | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent, studentToken } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Already logged in — skip to home
  useEffect(() => {
    if (studentToken) navigate('/', { replace: true });
  }, [studentToken, navigate]);

  // Auto-attempt login as soon as 9 valid digits are typed
  useEffect(() => {
    setError('');
    setSession(null);
    if (!isValidIdNumber(id)) return;
    let cancelled = false;
    setLoading(true);
    studentLogin(normalizeIdNumber(id)!).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.error || !res.data) {
        setError('לא נמצא תלמיד עם מספר זה — פנה למשרד');
      } else {
        setSession(res.data);
      }
    });
    return () => { cancelled = true; };
  }, [id]);

  function confirm() {
    if (!session) return;
    loginStudent(session);
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / header */}
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-accent text-3xl font-bold text-white shadow-md">
            ר
          </div>
          <h1 className="text-2xl font-bold text-text">רישומי חברון</h1>
          <p className="text-sm text-text-muted">הזן את מספר תעודת הזהות שלך</p>
        </div>

        <Card className="shadow-lg">
          <CardBody className="space-y-4 p-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-muted">מספר תעודת זהות</span>
              <Input
                ref={inputRef}
                inputMode="numeric"
                dir="ltr"
                maxLength={9}
                placeholder="000000000"
                value={id}
                onChange={(e) => setId(e.target.value.replace(/\D/g, ''))}
                className="tnum text-center text-2xl tracking-widest h-14"
                autoFocus
              />
            </label>

            {loading && (
              <p className="text-center text-sm text-text-muted animate-pulse">בודק…</p>
            )}

            {error && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-center text-sm text-danger">
                {error}
              </p>
            )}

            {session && !loading && (
              <div className="space-y-3 rounded-md bg-success/10 p-4 text-center">
                <p className="text-lg font-semibold text-text">שלום, {session.full_name}</p>
                <p className="text-sm text-text-muted">{session.grade} · {session.class_id}</p>
                <Button className="w-full" size="lg" onClick={confirm}>
                  המשך ←
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <p className="text-center text-xs text-text-subtle">
          בעיית כניסה? פנה למשרד הישיבה
        </p>
      </div>
    </div>
  );
}
