// Admin login (spec §18.2): PIN-only with soft client-side delay after 5 failures.
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
    if (failures >= 5) await new Promise((r) => setTimeout(r, 30_000));
    const res = await adminLogin(pin);
    setLoading(false);
    if (res.error || !res.data) {
      setFailures((f) => f + 1);
      setError(
        res.error === 'rate_limited'
          ? 'המערכת ננעלה זמנית. נסה שוב מאוחר יותר.'
          : 'קוד שגוי',
      );
      setPin('');
      return;
    }
    loginAdmin(res.data.token);
    navigate('/admin', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-accent text-3xl font-bold text-white shadow-md">
            ר
          </div>
          <h1 className="text-2xl font-bold text-text">רישומי חברון</h1>
          <p className="text-sm text-text-muted">כניסת מנהל</p>
        </div>

        <Card className="shadow-lg">
          <CardBody className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-muted">קוד מנהל</span>
                <Input
                  type="password"
                  inputMode="numeric"
                  dir="ltr"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="tnum text-center text-2xl tracking-widest h-14"
                  autoFocus
                  placeholder="••••"
                />
              </label>
              {error && (
                <p className="rounded-md bg-danger/10 px-3 py-2 text-center text-sm text-danger">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || pin.length < 4}
              >
                {loading ? 'בודק…' : 'כניסה'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
