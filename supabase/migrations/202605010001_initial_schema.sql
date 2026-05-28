-- Rishumei Hevron — initial schema (spec §12).
-- All timestamps are TIMESTAMPTZ (UTC in storage, displayed in Asia/Jerusalem).
-- Tables only here; indexes in 0002, RLS in 0003, RPC in 0004+.

create extension if not exists "pgcrypto"; -- gen_random_uuid, hmac, digest

-- ---------------------------------------------------------------------------
-- 12.1 students  (identity is CSV-owned; activity flags are system-owned)
-- ---------------------------------------------------------------------------
create table public.students (
  id                  uuid primary key default gen_random_uuid(),
  id_number           text not null unique check (id_number ~ '^[0-9]{9}$'),
  full_name           text not null,
  grade               text not null,
  class_id            text not null,
  is_active           boolean not null default true,
  inactivated_at      timestamptz,
  inactivated_reason  text check (inactivated_reason in ('csv_missing', 'admin_disabled')),
  created_at          timestamptz not null default now(),
  last_imported_at    timestamptz
);

-- ---------------------------------------------------------------------------
-- 12.9 templates  (declared before registrations for the FK)
-- ---------------------------------------------------------------------------
create table public.templates (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  template_payload  jsonb not null,
  created_at        timestamptz not null default now(),
  last_used_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- 12.2 registrations  (the "form" itself)
-- ---------------------------------------------------------------------------
create table public.registrations (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  status            text not null default 'draft'
                      check (status in ('draft', 'scheduled', 'open', 'closed', 'archived')),
  opens_at          timestamptz,
  closes_at         timestamptz not null,
  edit_until        timestamptz,
  questions_schema  jsonb not null default '[]'::jsonb,
  audience_summary  jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  published_at      timestamptz,
  closed_at         timestamptz,
  archived_at       timestamptz,
  admin_note        text,
  template_id       uuid references public.templates(id) on delete set null,
  constraint registrations_closes_after_opens
    check (closes_at > coalesce(opens_at, created_at)),
  constraint registrations_edit_until_valid
    check (edit_until is null or edit_until >= created_at)
);

-- ---------------------------------------------------------------------------
-- 12.3 registration_targets  (audience snapshot + three-state seen tracking)
-- ---------------------------------------------------------------------------
create table public.registration_targets (
  registration_id   uuid not null references public.registrations(id) on delete cascade,
  student_id        uuid not null references public.students(id) on delete restrict,
  student_snapshot  jsonb not null,
  added_at          timestamptz not null default now(),
  seen_at           timestamptz,
  removed_at        timestamptz,
  removed_reason    text,
  primary key (registration_id, student_id)
);

-- ---------------------------------------------------------------------------
-- 12.4 responses  (the current response)
-- ---------------------------------------------------------------------------
create table public.responses (
  registration_id          uuid not null references public.registrations(id) on delete cascade,
  student_id               uuid not null references public.students(id) on delete restrict,
  values                   jsonb not null,
  responded_at             timestamptz not null default now(),
  submitted_via            text not null check (submitted_via in ('student', 'admin_on_behalf')),
  last_edited_by_admin_at  timestamptz,
  primary key (registration_id, student_id)
);

-- ---------------------------------------------------------------------------
-- 12.5 response_history  (exactly one prior version per admin edit)
-- ---------------------------------------------------------------------------
create table public.response_history (
  id                      uuid primary key default gen_random_uuid(),
  registration_id         uuid not null references public.registrations(id) on delete cascade,
  student_id              uuid not null references public.students(id) on delete restrict,
  previous_values         jsonb not null,
  previous_responded_at   timestamptz not null,
  previous_submitted_via  text not null,
  replaced_at             timestamptz not null default now(),
  unique (registration_id, student_id) -- one prior version only
);

-- ---------------------------------------------------------------------------
-- 12.6 / 12.7 groups + membership
-- ---------------------------------------------------------------------------
create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  created_at   timestamptz not null default now()
);

create table public.group_members (
  group_id    uuid not null references public.groups(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  primary key (group_id, student_id)
);

-- ---------------------------------------------------------------------------
-- 12.8 question_library_items
-- ---------------------------------------------------------------------------
create table public.question_library_items (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  kind        text not null check (kind in ('single_question', 'block')),
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 12.10 notifications (student-side internal center)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students(id) on delete cascade,
  kind             text not null
                     check (kind in ('new_registration', 'reminder', 'deadline_changed', 'reopened', 'closing_soon')),
  registration_id  uuid references public.registrations(id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  read_at          timestamptz
);

-- ---------------------------------------------------------------------------
-- 12.11 admin_notifications (single shared admin bucket)
-- ---------------------------------------------------------------------------
create table public.admin_notifications (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null
                     check (kind in ('closing_soon', 'low_response_rate', 'many_unanswered', 'sync_problem', 'export_ready', 'push_failure_summary')),
  registration_id  uuid references public.registrations(id) on delete cascade,
  severity         text not null check (severity in ('info', 'warn', 'urgent')),
  body             text not null,
  data             jsonb,
  created_at       timestamptz not null default now(),
  read_at          timestamptz
);

-- ---------------------------------------------------------------------------
-- 12.12 push subscriptions (student + admin)
-- ---------------------------------------------------------------------------
create table public.push_subscriptions_student (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id) on delete cascade,
  device_label   text,
  subscription   jsonb not null,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz,
  failure_count  int not null default 0
);

create table public.push_subscriptions_admin (
  id             uuid primary key default gen_random_uuid(),
  device_label   text,
  subscription   jsonb not null,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz,
  failure_count  int not null default 0
);

-- ---------------------------------------------------------------------------
-- 12.13 app_settings (key-value)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 12.14 csv_import_runs (audit + last-run preview)
-- ---------------------------------------------------------------------------
create table public.csv_import_runs (
  id           uuid primary key default gen_random_uuid(),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'previewing'
                 check (status in ('previewing', 'committed', 'aborted', 'failed')),
  summary      jsonb,
  errors       jsonb,
  preview      jsonb -- the computed diff, kept until commit/abort
);
