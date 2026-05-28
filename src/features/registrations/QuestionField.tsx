// Renders a single question input. Shared by the student flow and the preview.
import type { QuestionDef, ResponseValue } from '@/types/registration';
import { DEFAULT_PRESENCE_LABELS, DEFAULT_YES_NO_LABELS } from '@/types/registration';
import { cn } from '@/lib/utils';

interface Props {
  question: QuestionDef;
  value: ResponseValue | undefined;
  onChange: (value: ResponseValue) => void;
  disabled?: boolean;
  error?: string;
}

export function QuestionField({ question, value, onChange, disabled, error }: Props) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-base font-medium text-text">
        {question.label || <span className="text-danger">שאלה ללא תווית</span>}
        {question.required && <span className="text-danger"> *</span>}
      </legend>
      {question.help_text && <p className="text-sm text-text-muted">{question.help_text}</p>}

      {renderControl(question, value, onChange)}

      {error && <p className="text-sm text-danger">{error}</p>}
    </fieldset>
  );
}

function renderControl(
  q: QuestionDef,
  value: ResponseValue | undefined,
  onChange: (v: ResponseValue) => void,
) {
  switch (q.type) {
    case 'presence': {
      const labels = { ...DEFAULT_PRESENCE_LABELS, ...q.labels };
      return (
        <ChoiceButtons
          options={[
            { value: 'present', label: labels.present },
            { value: 'absent', label: labels.absent },
            { value: 'undecided', label: labels.undecided },
          ]}
          selected={value as string}
          onSelect={onChange}
        />
      );
    }
    case 'yes_no': {
      const labels = { ...DEFAULT_YES_NO_LABELS, ...q.labels };
      return (
        <ChoiceButtons
          options={[
            { value: 'yes', label: labels.yes },
            { value: 'no', label: labels.no },
          ]}
          selected={value as string}
          onSelect={onChange}
        />
      );
    }
    case 'single_choice':
      if (!q.options?.length) return <EmptyOptions />;
      return (
        <ChoiceButtons
          options={q.options}
          selected={value as string}
          onSelect={onChange}
        />
      );
    case 'multi_choice':
      if (!q.options?.length) return <EmptyOptions />;
      return (
        <div className="flex flex-wrap gap-2">
          {q.options.map((o) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const on = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() =>
                  onChange(on ? arr.filter((v) => v !== o.value) : [...arr, o.value])
                }
                className={cn(
                  'rounded-md border px-4 py-2 text-base transition',
                  on ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-text',
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    case 'text':
      return (
        <textarea
          dir="auto"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[88px] w-full rounded-md border border-border bg-surface p-3 text-base text-text focus:border-accent focus:outline-none"
        />
      );
    default:
      return null;
  }
}

function ChoiceButtons({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string | undefined;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={cn(
            'min-w-20 rounded-md border px-4 py-2 text-base transition',
            selected === o.value
              ? 'border-accent bg-accent text-accent-fg'
              : 'border-border bg-surface text-text hover:bg-bg-2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyOptions() {
  return <p className="text-sm text-text-subtle">אין אפשרויות עדיין</p>;
}
