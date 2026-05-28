-- Rishumei Hevron — Row Level Security (spec §16).
-- Default deny on every table, then allow specifically.

alter table public.students                   enable row level security;
alter table public.templates                  enable row level security;
alter table public.registrations              enable row level security;
alter table public.registration_targets       enable row level security;
alter table public.responses                  enable row level security;
alter table public.response_history           enable row level security;
alter table public.groups                     enable row level security;
alter table public.group_members              enable row level security;
alter table public.question_library_items     enable row level security;
alter table public.notifications              enable row level security;
alter table public.admin_notifications        enable row level security;
alter table public.push_subscriptions_student enable row level security;
alter table public.push_subscriptions_admin   enable row level security;
alter table public.app_settings               enable row level security;
alter table public.csv_import_runs            enable row level security;

-- ===========================================================================
-- ADMIN: full read on everything; direct write on library/lookup tables only.
-- (State changes to registrations/responses go through SECURITY DEFINER RPC.)
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'students','templates','registrations','registration_targets','responses',
    'response_history','groups','group_members','question_library_items',
    'notifications','admin_notifications','push_subscriptions_student',
    'push_subscriptions_admin','app_settings','csv_import_runs'
  ] loop
    execute format(
      'create policy admin_read_all on public.%I for select using (rh.is_admin());', t);
  end loop;

  foreach t in array array[
    'groups','group_members','question_library_items','templates'
  ] loop
    execute format(
      'create policy admin_write on public.%I for all using (rh.is_admin()) with check (rh.is_admin());', t);
  end loop;
end $$;

-- app_settings: admin may update thresholds/PIN directly.
create policy admin_write_settings on public.app_settings
  for update using (rh.is_admin()) with check (rh.is_admin());

-- ===========================================================================
-- STUDENT: read only own rows. No direct writes (all via RPC).
-- ===========================================================================

-- registration_targets: own, not removed.
create policy student_read_targets on public.registration_targets
  for select using (
    student_id = rh.current_student_id() and removed_at is null
  );

-- responses: own.
create policy student_read_responses on public.responses
  for select using (student_id = rh.current_student_id());

-- notifications: own.
create policy student_read_notifications on public.notifications
  for select using (student_id = rh.current_student_id());

-- push subscriptions: own (read; writes happen via RPC/edge with service role).
create policy student_read_push on public.push_subscriptions_student
  for select using (student_id = rh.current_student_id());

-- registrations: visible if the student has an active target row.
create policy student_read_registrations on public.registrations
  for select using (
    exists (
      select 1 from public.registration_targets rt
      where rt.registration_id = registrations.id
        and rt.student_id = rh.current_student_id()
        and rt.removed_at is null
    )
  );

-- Anonymous (no token) gets nothing: with RLS enabled and no anon policy,
-- selects return zero rows. Login RPCs are SECURITY DEFINER and granted to anon.
