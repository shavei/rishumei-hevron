// THE shared student detail component (spec §22.5). The real student page and the
// admin live-preview both render this. It accepts all state via props and makes
// NO network calls — the caller owns persistence and side effects.
import { useMemo, useState } from 'react';
import type { Registration, ResponseValues, ResponseValue } from '@/types/registration';
import { visibleQuestions, stripHiddenValues } from '@/lib/conditional/evaluate';
import { QuestionField } from './QuestionField';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { formatLong } from '@/lib/date/format';

export type DetailMode =
  | 'unanswered'
  | 'viewing'
  | 'answered'
  | 'editing'
  | 'closed'
  | 'submitted-success';

interface Props {
  registration: Registration;
  initialValues?: ResponseValues;
  now?: Date;
  mode?: DetailMode;
  /** Returns true on success so the component can show the success state. */
  onSubmit?: (values: ResponseValues) => Promise<boolean> | boolean;
  /** Preview mode makes the submit button inert (spec §22.6). */
  preview?: boolean;
  editedByAdminAt?: string | null;
}

export function StudentRegistrationDetail({
  registration,
  initialValues = {},
  now = new Date(),
  mode = 'unanswered',
  onSubmit,
  preview = false,
  editedByAdminAt = null,
}: Props) {
  const [values, setValues] = useState<ResponseValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalMode, setInternalMode] = useState<DetailMode>(mode);
  const [submitting, setSubmitting] = useState(false);

  const visible = useMemo(() => visibleQuestions(registration.questions_schema, values), [registration.questions_schema, values]);

  const isClosed =
    internalMode === 'closed' ||
    registration.status === 'closed' ||
    registration.status === 'archived' ||
    new Date(registration.closes_at).getTime() <= now.getTime();

  const editUntil = registration.edit_until ?? registration.closes_at;

  function setValue(id: string, v: ResponseValue) {
    setValues((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => ({ ...prev, [id]: '' }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const q of visible) {
      if (!q.required) continue;
      const v = values[q.id];
      const empty =
        v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) next[q.id] = 'נא לענות על שאלה זו';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (preview) return; // inert in preview (spec §22.6)
    if (!validate()) return;
    setSubmitting(true);
    try {
      const cleaned = stripHiddenValues(registration.questions_schema, values);
      const ok = (await onSubmit?.(cleaned)) ?? false;
      if (ok) setInternalMode('submitted-success');
    } finally {
      setSubmitting(false);
    }
  }

  if (internalMode === 'submitted-success') {
    return (
      <Card>
        <CardBody className="space-y-3 text-center">
          <div className="text-2xl">✓</div>
          <h2 className="text-lg font-semibold text-success">תשובתך נקלטה</h2>
          <p className="text-text-muted">{formatLong(now)}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-text">{registration.title}</h1>
        {registration.description && (
          <p className="text-text-muted" dir="auto">
            {registration.description}
          </p>
        )}
        <p className="text-sm text-text-subtle">
          {isClosed ? 'הרישום סגור' : `ניתן לערוך עד ${formatLong(editUntil)}`}
        </p>
        {editedByAdminAt && (
          <p className="text-sm text-info">נערך על ידי המנהל ב-{formatLong(editedByAdminAt)}</p>
        )}
      </header>

      {isClosed ? (
        <Card>
          <CardBody className="text-center text-text-muted">הרישום סגור — לא ניתן להגיב</CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-5">
            {visible.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                value={values[q.id]}
                onChange={(v) => setValue(q.id, v)}
                error={errors[q.id]}
              />
            ))}
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? 'שומר…' : 'שמור'}
          </Button>
          {preview && (
            <p className="text-center text-sm text-text-subtle">תצוגה מקדימה — אין שמירה</p>
          )}
        </>
      )}
    </div>
  );
}
