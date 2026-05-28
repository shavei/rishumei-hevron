-- Rishumei Hevron — indexes (spec §12).

-- students: dashboard filters
create index idx_students_grade     on public.students (grade);
create index idx_students_class_id  on public.students (class_id);
create index idx_students_is_active on public.students (is_active);

-- registrations: lifecycle + archive queries
create index idx_registrations_status      on public.registrations (status);
create index idx_registrations_closes_at   on public.registrations (closes_at);
create index idx_registrations_archived_at on public.registrations (archived_at);

-- registration_targets: active audience + student home + three-state aggregates
create index idx_targets_active_by_reg
  on public.registration_targets (registration_id) where removed_at is null;
create index idx_targets_active_by_student
  on public.registration_targets (student_id) where removed_at is null;
create index idx_targets_reg_seen
  on public.registration_targets (registration_id, seen_at);

-- responses
create index idx_responses_registration on public.responses (registration_id);
create index idx_responses_student      on public.responses (student_id);

-- notifications: unread lookups
create index idx_notifications_student_unread
  on public.notifications (student_id) where read_at is null;
create index idx_admin_notifications_unread
  on public.admin_notifications (created_at desc) where read_at is null;

-- push subscriptions
create index idx_push_student on public.push_subscriptions_student (student_id);

-- group membership reverse lookup
create index idx_group_members_student on public.group_members (student_id);
