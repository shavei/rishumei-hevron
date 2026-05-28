-- Rishumei Hevron — seed defaults (spec §12.13) + aggregate views (spec §9, §24).

-- ---------------------------------------------------------------------------
-- app_settings defaults.
--   jwt_secret: MUST be replaced with the project's JWT secret at provisioning
--               (the two must match for PostgREST to accept our minted tokens).
--   admin_pin : bootstrap value, bcrypt-hashed. ROTATE before production.
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value) values
  ('jwt_secret', to_jsonb('CHANGE_ME_TO_PROJECT_JWT_SECRET'::text)),
  ('admin_pin', to_jsonb(crypt('0000', gen_salt('bf')))),
  ('admin_login_failures', '0'::jsonb),
  ('csv_default_inactivate_missing', 'true'::jsonb),
  ('notifications.closing_soon_hours', '6'::jsonb),
  ('notifications.low_response_threshold', '0.3'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Three-state aggregate per registration (admin-only via RLS on base tables;
-- exposed through a SECURITY DEFINER RPC so the client never counts client-side).
-- ---------------------------------------------------------------------------
create or replace function public.registration_state_summary(p_registration_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, rh
as $$
declare
  v_responded int; v_seen int; v_sent int; v_total int;
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;

  select
    count(*) filter (where r.student_id is not null),
    count(*) filter (where r.student_id is null and rt.seen_at is not null),
    count(*) filter (where r.student_id is null and rt.seen_at is null),
    count(*)
  into v_responded, v_seen, v_sent, v_total
  from public.registration_targets rt
  left join public.responses r
    on r.registration_id = rt.registration_id and r.student_id = rt.student_id
  where rt.registration_id = p_registration_id and rt.removed_at is null;

  return jsonb_build_object(
    'total', v_total, 'responded', v_responded, 'seen', v_seen, 'sent', v_sent
  );
end;
$$;

-- Per-class breakdown for the stacked bar chart (spec §24.3).
create or replace function public.registration_class_breakdown(p_registration_id uuid)
returns table (class_id text, responded int, seen int, sent int)
language plpgsql stable security definer set search_path = public, rh
as $$
begin
  if not rh.is_admin() then raise exception 'forbidden'; end if;
  return query
  select
    rt.student_snapshot ->> 'class_id' as class_id,
    count(*) filter (where r.student_id is not null)::int as responded,
    count(*) filter (where r.student_id is null and rt.seen_at is not null)::int as seen,
    count(*) filter (where r.student_id is null and rt.seen_at is null)::int as sent
  from public.registration_targets rt
  left join public.responses r
    on r.registration_id = rt.registration_id and r.student_id = rt.student_id
  where rt.registration_id = p_registration_id and rt.removed_at is null
  group by rt.student_snapshot ->> 'class_id'
  order by class_id;
end;
$$;

grant execute on function
  public.registration_state_summary(uuid),
  public.registration_class_breakdown(uuid)
to authenticated;
