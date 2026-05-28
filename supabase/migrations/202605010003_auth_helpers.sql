-- Rishumei Hevron — auth helpers (spec §10, §16).
--
-- We mint our own JWTs (no Supabase email/password). Tokens carry custom claims:
--   * student token:  { "role": "authenticated", "user_kind": "student", "student_id": "<uuid>" }
--   * admin token:     { "role": "authenticated", "user_kind": "admin" }
--
-- The `role` claim stays "authenticated" so PostgREST applies our RLS policies
-- (rather than escalating to a privileged DB role). Authorization is expressed
-- through the custom `user_kind` / `student_id` claims read by the helpers below.
--
-- OPERATIONAL REQUIREMENT: tokens are HMAC-signed with the secret stored in
-- app_settings('jwt_secret'). For PostgREST to accept these tokens, the project's
-- JWT secret MUST equal that value (set them equal at provisioning time).

create schema if not exists rh;

-- Read the verified JWT claims PostgREST attached to this request.
create or replace function rh.jwt() returns jsonb
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

create or replace function rh.current_student_id() returns uuid
language sql stable as $$
  select case
    when rh.jwt() ->> 'user_kind' = 'student'
      then nullif(rh.jwt() ->> 'student_id', '')::uuid
    else null
  end;
$$;

create or replace function rh.is_admin() returns boolean
language sql stable as $$
  select coalesce(rh.jwt() ->> 'user_kind' = 'admin', false);
$$;

-- ---------------------------------------------------------------------------
-- base64url helpers + HMAC-SHA256 JWT signing (self-contained, pgcrypto-based)
-- ---------------------------------------------------------------------------
create or replace function rh.b64url(data bytea) returns text
language sql immutable as $$
  select translate(replace(encode(data, 'base64'), e'\n', ''), '+/', '-_');
$$;

create or replace function rh.b64url_strip(s text) returns text
language sql immutable as $$
  -- remove '=' padding
  select rtrim(s, '=');
$$;

-- Sign a claims object into a compact JWT (HS256) using the app secret.
create or replace function rh.sign_jwt(claims jsonb) returns text
language plpgsql stable as $$
declare
  v_secret text;
  v_header text;
  v_payload text;
  v_signing_input text;
  v_signature text;
begin
  select value #>> '{}' into v_secret from public.app_settings where key = 'jwt_secret';
  if v_secret is null then
    raise exception 'jwt_secret is not configured in app_settings';
  end if;

  v_header  := rh.b64url_strip(rh.b64url(convert_to('{"alg":"HS256","typ":"JWT"}', 'utf8')));
  v_payload := rh.b64url_strip(rh.b64url(convert_to(claims::text, 'utf8')));
  v_signing_input := v_header || '.' || v_payload;
  v_signature := rh.b64url_strip(rh.b64url(hmac(v_signing_input, v_secret, 'sha256')));

  return v_signing_input || '.' || v_signature;
end;
$$;

-- Build the standard claim envelope for a token valid `p_ttl` from now.
create or replace function rh.build_claims(p_extra jsonb, p_ttl interval) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'role', 'authenticated',
    'aud', 'authenticated',
    'iat', extract(epoch from now())::bigint,
    'exp', extract(epoch from (now() + p_ttl))::bigint
  ) || p_extra;
$$;
