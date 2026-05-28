# רישומי חברון — Rishumei Hevron

A general registration system for the yeshiva. Hebrew/RTL PWA: an admin builds
registrations of any shape, delivers them to a chosen audience of students, and
monitors a live three-state dashboard with exports. Students log in with their
Israeli ID and answer on mobile in seconds.

> Implementation follows `rishumei-hevron-development-spec.md` (English) and the
> `rishumei-hevron-master-plan.md` (Hebrew, product focus). The spec wins on
> implementation decisions.

## Stack

- **Frontend:** React 18 + TypeScript (strict), Vite, Tailwind (RTL), TanStack
  Query, Zustand, react-hook-form + zod, recharts, Framer Motion, Workbox PWA.
- **Backend:** Supabase (Postgres 15+, Edge Functions on Deno, Realtime),
  region `eu-central-1` (Frankfurt).
- **Hosting:** Vercel (one project serves `/` student + `/admin` admin).

## Layout

```
src/                 React app (pages, features, components, lib, types)
supabase/migrations/ schema → indexes → auth helpers → RLS → RPCs → seed/views
supabase/functions/  csv-import-validate/-commit, send-*-push, export-build
tests/unit/          shared-lib tests (conditional evaluator, ID, normalization)
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL / anon key / VAPID public key
npm run dev
```

### Supabase

1. Create a project in `eu-central-1`.
2. Apply migrations in `supabase/migrations/` in filename order.
3. **Set `app_settings('jwt_secret')` equal to the project's JWT secret** — our
   self-minted tokens are HMAC-signed with it and PostgREST must accept them.
4. Rotate the bootstrap admin PIN (default seed: `0000`; local dev seed: `1234`)
   via the Settings page or `change_admin_pin`.
5. Deploy the Edge Functions and set their secrets (`VAPID_*`, service role).

## Implementation status

Foundations through the core flows are scaffolded (spec Phases 1–9 in progress):

- ✅ Project setup, RTL, design tokens, dark mode, PWA shell.
- ✅ Full schema, indexes, RLS, auth/registration/response RPCs, aggregate RPCs.
- ✅ CSV import validate/commit Edge Functions + import wizard.
- ✅ Student + admin auth, student home/detail, shared detail component.
- ✅ Registration builder with the live student preview (one shared component).
- ✅ Monitor page with scoped realtime + three-state summary.
- ⏳ Exports (xlsx/pdf), full push triggers, libraries, templates — scaffolded,
  see `TODO(phase-10/11)` markers.

## Key invariants (do not regress)

- The CSV is the only door for student identity data (spec closing note #2).
- The student preview shares its component with the real student page (§22.5).
- Realtime is enabled only on the monitor page, scoped by `registration_id`.
- `undecided` is an **answer**, not a status — it counts as `responded`.
- "admin" is one logical actor: no per-admin auth, audit, or permissions.
