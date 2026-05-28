// Admin login (spec §18.2): PIN-only with a soft client-side delay after failures.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/api/auth';
import { useAuth } from '@/features/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

export function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [failures, setFailures] = useState(0);
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (failures >= 5) await new Promise((r) => setTimeout(r, 30_000)); // soft delay
    const res = await adminLogin(pin);
    setLoading(false);
    if (res.error || !res.data) {
      setFailures((f) => f + 1);
      setError(res.error === 'rate_limited' ? 'המערכת ננעלה זמנית. נסה שוב מאוחר יותר.' : 'קוד שגוי');
      return;
    }
    loginAdmin(res.data.token);
    navigate('/admin');
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-accent">ניהול · רישומי חברון</h1>
      <Card>
        <CardBody>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-base font-medium">קוד מנהל</span>
              <Input
                type="password"
                inputMode="numeric"
                dir="ltr"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="tnum text-center text-lg"
              />
            </label>
            {error && <p className="text-center text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading || pin.length < 4}>
              {loading ? 'בודק…' : 'כניסה'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
