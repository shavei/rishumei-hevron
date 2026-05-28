// CSV import wizard (spec §17.3): upload → preview → confirm → result.
import { useState } from 'react';
import Papa from 'papaparse';
import {
  csvImportValidate,
  csvImportCommit,
  type ImportPreview,
  type ImportSummary,
} from '@/lib/api/functions';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

type Step = 'upload' | 'preview' | 'done' | 'error';

export function CsvImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [runId, setRunId] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function onFile(file: File) {
    setBusy(true);
    setError('');
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const res = await csvImportValidate(result.data);
        setBusy(false);
        if (res.error) {
          setError(
            res.error === 'duplicate_ids'
              ? `נמצאו מספרי זהות כפולים: ${res.duplicates?.join(', ')}`
              : res.error === 'empty_file'
                ? 'הקובץ ריק'
                : 'שגיאת עיבוד — ודא שהקובץ בקידוד UTF-8',
          );
          setStep('error');
          return;
        }
        setRunId(res.run_id ?? '');
        setPreview(res.preview ?? null);
        setSummary(res.summary ?? null);
        setStep('preview');
      },
      error: () => {
        setBusy(false);
        setError('שגיאה בקריאת הקובץ');
        setStep('error');
      },
    });
  }

  async function commit() {
    setBusy(true);
    const res = await csvImportCommit(runId);
    setBusy(false);
    if (res.error) {
      setError('שגיאה בשמירה');
      setStep('error');
      return;
    }
    setSummary((s) => ({ ...(s as ImportSummary), ...res.summary }));
    setStep('done');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ייבוא תלמידים מ-CSV</h1>

      {step === 'upload' && (
        <Card>
          <CardBody className="space-y-3">
            <p className="text-text-muted">בחר קובץ CSV בקידוד UTF-8 עם הכותרות: שם מלא, תעודת זהות, שכבה, כיתה.</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              disabled={busy}
            />
            {busy && <p className="text-text-muted">מעבד…</p>}
          </CardBody>
        </Card>
      )}

      {step === 'preview' && preview && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="להוספה" value={summary.created} />
            <Stat label="לעדכון" value={summary.updated} />
            <Stat label="להשבתה" value={summary.inactivated} />
            <Stat label="שגיאות" value={summary.errors} tone={summary.errors ? 'danger' : undefined} />
          </div>

          <PreviewSection title="להוספה" rows={preview.toCreate.map((s) => `${s.full_name} · ${s.id_number} · ${s.grade}`)} />
          <PreviewSection
            title="לעדכון"
            rows={preview.toUpdate.map(
              (u) =>
                `${u.id_number}${u.reactivate ? ' (יופעל מחדש)' : ''}: ` +
                Object.entries(u.changes).map(([f, [a, b]]) => `${f}: ${a}→${b}`).join(', '),
            )}
          />
          <PreviewSection title="להשבתה (לא בקובץ)" rows={preview.toInactivate.map((s) => s.full_name ?? s.id_number)} />
          {preview.errors.length > 0 && (
            <PreviewSection
              title="שגיאות"
              tone="danger"
              rows={preview.errors.map((e) => `שורה ${e.row}: ${e.reason} (${e.value})`)}
            />
          )}

          <div className="flex gap-2">
            <Button onClick={commit} disabled={busy}>
              {busy ? 'מחיל…' : 'החל שינויים'}
            </Button>
            <Button variant="secondary" onClick={() => setStep('upload')} disabled={busy}>
              ביטול
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && summary && (
        <Card>
          <CardBody className="space-y-2">
            <h2 className="text-lg font-semibold text-success">הייבוא הושלם</h2>
            <p className="text-text-muted">
              נוספו {summary.created}, עודכנו {summary.updated}, הושבתו {summary.inactivated}.
            </p>
            <Button variant="secondary" onClick={() => setStep('upload')}>
              ייבוא נוסף
            </Button>
          </CardBody>
        </Card>
      )}

      {step === 'error' && (
        <Card>
          <CardBody className="space-y-2">
            <p className="text-danger">{error}</p>
            <Button variant="secondary" onClick={() => setStep('upload')}>
              נסה שוב
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <Card>
      <CardBody>
        <div className={`text-2xl font-bold tnum ${tone === 'danger' ? 'text-danger' : 'text-accent'}`}>{value}</div>
        <div className="text-sm text-text-muted">{label}</div>
      </CardBody>
    </Card>
  );
}

function PreviewSection({ title, rows, tone }: { title: string; rows: string[]; tone?: 'danger' }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardBody>
        <h3 className={`mb-2 font-semibold ${tone === 'danger' ? 'text-danger' : ''}`}>
          {title} ({rows.length})
        </h3>
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-text-muted">
          {rows.map((r, i) => (
            <li key={i} dir="auto">
              {r}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
