// Student registration detail page (spec §23). Wires the shared detail component
// to real persistence: mark-seen on mount, submit_response on save.
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRegistration, useMyResponse } from '@/features/registrations/hooks';
import { markSeen, submitResponse } from '@/lib/api/registrations';
import { StudentRegistrationDetail } from '@/features/registrations/StudentRegistrationDetail';
import type { ResponseValues } from '@/types/registration';

export function RegistrationDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { data: reg, isLoading } = useRegistration(id);
  const { data: response } = useMyResponse(id);

  // fire-and-forget seen tracking on mount (spec §24.2)
  useEffect(() => {
    if (id) markSeen(id).catch(() => {});
  }, [id]);

  if (isLoading || !reg) return <p className="text-text-muted">טוען…</p>;

  const initialValues = (response?.values ?? {}) as ResponseValues;
  const hasResponse = !!response;

  async function handleSubmit(values: ResponseValues): Promise<boolean> {
    const { data, error } = await submitResponse(id, values);
    if (error || data?.error) return false;
    qc.invalidateQueries({ queryKey: ['registration', id, 'my-response'] });
    qc.invalidateQueries({ queryKey: ['student', 'registrations'] });
    return true;
  }

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-accent">
        ← חזרה
      </Link>
      <StudentRegistrationDetail
        registration={reg}
        initialValues={initialValues}
        mode={hasResponse ? 'answered' : 'unanswered'}
        editedByAdminAt={response?.last_edited_by_admin_at ?? null}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
