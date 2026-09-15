# GigStar Backend Foundation (Phase Five)

This phase adds the persistent backend for GigStar profiles: a Supabase
(PostgreSQL) schema, row-level security, public-safe read surfaces, PostGIS
distance search, an authenticated verification dashboard, and an idempotent
seed for the four example profiles.

Everything is additive and forward-only. The public showcase pages and the
localStorage-based editor prototype are untouched; this layer sits beneath them
ready to be wired up in a later phase.

## Migrations

Applied to the connected Supabase project and mirrored, one file per applied
migration, in `supabase/migrations/`:

| Migration | Purpose |
|-----------|---------|
| `0001_foundation_extensions` | `pgcrypto`, `postgis` in the `extensions` schema; enums |
| `0001b_citext_extension` | `citext` for case-insensitive slugs/emails |
| `0002_accounts_profiles` | `user_accounts`, `profiles`, `profile_memberships`, `profile_invitations` |
| `0003_media_and_module_system` | `media_assets`, `profile_module_definitions`, `profile_modules`, `profile_revisions` |
| `0004_rls_helpers_and_policies` | Security-definer access helpers + RLS policies on every table |
| `0005_rpcs_and_module_seed` | `create_profile_with_owner`, `publish_profile`, module-catalog seed |
| `0006_triggers_constraints_softdelete` | `updated_at` triggers, module-rule enforcement, last-owner protection, new-user provisioning, soft-delete columns |
| `0007_public_safe_views` | `public_profiles`, `public_profile_modules`, `public_profile_directory` |
| `0008_profile_distance_search` | `search_profiles_near()` PostGIS proximity search |
| `0009_slug_history_module_meta_creation_tx` | Slug history, per-type module metadata, full atomic creation transaction |

Filenames are timestamped to match the order recorded in the database's
migration history.

## Data model

- **`user_accounts`** — one row per authenticated user (provisioned by the
  `on_auth_user_created` trigger). A user reads/updates only their own row.
- **`profiles`** — a DJ, artist, venue, or organiser. Carries both a coarse
  `location_centroid` (exposed publicly) and a precise `location_exact`
  (never exposed through any public surface). `visibility` +
  `lifecycle_status` gate public visibility.
- **`profile_memberships`** — who can act on a profile and at what role.
  Roles, most→least powerful: `owner`, `administrator`, `editor`,
  `event_manager`, `content_contributor`, `analyst`.
- **`profile_modules`** — an instance of a module on a profile.
  `draft_content` is the working copy; `published_content` is what the public
  page renders. Module identity reuses the editor's `SectionKey` vocabulary.
- **`profile_module_definitions`** — the module catalog, seeded from
  `lib/profiles/editor/module-registry.ts` (allowed types, required flag,
  per-type recommendations, hideability, discovery flag).
- **`media_assets`**, **`profile_revisions`**, **`profile_slug_history`**,
  **`profile_invitations`** — supporting entities.

## Security model

RLS is enabled on every table. Access decisions run through security-definer
helpers with a pinned empty `search_path`:

- `has_profile_access(profile_id, min_role)` — true when the current auth user
  holds an active membership at or above `min_role`. Security-definer so it can
  read `profile_memberships` without RLS recursion.
- `profile_is_public(profile_id)` — true for public + active profiles.

Key guarantees:

- Anonymous callers see only public + active profiles and only their
  published, non-hidden modules — never `draft_content`, never
  `location_exact`.
- All writes are gated by membership role.
- The **first** owner cannot be inserted under the owner-only membership
  policy, so profile creation goes through the security-definer
  `create_profile_with_owner()` RPC. The last active owner cannot be removed or
  demoted (`protect_last_owner` trigger).
- Required modules cannot be hidden and modules can only be attached to profile
  types that allow them (`enforce_profile_module_rules` trigger).

### Public-safe read surfaces

Application reads should prefer these `security_invoker` views/RPCs, which
cannot leak drafts or precise coordinates:

- `public_profiles` — coarse profile projection (centroid as lat/lon numbers).
- `public_profile_modules` — published, non-hidden module content only.
- `public_profile_directory` — discovery rows with coarse geography.
- `search_profiles_near(lat, lon, radius_km, type, limit)` — PostGIS
  `ST_DWithin` + `ST_Distance` proximity ranking (replaces the in-app Haversine
  scan).

## Application layer

- `lib/supabase/client.ts` / `server.ts` / `proxy.ts` + `middleware.ts` —
  browser and server clients and cookie/session refresh for Next.js 16.
- `app/auth/*` — email + password sign-in / sign-up and the `/auth/callback`
  code exchange.
- `lib/db/types.ts` — hand-written types mirroring the schema.
- `lib/db/foundation.ts` — server-only, typed data-access reading through the
  public-safe views and RPCs.
- `app/dev/foundation` — an authenticated verification dashboard that runs a
  live query through each layer and reports pass/fail.

## Seeding

`lib/db/seed.ts` maps the four showcase profiles
(`lib/profiles/showcase`) into real rows using the service-role key. It is
idempotent (profiles upsert by slug, memberships by profile+user, modules by
profile+module_key) and lands the content already published.

Run it from the `/dev/foundation` dashboard: sign in, then press **Run seed**.
It creates the demo owner `founder@gigstar.dev`, four public profiles around
Manchester with coarse centroids, and their published modules.

## Environment variables

Provided by the Supabase integration and used directly:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser/server
  clients.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — service-role seed only
  (server-only).
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` — sign-up email redirect target.

## Verifying

1. Visit `/dev/foundation` — unauthenticated visits redirect to `/auth/login`.
2. Sign up / sign in, then confirm every connectivity check passes.
3. Press **Run seed**, then confirm the four public profiles appear and the
   PostGIS distance-search check returns results.
