// Registration + response API wrappers (spec §9, §14). Columns are always
// explicit — never `select *` from the client.
import { supabase } from './supabase';
import type { Registration, ResponseValues } from '@/types/registration';
import type { AudienceInput } from '@/types/audience';

const REG_COLUMNS =
  'id, title, description, status, opens_at, closes_at, edit_until, questions_schema, ' +
  'audience_summary, created_at, published_at, closed_at, archived_at, admin_note, template_id';

/** Registrations visible to the logged-in student (RLS-scoped). */
export async function listStudentRegistrations() {
  return supabase
    .from('registrations')
    .select(REG_COLUMNS)
    .in('status', ['open', 'scheduled', 'closed'])
    .order('closes_at', { ascending: true })
    .returns<Registration[]>();
}

export async function getRegistration(id: string) {
  return supabase.from('registrations').select(REG_COLUMNS).eq('id', id).single().returns<Registration>();
}

/** The student's own response for a registration, if any. */
export async function getMyResponse(registrationId: string) {
  return supabase
    .from('responses')
    .select('registration_id, student_id, values, responded_at, submitted_via, last_edited_by_admin_at')
    .eq('registration_id', registrationId)
    .maybeSingle();
}

export async function markSeen(registrationId: string) {
  return supabase.rpc('mark_registration_seen', { p_registration_id: registrationId });
}

export async function submitResponse(registrationId: string, values: ResponseValues) {
  return supabase.rpc('submit_response', {
    p_registration_id: registrationId,
    p_values: values,
  });
}

// --- admin ---------------------------------------------------------------

export async function listRegistrationsAdmin(includeArchived = false) {
  let q = supabase.from('registrations').select(REG_COLUMNS).order('created_at', { ascending: false });
  if (!includeArchived) q = q.neq('status', 'archived');
  return q.returns<Registration[]>();
}

export async function saveRegistrationDraft(reg: Partial<Registration> & { id?: string }) {
  if (reg.id) {
    return supabase.from('registrations').update(reg).eq('id', reg.id).select(REG_COLUMNS).single().returns<Registration>();
  }
  return supabase.from('registrations').insert(reg).select(REG_COLUMNS).single().returns<Registration>();
}

export async function publishRegistration(registrationId: string, audience: AudienceInput) {
  return supabase.rpc('publish_registration', {
    p_registration_id: registrationId,
    p_audience: audience,
  });
}

export async function closeRegistration(id: string) {
  return supabase.rpc('close_registration', { p_registration_id: id });
}
export async function reopenRegistration(id: string) {
  return supabase.rpc('reopen_registration', { p_registration_id: id });
}
export async function archiveRegistration(id: string) {
  return supabase.rpc('archive_registration', { p_registration_id: id });
}

export async function adminSubmitOnBehalf(
  registrationId: string,
  studentId: string,
  values: ResponseValues,
) {
  return supabase.rpc('admin_submit_response_on_behalf', {
    p_registration_id: registrationId,
    p_student_id: studentId,
    p_values: values,
  });
}

export async function getStateSummary(registrationId: string) {
  return supabase.rpc('registration_state_summary', { p_registration_id: registrationId });
}

export async function getClassBreakdown(registrationId: string) {
  return supabase.rpc('registration_class_breakdown', { p_registration_id: registrationId });
}
