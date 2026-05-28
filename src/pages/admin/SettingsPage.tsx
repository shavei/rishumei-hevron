// Settings (spec §18.2, §12.13): admin PIN change + theme. Thresholds editing
// lands with the notifications phase.
import { useState } from 'react';
import { changeAdminPin } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useTheme } from '@/store/theme';

export function SettingsPage() {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const { theme, set } = useTheme();

  async function save() {
    setMsg('');
    setErr('');
    if (!/^[0-9]{4,8}$/.test(pin)) {
      setErr('הקוד חייב להיות 4–8 ספרות');
      return;
    }
    if (pin !== confirm) {
      setErr('הקודים אינם תואמים');
      return;
    }
    const res = await changeAdminPin(pin);
    if (res.error) setErr('שגיאה בשמירת הקוד');
    else {
      setMsg('הקוד עודכן');
      setPin('');
      setConfirm('');
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold">הגדרות</h1>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold">שינוי קוד מנהל</h2>
          <Input type="password" inputMode="numeric" dir="ltr" placeholder="קוד חדש" value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="tnum" />
          <Input type="password" inputMode="numeric" dir="ltr" placeholder="אישור קוד" value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))} className="tnum" />
          {err && <p className="text-danger">{err}</p>}
          {msg && <p className="text-success">{msg}</p>}
          <Button onClick={save}>שמור קוד</Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold">מצב תצוגה</h2>
          <div className="flex gap-2">
            <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => set('light')}>
              בהיר
            </Button>
            <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => set('dark')}>
              כהה
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
