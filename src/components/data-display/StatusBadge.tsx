// Three-state status badge (spec §8 visual language, §24.3). Used everywhere a
// per-student status appears. NOTE: `responded` includes `undecided` answers.
import { cn } from '@/lib/utils';
import type { StudentRegStatus } from '@/types/registration';

const STATUS_META: Record<StudentRegStatus, { label: string; cls: string }> = {
  sent: { label: 'טרם נצפה', cls: 'bg-bg-2 text-text-muted' },
  seen: { label: 'ראה ולא ענה', cls: 'bg-warning/15 text-warning' },
  responded: { label: 'ענה', cls: 'bg-success/15 text-success' },
};

export function StatusBadge({ status }: { status: StudentRegStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-sm font-medium', meta.cls)}>
      {meta.label}
    </span>
  );
}

/** Derive the three-state status from raw fields (shared rule). */
export function deriveStatus(seenAt: string | null, hasResponse: boolean): StudentRegStatus {
  if (hasResponse) return 'responded';
  if (seenAt) return 'seen';
  return 'sent';
}
