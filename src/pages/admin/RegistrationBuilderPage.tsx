// Registration builder (spec §20, §22). Three-pane on desktop: questions editor +
// live student preview. Saves drafts; basic "publish to everyone" wiring.
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { getRegistration, saveRegistrationDraft, publishRegistration } from '@/lib/api/registrations';
import { QuestionEditor } from '@/features/registrations/QuestionEditor';
import { StudentPreviewFrame } from '@/features/preview/StudentPreviewFrame';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import type { QuestionDef, Registration } from '@/types/registration';

function newPrimary(): QuestionDef {
  return { id: 'q_primary', type: 'presence', label: 'האם תישאר?', required: true, conditional_on: null };
}

function blankRegistration(): Registration {
  const closes = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
  return {
    id: '',
    title: '',
    description: '',
    status: 'draft',
    opens_at: null,
    closes_at: closes,
    edit_until: null,
    questions_schema: [newPrimary()],
    audience_summary: {},
    created_at: new Date().toISOString(),
    published_at: null,
    closed_at: null,
    archived_at: null,
    admin_note: null,
    template_id: null,
  };
}

export function RegistrationBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reg, setReg] = useState<Registration>(blankRegistration);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    getRegistration(id).then(({ data }) => {
      if (data) setReg(data as Registration);
    });
  }, [id]);

  const schema = reg.questions_schema;

  // builder-side validation pills (spec §20.4)
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!reg.title.trim()) errs.push('חסרה כותרת לרישום');
    if (schema[0]?.conditional_on) errs.push('השאלה הראשית לא יכולה להיות מותנית');
    schema.forEach((q, i) => {
      if (!q.label.trim()) errs.push(`שאלה ${i + 1}: חסרה תווית`);
      if ((q.type === 'single_choice' || q.type === 'multi_choice') && !(q.options?.length))
        errs.push(`שאלה ${i + 1}: חסרות אפשרויות`);
    });
    return errs;
  }, [reg.title, schema]);

  function setSchema(next: QuestionDef[]) {
    setReg((r) => ({ ...r, questions_schema: next }));
  }

  async function save(): Promise<string | null> {
    setSaving(true);
    setMsg('');
    const payload = {
      id: reg.id || undefined,
      title: reg.title,
      description: reg.description,
      closes_at: reg.closes_at,
      questions_schema: reg.questions_schema,
      status: reg.status,
    };
    const { data, error } = await saveRegistrationDraft(payload);
    setSaving(false);
    if (error || !data) {
      setMsg('שגיאה בשמירה');
      return null;
    }
    setReg(data as Registration);
    setMsg('נשמר');
    return (data as Registration).id;
  }

  async function publish() {
    if (validationErrors.length > 0) return;
    const savedId = reg.id || (await save());
    if (!savedId) return;
    const res = await publishRegistration(savedId, { everyone: true });
    if (res.error) setMsg('שגיאה בפרסום');
    else {
      setMsg(`פורסם ל-${res.data?.audience_count ?? 0} תלמידים`);
      navigate(`/admin/registrations/${savedId}/monitor`);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-xl font-bold">{id ? 'עריכת רישום' : 'רישום חדש'}</h1>

        <Card>
          <CardBody className="space-y-3">
            <Input placeholder="כותרת" value={reg.title} onChange={(e) => setReg({ ...reg, title: e.target.value })} />
            <textarea
              placeholder="תיאור (לא חובה)"
              dir="auto"
              value={reg.description ?? ''}
              onChange={(e) => setReg({ ...reg, description: e.target.value })}
              className="min-h-[72px] w-full rounded-md border border-border bg-surface p-3"
            />
            <label className="block space-y-1 text-sm">
              <span>תאריך סגירה</span>
              <Input
                type="datetime-local"
                value={toLocalInput(reg.closes_at)}
                onChange={(e) => setReg({ ...reg, closes_at: new Date(e.target.value).toISOString() })}
              />
            </label>
          </CardBody>
        </Card>

        <div className="space-y-3">
          {schema.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              earlier={schema.slice(0, i)}
              onChange={(nq) => setSchema(schema.map((x, j) => (j === i ? nq : x)))}
              onRemove={() => setSchema(schema.filter((_, j) => j !== i))}
            />
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              setSchema([
                ...schema,
                { id: `q_${nanoid(6)}`, type: 'single_choice', label: '', required: false, options: [], conditional_on: null },
              ])
            }
          >
            הוסף שאלה
          </Button>
        </div>

        {validationErrors.length > 0 && (
          <Card>
            <CardBody>
              <ul className="space-y-1 text-sm text-danger">
                {validationErrors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={save} disabled={saving}>
            {saving ? 'שומר…' : 'שמור טיוטה'}
          </Button>
          <Button onClick={publish} disabled={validationErrors.length > 0}>
            פרסם לכולם
          </Button>
          {msg && <span className="text-sm text-text-muted">{msg}</span>}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="mb-2 text-sm font-medium text-text-muted">תצוגת תלמיד מקדימה</h2>
        <StudentPreviewFrame registration={reg} />
      </div>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
