-- Rishumei Hevron — registration lifecycle RPCs (spec §14.6–14.9, §19, §21).
-- All require an admin JWT and run in a single transaction.

-- Resolve an AudienceInput payload to a concrete set of student ids.
create or replace function rh.resolve_audience(p_audience jsonb)
returns setof uuid
language sql stable
set search_path = public, rh
as $$
  with params as (
    select
      coalesce(p_audience -> 'groups', '[]'::jsonb)      as groups,
      coalesce(p_audience -> 'grades', '[]'::jsonb)      as grades,
      coalesce(p_audience -> 'classes', '[]'::jsonb)     as classes,
      coalesce(p_audience -> 'individuals', '[]'::jsonb) as individuals,
      coalesce(p_audience -> 'paste_ids', '[]'::jsonb)   as paste_ids,
      coalesce((p_audience ->> 'everyone')::boolean, false)         as everyone,
      coalesce((p_audience ->> 'include_inactive')::boolean, false) as include_inactive
  )
  select distinct s.id
  from public.students s, params p
  where (p.include_inactive or s.is_active)
    and (
      p.everyone
      or s.grade in (select jsonb_array_elements_text(p.grades))
      or s.class_id in (select jsonb_array_elements_text(p.classes))
      or s.id in (select (jsonb_array_elements_text(p.individuals))::uuid)
      or s.id_number in (
        select lpad(regexp_replace(v, '\D', '', 'g'), 9, '0')
        from jsonb_array_elements_text(p.paste_ids) as v
      )
      or s.id in (
        select gm.student_id from public.group_members gm
        where gm.group_id in (select (jsonb_array_elements_text(p.groups))::uuid)
      )
    );
$$;

-- 14.6 publish_registration -----------------------------------------------
create or replace function public.publish_registration(p_registration_id uuid, p_audience jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, rh
as $$
declare
  v_reg public.registrations%rowtype;
  v_count int := 0;
  v_new_status text;
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;

  select * into v_reg from public.registrations where id = p_registration_id for update;
  if not found then raise exception 'not_found'; end if;

  -- snapshot the audience into registration_targets (idempotent on conflict)
  insert into public.registration_targets (registration_id, student_id, student_snapshot)
  select p_registration_id, s.id,
         jsonb_build_object('full_name', s.full_name, 'grade', s.grade, 'class_id', s.class_id)
  from public.students s
  where s.id in (select rh.resolve_audience(p_audience))
  on conflict (registration_id, student_id) do nothing;

  select count(*) into v_count
    from public.registration_targets
   where registration_id = p_registration_id and removed_at is null;

  v_new_status := case
    when v_reg.opens_at is not null and v_reg.opens_at > now() then 'scheduled'
    else 'open'
  end;

  update public.registrations
     set status = v_new_status,
         audience_summary = coalesce(p_audience, '{}'::jsonb) || jsonb_build_object('total', v_count),
         published_at = coalesce(published_at, now())
   where id = p_registration_id;

  -- internal notifications for each (new) target; push is best-effort (Edge fn).
  insert into public.notifications (student_id, kind, registration_id, body)
  select rt.student_id, 'new_registration', p_registration_id,
         'רישום חדש: ' || v_reg.title
  from public.registration_targets rt
  where rt.registration_id = p_registration_id and rt.removed_at is null;

  return jsonb_build_object('audience_count', v_count, 'push_attempted', 0, 'push_failed_count', 0);
end;
$$;

-- 14.7 update_audience -----------------------------------------------------
create or replace function public.update_audience(p_registration_id uuid, p_add jsonb, p_remove jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, rh
as $$
declare
  v_added int := 0;
  v_removed int := 0;
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;

  if p_add is not null then
    insert into public.registration_targets (registration_id, student_id, student_snapshot)
    select p_registration_id, s.id,
           jsonb_build_object('full_name', s.full_name, 'grade', s.grade, 'class_id', s.class_id)
    from public.students s
    where s.id in (select rh.resolve_audience(p_add))
    on conflict (registration_id, student_id) do update
      set removed_at = null, removed_reason = null; -- re-adding a removed student
    get diagnostics v_added = row_count;
  end if;

  if p_remove is not null and p_remove ? 'student_ids' then
    update public.registration_targets
       set removed_at = now(), removed_reason = 'admin_removed'
     where registration_id = p_registration_id
       and removed_at is null
       and student_id in (
         select (jsonb_array_elements_text(p_remove -> 'student_ids'))::uuid
       );
    get diagnostics v_removed = row_count;
  end if;

  return jsonb_build_object('added', v_added, 'removed', v_removed);
end;
$$;

-- 14.8 close / reopen ------------------------------------------------------
create or replace function public.close_registration(p_registration_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;
  update public.registrations
     set status = 'closed', closed_at = now()
   where id = p_registration_id and status in ('open', 'scheduled');
  return jsonb_build_object('status', 'closed');
end;
$$;

create or replace function public.reopen_registration(p_registration_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;
  update public.registrations
     set status = 'open', closed_at = null
   where id = p_registration_id and status = 'closed';
  -- notify current targets that the registration reopened
  insert into public.notifications (student_id, kind, registration_id, body)
  select rt.student_id, 'reopened', p_registration_id, 'רישום נפתח מחדש'
  from public.registration_targets rt
  where rt.registration_id = p_registration_id and rt.removed_at is null;
  return jsonb_build_object('status', 'open');
end;
$$;

-- 14.9 archive -------------------------------------------------------------
create or replace function public.archive_registration(p_registration_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;
  update public.registrations
     set status = 'archived', archived_at = now()
   where id = p_registration_id and status = 'closed';
  if not found then raise exception 'invalid_state'; end if;
  return jsonb_build_object('status', 'archived');
end;
$$;
