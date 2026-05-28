// Live student preview (spec §22). Renders the SAME StudentRegistrationDetail
// component inside a device-shaped frame with simulation controls. No network.
import { useState } from 'react';
import type { Registration, ResponseValues } from '@/types/registration';
import { StudentRegistrationDetail, type DetailMode } from '@/features/registrations/StudentRegistrationDetail';
import { cn } from '@/lib/utils';

const DEVICES = {
  'phone-narrow': 360,
  'phone-wide': 414,
  tablet: 768,
} as const;
type Device = keyof typeof DEVICES;

const MODES: DetailMode[] = ['unanswered', 'viewing', 'answered', 'editing', 'closed', 'submitted-success'];
const MODE_LABEL: Record<DetailMode, string> = {
  unanswered: 'טרם ענה',
  viewing: 'צופה',
  answered: 'ענה',
  editing: 'עריכה',
  closed: 'סגור',
  'submitted-success': 'אישור שליחה',
};

export function StudentPreviewFrame({ registration }: { registration: Registration }) {
  const [device, setDevice] = useState<Device>('phone-narrow');
  const [mode, setMode] = useState<DetailMode>('unanswered');
  const [values] = useState<ResponseValues>({});

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value as Device)}
          className="rounded-md border border-border bg-surface px-2 py-1"
        >
          {Object.keys(DEVICES).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as DetailMode)}
          className="rounded-md border border-border bg-surface px-2 py-1"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {MODE_LABEL[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center">
        <div
          className={cn('overflow-hidden rounded-xl border border-border bg-bg shadow-lg')}
          style={{ width: DEVICES[device], maxWidth: '100%' }}
          dir="rtl"
        >
          <div className="max-h-[640px] overflow-y-auto p-4">
            <StudentRegistrationDetail
              registration={registration}
              initialValues={values}
              mode={mode}
              preview
            />
          </div>
        </div>
      </div>
    </div>
  );
}
