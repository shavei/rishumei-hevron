// Student home (spec §36): cards for each registration in the three-state language.
import { Link } from 'react-router-dom';
import { useStudentRegistrations } from '@/features/registrations/hooks';
import { Card, CardBody } from '@/components/ui/Card';
import { formatLong, isPast } from '@/lib/date/format';
import { useStudentProfile } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

export function StudentHomePage() {
  const profile = useStudentProfile();
  const { data, isLoading, isError } = useStudentRegistrations();

  return (
    <div className="space-y-4 py-2">
      {profile && (
        <p className="text-base font-medium text-text-muted">
          שלום, <span className="text-text">{profile.full_name}</span>
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-bg-2" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardBody className="text-center text-danger">אירעה שגיאה בטעינת הרישומים</CardBody>
        </Card>
      )}

      {data && data.length === 0 && !isLoading && (
        <Card>
          <CardBody className="py-10 text-center text-text-muted">אין רישומים פתוחים כרגע</CardBody>
        </Card>
      )}

      {data?.map((reg) => {
        const closed = reg.status === 'closed' || reg.status === 'archived' || isPast(reg.closes_at);
        return (
          <Link key={reg.id} to={`/registration/${reg.id}`} className="block">
            <Card
              className={cn(
                'transition hover:shadow-md active:scale-[0.99]',
                closed ? 'opacity-55' : 'border-accent/20',
              )}
            >
              <CardBody className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold leading-tight">{reg.title}</h2>
                  {!closed && (
                    <span
                      className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-accent"
                      aria-label="ממתין לתשובה"
                    />
                  )}
                </div>
                {reg.description && (
                  <p className="line-clamp-2 text-sm text-text-muted" dir="auto">
                    {reg.description}
                  </p>
                )}
                <p className="text-xs text-text-subtle">
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
