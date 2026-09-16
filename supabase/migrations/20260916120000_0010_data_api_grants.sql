-- GigStar Phase Five foundation — migration 0010
-- Data API (PostgREST) privilege grants for anon / authenticated.
--
-- ROOT CAUSE
-- Migrations 0001–0009 never issued explicit table-level GRANTs to the
-- PostgREST roles. On the dev project this was masked because dev was created
-- with "Automatically expose new tables" ENABLED, so anon/authenticated
-- implicitly received privileges on every new table. Production was created
-- with that setting DISABLED, so those roles received nothing.
--
-- The public read surface (the `public_*` views and search_profiles_near) is
-- built with security_invoker views and a SECURITY INVOKER SQL function, all of
-- which execute against the base tables WITH THE CALLER'S privileges. With no
-- base-table SELECT for anon/authenticated, every read through them fails with
-- "permission denied for table profiles / profile_modules /
-- profile_module_definitions" — exactly the /dev/foundation errors.
--
-- FIX
-- Grant the MINIMUM privileges the runtime (anon-key) client actually uses:
-- column-scoped SELECT on the base tables (excluding sensitive columns), plus
-- re-affirmed SELECT on the safe views and EXECUTE on the search RPC so this
-- migration is self-contained on a project where auto-expose was OFF.
--
-- SECURITY POSTURE
-- * RLS is NOT modified — row visibility is still enforced by existing policies.
-- * NO write privileges (INSERT/UPDATE/DELETE) are granted. All writes run via
--   the service role (seed) or SECURITY DEFINER RPCs, none of which rely on
--   anon/authenticated table grants.
-- * Sensitive columns are withheld even for SELECT: profiles.location_exact
--   (precise geolocation) and profile_modules.draft_content (unpublished data).
--   The runtime client never selects these; only the service-role seed does.
-- * A defensive REVOKE ALL first strips any implicitly-exposed privileges (e.g.
--   the write access auto-expose granted on dev), making the resulting posture
--   identical and least-privilege on both projects. On production (auto-expose
--   OFF) the REVOKE is a harmless no-op.
set local search_path = public, extensions;

-- 1. Deterministic least-privilege baseline: remove anything implicitly exposed.
revoke all on table public.profiles                    from anon, authenticated;
revoke all on table public.profile_modules             from anon, authenticated;
revoke all on table public.profile_module_definitions  from anon, authenticated;

-- 2. Catalog table — fully readable (17 rows of module definitions, no PII).
grant select on table public.profile_module_definitions to anon, authenticated;

-- 3. profiles — SELECT on every column EXCEPT location_exact (precise geo).
grant select (
  id,
  slug,
  type,
  display_name,
  tagline,
  visibility,
  lifecycle_status,
  verification_status,
  location_label,
  location_centroid,
  travel_radius_km,
  created_by,
  created_at,
  updated_at,
  published_at,
  archived_at,
  deleted_at
) on table public.profiles to anon, authenticated;

-- 4. profile_modules — SELECT on every column EXCEPT draft_content (unpublished).
grant select (
  id,
  profile_id,
  module_key,
  position,
  is_hidden,
  published_content,
  created_at,
  updated_at,
  published_at,
  archived_at,
  schema_version,
  created_by,
  updated_by
) on table public.profile_modules to anon, authenticated;

-- 5. Safe views — re-affirm SELECT (idempotent; originally granted in 0007).
grant select on table public.public_profiles          to anon, authenticated;
grant select on table public.public_profile_modules   to anon, authenticated;
grant select on table public.public_profile_directory to anon, authenticated;

-- 6. Distance-search RPC — re-affirm EXECUTE (idempotent; originally in 0008).
grant execute on function public.search_profiles_near(
  double precision, double precision, double precision, public.profile_type, integer
) to anon, authenticated;
