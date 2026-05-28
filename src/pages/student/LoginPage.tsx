// Student login (spec §18.1): ID-only, auto-attempt at 9 valid digits, confirm step.
import { useEffect, useState } from 'react';
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
  const { loginStudent } = useAuth();
  const navigate = useNavigate();

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
    return () => {
      cancelled = true;
    };
  }, [id]);

  function confirm() {
    if (!session) return;
    loginStudent(session);
    navigate('/');
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-accent">רישומי חברון</h1>
      <Card>
        <CardBody className="space-y-4">
          <label className="block space-y-2">
            <span className="text-base font-medium">מספר תעודת זהות</span>
            <Input
              inputMode="numeric"
              dir="ltr"
              maxLength={9}
              placeholder="9 ספרות"
              value={id}
              onChange={(e) => setId(e.target.value.replace(/\D/g, ''))}
              className="tnum text-center text-lg"
            />
          </label>

          {loading && <p className="text-center text-text-muted">בודק…</p>}
          {error && <p className="text-center text-danger">{error}</p>}

          {session && (
            <div className="space-y-3 text-center">
              <p className="text-lg">שלום, {session.full_name}</p>
              <Button className="w-full" size="lg" onClick={confirm}>
                המשך
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
