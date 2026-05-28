-- Rishumei Hevron — auth RPCs (spec §14.1, §14.2, §18).
-- Both are SECURITY DEFINER and callable by anon. Heavy per-IP rate limiting is
-- enforced upstream by an Edge Function gate (§10); here we add the shared-PIN
-- global lockout and basic input validation.

-- 14.1 student_login -------------------------------------------------------
create or replace function public.student_login(p_id_number text)
returns jsonb
language plpgsql
security definer
set search_path = public, rh
as $$
declare
  v_clean text;
  v_student public.students%rowtype;
  v_token text;
begin
  -- normalize: strip non-digits, zero-pad to 9
  v_clean := regexp_replace(coalesce(p_id_number, ''), '\D', '', 'g');
  if length(v_clean) < 9 then
    v_clean := lpad(v_clean, 9, '0');
  end if;
  if v_clean !~ '^[0-9]{9}$' then
    return jsonb_build_object('error', 'not_found');
  end if;

  select * into v_student from public.students where id_number = v_clean;

  -- Do not differentiate not_found from inactive (avoids enumeration leakage).
  if not found or v_student.is_active = false then
    return jsonb_build_object('error', 'not_found');
  end if;

  v_token := rh.sign_jwt(rh.build_claims(
    jsonb_build_object('user_kind', 'student', 'student_id', v_student.id::text),
    interval '30 days'
  ));

  return jsonb_build_object(
    'token', v_token,
    'student_id', v_student.id::text,
    'full_name', v_student.full_name,
    'grade', v_student.grade,
    'class_id', v_student.class_id
  );
end;
$$;

-- 14.2 admin_login ---------------------------------------------------------
create or replace function public.admin_login(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, rh
as $$
declare
  v_hash text;
  v_lock_until timestamptz;
  v_failures int;
  v_token text;
begin
  -- global shared-PIN lockout
  select (value #>> '{}')::timestamptz into v_lock_until
    from public.app_settings where key = 'admin_lock_until';
  if v_lock_until is not null and v_lock_until > now() then
    return jsonb_build_object('error', 'rate_limited');
  end if;

  select value #>> '{}' into v_hash from public.app_settings where key = 'admin_pin';
  if v_hash is null then
    return jsonb_build_object('error', 'wrong_pin');
  end if;

  if crypt(coalesce(p_pin, ''), v_hash) = v_hash then
    -- success: reset failure counter
    insert into public.app_settings (key, value) values ('admin_login_failures', '0'::jsonb)
      on conflict (key) do update set value = '0'::jsonb, updated_at = now();
    v_token := rh.sign_jwt(rh.build_claims(
      jsonb_build_object('user_kind', 'admin'),
      interval '8 hours'
    ));
    return jsonb_build_object('token', v_token);
  end if;

  -- failure: bump counter, lock after 10 for 5 minutes
  select coalesce((value #>> '{}')::int, 0) into v_failures
    from public.app_settings where key = 'admin_login_failures';
  v_failures := coalesce(v_failures, 0) + 1;
  insert into public.app_settings (key, value)
    values ('admin_login_failures', to_jsonb(v_failures))
    on conflict (key) do update set value = to_jsonb(v_failures), updated_at = now();

  if v_failures >= 10 then
    insert into public.app_settings (key, value)
      values ('admin_lock_until', to_jsonb((now() + interval '5 minutes')::text))
      on conflict (key) do update set value = to_jsonb((now() + interval '5 minutes')::text), updated_at = now();
    return jsonb_build_object('error', 'rate_limited');
  end if;

  return jsonb_build_object('error', 'wrong_pin');
end;
$$;

-- Allow anonymous callers to invoke only the login RPCs.
grant execute on function public.student_login(text) to anon, authenticated;
grant execute on function public.admin_login(text)   to anon, authenticated;
