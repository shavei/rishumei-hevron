// Student home (spec §36): cards for each registration in the three-state language.
import { Link } from 'react-router-dom';
import { useStudentRegistrations } from '@/features/registrations/hooks';
import { Card, CardBody } from '@/components/ui/Card';
import { formatLong, isPast } from '@/lib/date/format';
import { useStudentProfile } from '@/features/auth/AuthProvider';

export function StudentHomePage() {
  const profile = useStudentProfile();
  const { data, isLoading, isError } = useStudentRegistrations();

  return (
    <div className="space-y-4">
      {profile && <p className="text-text-muted">שלום, {profile.full_name}</p>}

      {isLoading && <p className="text-text-muted">טוען…</p>}
      {isError && <p className="text-danger">אירעה שגיאה בטעינת הרישומים</p>}

      {data && data.length === 0 && (
        <Card>
          <CardBody className="text-center text-text-muted">אין רישומים פתוחים כרגע</CardBody>
        </Card>
      )}

      {data?.map((reg) => {
        const closed = reg.status === 'closed' || isPast(reg.closes_at);
        return (
          <Link key={reg.id} to={`/registration/${reg.id}`}>
            <Card className={closed ? 'opacity-60' : ''}>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{reg.title}</h2>
                  {!closed && <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />}
                </div>
                {reg.description && (
                  <p className="line-clamp-2 text-sm text-text-muted" dir="auto">
                    {reg.description}
                  </p>
                )}
                <p className="text-sm text-text-subtle">
                  {closed ? 'סגור' : `נסגר ב-${formatLong(reg.closes_at)}`}
                </p>
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
