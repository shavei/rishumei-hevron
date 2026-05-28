// Registration monitor (spec §24.3, §15). Three-state summary + per-class
// breakdown with a live (realtime) subscription scoped to this registration.
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getRegistration,
  getStateSummary,
  getClassBreakdown,
  closeRegistration,
  reopenRegistration,
} from '@/lib/api/registrations';
import { useMonitorRealtime } from '@/features/registrations/useMonitorRealtime';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Registration } from '@/types/registration';

interface Summary {
  total: number;
  responded: number;
  seen: number;
  sent: number;
}
interface ClassRow {
  class_id: string;
  responded: number;
  seen: number;
  sent: number;
}

export function RegistrationMonitorPage() {
  const { id = '' } = useParams();
  useMonitorRealtime(id);

  const { data: reg } = useQuery({
    queryKey: ['monitor', id, 'reg'],
    queryFn: async () => (await getRegistration(id)).data as Registration,
    enabled: !!id,
  });

  const { data: summary } = useQuery({
    queryKey: ['monitor', id, 'summary'],
    queryFn: async () => (await getStateSummary(id)).data as Summary,
    enabled: !!id,
    staleTime: 5_000,
  });

  const { data: byClass } = useQuery({
    queryKey: ['monitor', id, 'class'],
    queryFn: async () => ((await getClassBreakdown(id)).data ?? []) as ClassRow[],
    enabled: !!id,
    staleTime: 5_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{reg?.title ?? 'מעקב רישום'}</h1>
        <div className="flex gap-2">
          {reg?.status === 'open' && (
            <Button size="sm" variant="secondary" onClick={() => closeRegistration(id)}>
              סגור רישום
            </Button>
          )}
          {reg?.status === 'closed' && (
            <Button size="sm" variant="secondary" onClick={() => reopenRegistration(id)}>
              פתח מחדש
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Tile label="ענה" value={summary?.responded ?? 0} tone="success" />
        <Tile label="ראה ולא ענה" value={summary?.seen ?? 0} tone="warning" />
        <Tile label="טרם נצפה" value={summary?.sent ?? 0} tone="muted" />
      </div>

      <Card>
        <CardBody>
          <h2 className="mb-3 font-semibold">פילוח לפי כיתה</h2>
          <div className="space-y-2">
            {byClass?.map((c) => {
              const total = c.responded + c.seen + c.sent || 1;
              return (
                <div key={c.class_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{c.class_id}</span>
                    <span className="tnum text-text-muted">
                      {c.responded}/{total}
                    </span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-bg-2">
                    <div className="bg-success" style={{ width: `${(c.responded / total) * 100}%` }} />
                    <div className="bg-warning" style={{ width: `${(c.seen / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'muted' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-text-muted';
  return (
    <Card>
      <CardBody>
        <div className={`text-3xl font-bold tnum ${color}`}>{value}</div>
        <div className="text-sm text-text-muted">{label}</div>
      </CardBody>
    </Card>
  );
}
