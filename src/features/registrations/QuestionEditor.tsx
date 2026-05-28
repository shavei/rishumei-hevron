// Per-question editor used by the builder (spec §20.2–20.4).
import { nanoid } from 'nanoid';
import type { QuestionDef, QuestionType } from '@/types/registration';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const TYPE_LABEL: Record<QuestionType, string> = {
  presence: 'נוכחות (ברירת מחדל)',
  yes_no: 'כן / לא',
  single_choice: 'בחירה יחידה',
  multi_choice: 'בחירה מרובה',
  text: 'טקסט חופשי',
};

interface Props {
  question: QuestionDef;
  index: number;
  /** earlier questions, for the conditional source dropdown */
  earlier: QuestionDef[];
  onChange: (q: QuestionDef) => void;
  onRemove: () => void;
}

export function QuestionEditor({ question, index, earlier, onChange, onRemove }: Props) {
  const isPrimary = index === 0;
  const hasOptions = question.type === 'single_choice' || question.type === 'multi_choice';

  function patch(p: Partial<QuestionDef>) {
    onChange({ ...question, ...p });
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">
          {isPrimary ? 'שאלה ראשית' : `שאלה ${index + 1}`}
        </span>
        {!isPrimary && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            הסר
          </Button>
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-sm">סוג</span>
        <select
          value={question.type}
          onChange={(e) => patch({ type: e.target.value as QuestionType })}
          className="w-full rounded-md border border-border bg-surface px-2 py-2"
        >
          {Object.entries(TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <Input
        placeholder="תווית השאלה"
        value={question.label}
        onChange={(e) => patch({ label: e.target.value })}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(e) => patch({ required: e.target.checked })}
        />
        חובה
      </label>

      {hasOptions && (
        <div className="space-y-2">
          <span className="text-sm">אפשרויות</span>
          {(question.options ?? []).map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="תווית"
                value={opt.label}
                onChange={(e) => {
                  const options = [...(question.options ?? [])];
                  options[i] = { ...opt, label: e.target.value, value: opt.value || nanoid(6) };
                  patch({ options });
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => patch({ options: (question.options ?? []).filter((_, j) => j !== i) })}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => patch({ options: [...(question.options ?? []), { value: nanoid(6), label: '' }] })}
          >
            הוסף אפשרות
          </Button>
        </div>
      )}

      {!isPrimary && earlier.length > 0 && (
        <ConditionalEditor question={question} earlier={earlier} onChange={onChange} />
      )}
    </div>
  );
}

function ConditionalEditor({
  question,
  earlier,
  onChange,
}: {
  question: QuestionDef;
  earlier: QuestionDef[];
  onChange: (q: QuestionDef) => void;
}) {
  const cond = question.conditional_on ?? null;
  const source = earlier.find((q) => q.id === cond?.question_id);

  return (
    <div className="space-y-2 rounded-sm bg-bg-2 p-3 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!cond}
          onChange={(e) =>
            onChange({
              ...question,
              conditional_on: e.target.checked
                ? { question_id: earlier[0].id, equals: '' }
                : null,
            })
          }
        />
        הצג רק בתנאי
      </label>

      {cond && (
        <div className="flex flex-wrap items-center gap-2">
          <span>אם התשובה ל-</span>
          <select
            value={cond.question_id}
            onChange={(e) =>
              onChange({ ...question, conditional_on: { ...cond, question_id: e.target.value } })
            }
            className="rounded-md border border-border bg-surface px-2 py-1"
          >
            {earlier.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label || q.id}
              </option>
            ))}
          </select>
          <span>היא</span>
          <ValuePicker
            source={source}
            value={String(cond.equals)}
            onChange={(v) => onChange({ ...question, conditional_on: { ...cond, equals: v } })}
          />
        </div>
      )}
    </div>
  );
}

function ValuePicker({
  source,
  value,
  onChange,
}: {
  source?: QuestionDef;
  value: string;
  onChange: (v: string) => void;
}) {
  let opts: { value: string; label: string }[] = [];
  if (source?.type === 'presence')
    opts = [
      { value: 'present', label: 'נוכח' },
      { value: 'absent', label: 'לא נוכח' },
      { value: 'undecided', label: 'מתלבט' },
    ];
  else if (source?.type === 'yes_no')
    opts = [
      { value: 'yes', label: 'כן' },
      { value: 'no', label: 'לא' },
    ];
  else if (source?.options) opts = source.options;

  if (opts.length === 0) {
    return <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-40" />;
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1"
    >
      <option value="">בחר…</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
