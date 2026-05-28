-- Rishumei Hevron — seen tracking + response RPCs (spec §13.3, §14.3–14.5, §23–25).

-- Evaluate whether a question is visible given current answers (spec §13.3).
create or replace function rh.is_visible(p_question jsonb, p_values jsonb)
returns boolean
language plpgsql immutable
as $$
declare
  v_cond jsonb := p_question -> 'conditional_on';
  v_src text;
  v_eq jsonb;
  v_actual jsonb;
begin
  if v_cond is null or v_cond = 'null'::jsonb then
    return true;
  end if;
  v_src := v_cond ->> 'question_id';
  v_eq := v_cond -> 'equals';
  v_actual := p_values -> v_src;
  if v_actual is null then
    return false;
  end if;
  -- multi_choice source: equals is "included in the array"
  if jsonb_typeof(v_actual) = 'array' then
    return v_actual @> jsonb_build_array(v_eq #>> '{}');
  end if;
  return (v_actual #>> '{}') = (v_eq #>> '{}');
end;
$$;

-- Drop hidden-by-condition fields and validate required-and-visible questions.
-- Returns the cleaned values; raises 'invalid_input' when a required answer is missing.
create or replace function rh.clean_response(p_schema jsonb, p_values jsonb)
returns jsonb
language plpgsql stable
as $$
declare
  v_q jsonb;
  v_id text;
  v_out jsonb := '{}'::jsonb;
  v_val jsonb;
  v_visible boolean;
begin
  for v_q in select * from jsonb_array_elements(p_schema) loop
    v_id := v_q ->> 'id';
    v_visible := rh.is_visible(v_q, p_values);
    v_val := p_values -> v_id;

    if not v_visible then
      continue; -- drop silently
    end if;

    if v_val is null or (jsonb_typeof(v_val) = 'string' and length(v_val #>> '{}') = 0)
       or (jsonb_typeof(v_val) = 'array' and jsonb_array_length(v_val) = 0) then
      if coalesce((v_q ->> 'required')::boolean, false) then
        raise exception 'invalid_input' using detail = 'missing required: ' || v_id;
      end if;
      continue;
    end if;

    v_out := v_out || jsonb_build_object(v_id, v_val);
  end loop;
  return v_out;
end;
$$;

-- 14.3 mark_registration_seen ----------------------------------------------
create or replace function public.mark_registration_seen(p_registration_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
declare
  v_student_id uuid := rh.current_student_id();
  v_seen timestamptz;
  v_already boolean := false;
begin
  if v_student_id is null then raise exception 'forbidden'; end if;

  select seen_at into v_seen
    from public.registration_targets
   where registration_id = p_registration_id and student_id = v_student_id
   for update;

  if v_seen is not null then
    v_already := true;
  else
    v_seen := now();
    update public.registration_targets
       set seen_at = v_seen
     where registration_id = p_registration_id and student_id = v_student_id;
  end if;

  return jsonb_build_object('already_seen', v_already, 'seen_at', v_seen);
end;
$$;

-- 14.4 submit_response (student) -------------------------------------------
create or replace function public.submit_response(p_registration_id uuid, p_values jsonb)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
declare
  v_student_id uuid := rh.current_student_id();
  v_reg public.registrations%rowtype;
  v_has_response boolean;
  v_cleaned jsonb;
  v_deadline timestamptz;
begin
  if v_student_id is null then raise exception 'forbidden'; end if;

  -- student must be an active target
  if not exists (
    select 1 from public.registration_targets
    where registration_id = p_registration_id and student_id = v_student_id and removed_at is null
  ) then
    raise exception 'not_targeted';
  end if;

  select * into v_reg from public.registrations where id = p_registration_id;
  if not found or v_reg.status not in ('open', 'scheduled') then
    raise exception 'closed';
  end if;

  v_has_response := exists (
    select 1 from public.responses
    where registration_id = p_registration_id and student_id = v_student_id
  );

  -- deadline: new responses gated by closes_at; edits by edit_until (defaults to closes_at)
  v_deadline := case when v_has_response
    then coalesce(v_reg.edit_until, v_reg.closes_at)
    else v_reg.closes_at end;
  if v_deadline <= now() then
    raise exception 'closed';
  end if;

  v_cleaned := rh.clean_response(v_reg.questions_schema, p_values);

  insert into public.responses (registration_id, student_id, values, responded_at, submitted_via)
  values (p_registration_id, v_student_id, v_cleaned, now(), 'student')
  on conflict (registration_id, student_id) do update
    set values = excluded.values,
        responded_at = now(),
        submitted_via = 'student',
        last_edited_by_admin_at = null; -- student edit clears the admin flag

  -- defensive: ensure seen is set on first response
  update public.registration_targets
     set seen_at = coalesce(seen_at, now())
   where registration_id = p_registration_id and student_id = v_student_id;

  return jsonb_build_object('status', 'ok', 'edit_until', coalesce(v_reg.edit_until, v_reg.closes_at));
end;
$$;

-- 14.5 admin_submit_response_on_behalf -------------------------------------
create or replace function public.admin_submit_response_on_behalf(
  p_registration_id uuid, p_student_id uuid, p_values jsonb)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
declare
  v_reg public.registrations%rowtype;
  v_existing public.responses%rowtype;
  v_cleaned jsonb;
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;

  select * into v_reg from public.registrations where id = p_registration_id;
  if not found then raise exception 'not_found'; end if;
  if v_reg.archived_at is not null then raise exception 'closed'; end if; -- no edits after archive

  v_cleaned := rh.clean_response(v_reg.questions_schema, p_values);

  select * into v_existing from public.responses
   where registration_id = p_registration_id and student_id = p_student_id;

  if found then
    -- keep exactly one prior version (overwrite any earlier history row)
    insert into public.response_history (
      registration_id, student_id, previous_values, previous_responded_at, previous_submitted_via)
    values (p_registration_id, p_student_id, v_existing.values,
            v_existing.responded_at, v_existing.submitted_via)
    on conflict (registration_id, student_id) do update
      set previous_values = excluded.previous_values,
          previous_responded_at = excluded.previous_responded_at,
          previous_submitted_via = excluded.previous_submitted_via,
          replaced_at = now();
  end if;

  insert into public.responses (registration_id, student_id, values, responded_at, submitted_via, last_edited_by_admin_at)
  values (p_registration_id, p_student_id, v_cleaned, now(), 'admin_on_behalf', now())
  on conflict (registration_id, student_id) do update
    set values = excluded.values,
        responded_at = now(),
        submitted_via = 'admin_on_behalf',
        last_edited_by_admin_at = now();

  return jsonb_build_object('status', 'ok');
end;
$$;

-- 14.10 mark_notification_read (role-aware) --------------------------------
create or replace function public.mark_notification_read(p_notification_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
begin
  if rh.is_admin() then
    update public.admin_notifications set read_at = now()
     where id = p_notification_id and read_at is null;
  elsif rh.current_student_id() is not null then
    update public.notifications set read_at = now()
     where id = p_notification_id and student_id = rh.current_student_id() and read_at is null;
  else
    raise exception 'forbidden';
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Admin PIN change (spec §18.2 / Settings).
create or replace function public.change_admin_pin(p_new_pin text)
returns jsonb
language plpgsql security definer set search_path = public, rh
as $$
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;
  if p_new_pin !~ '^[0-9]{4,8}$' then raise exception 'invalid_input'; end if;
  insert into public.app_settings (key, value)
    values ('admin_pin', to_jsonb(crypt(p_new_pin, gen_salt('bf'))))
    on conflict (key) do update set value = to_jsonb(crypt(p_new_pin, gen_salt('bf'))), updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function
  public.mark_registration_seen(uuid),
  public.submit_response(uuid, jsonb),
  public.admin_submit_response_on_behalf(uuid, uuid, jsonb),
  public.publish_registration(uuid, jsonb),
  public.update_audience(uuid, jsonb, jsonb),
  public.close_registration(uuid),
  public.reopen_registration(uuid),
  public.archive_registration(uuid),
  public.mark_notification_read(uuid),
  public.change_admin_pin(text)
to authenticated;
