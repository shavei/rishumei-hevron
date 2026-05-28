// Registrations list (spec §37). Filter by status; link to monitor/edit.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listRegistrationsAdmin } from '@/lib/api/registrations';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { formatShort } from '@/lib/date/format';
import type { Registration, RegistrationStatus } from '@/types/registration';

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  draft: 'טיוטה',
  scheduled: 'מתוזמן',
  open: 'פתוח',
  closed: 'סגור',
  archived: 'בארכיון',
};

export function RegistrationsListPage() {
  const [filter, setFilter] = useState<RegistrationStatus | 'all'>('all');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'registrations', 'list'],
    queryFn: async () => {
      const { data, error } = await listRegistrationsAdmin(true);
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });

  const filtered = data?.filter((r) => filter === 'all' || r.status === filter) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">רישומים</h1>
        <Link to="/admin/registrations/new">
          <Button>רישום חדש</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-1">
        {(['all', 'open', 'draft', 'scheduled', 'closed', 'archived'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'primary' : 'ghost'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'הכל' : STATUS_LABEL[f]}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-text-muted">טוען…</p>}

      <div className="space-y-2">
        {filtered.map((reg) => (
          <Card key={reg.id}>
            <CardBody className="flex items-center justify-between">
              <div>
                <div className="font-medium">{reg.title}</div>
                <div className="text-sm text-text-muted">
                  {STATUS_LABEL[reg.status]} · נסגר {formatShort(reg.closes_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/registrations/${reg.id}/monitor`}>
                  <Button size="sm" variant="secondary">
                    מעקב
                  </Button>
                </Link>
                <Link to={`/admin/registrations/${reg.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    עריכה
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
