// Admin dashboard — Bento overview (spec §37). v1 shows live registration counts;
// richer tiles (response-over-time, alerts) land in Phase 9/10.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listRegistrationsAdmin } from '@/lib/api/registrations';
import { Card, CardBody } from '@/components/ui/Card';
import { formatShort } from '@/lib/date/format';
import type { Registration } from '@/types/registration';

const STATUS_LABEL: Record<string, string> = {
  draft: 'טיוטה',
  scheduled: 'מתוזמן',
  open: 'פתוח',
  closed: 'סגור',
  archived: 'בארכיון',
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'registrations'],
    queryFn: async () => {
      const { data, error } = await listRegistrationsAdmin();
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });

  const open = data?.filter((r) => r.status === 'open').length ?? 0;
  const drafts = data?.filter((r) => r.status === 'draft').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="רישומים פתוחים" value={open} />
        <Tile label="טיוטות" value={drafts} />
        <Tile label="סה״כ רישומים" value={data?.length ?? 0} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">רישומים אחרונים</h2>
          <Link to="/admin/registrations" className="text-sm text-accent">
            כל הרישומים
          </Link>
        </div>
        {isLoading && <p className="text-text-muted">טוען…</p>}
        <div className="space-y-2">
          {data?.slice(0, 8).map((reg) => (
            <Link key={reg.id} to={`/admin/registrations/${reg.id}/monitor`}>
              <Card>
                <CardBody className="flex items-center justify-between">
                  <span className="font-medium">{reg.title}</span>
                  <span className="flex items-center gap-3 text-sm text-text-muted">
                    <span>{STATUS_LABEL[reg.status]}</span>
                    <span className="tnum">{formatShort(reg.closes_at)}</span>
                  </span>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <div className="text-3xl font-bold tnum text-accent">{value}</div>
        <div className="text-sm text-text-muted">{label}</div>
      </CardBody>
    </Card>
  );
}
