-- GigStar Phase Five foundation — migration 0016
-- Data API (PostgREST) SELECT grant for profile_memberships.
--
-- ROOT CAUSE
-- Migration 0010 granted the PostgREST roles (anon/authenticated) least-
-- privilege SELECT on the public read surface (profiles, profile_modules, the
-- module-definition catalog, the public_* views, and the search RPC) after we
-- found production was created with "Automatically expose new tables" DISABLED,
-- so anon/authenticated received NO implicit table privileges there. 0010 did
-- NOT include profile_memberships, because at that time every membership read
-- went through the has_profile_access() security-definer helper.
--
-- The profile manager (/profiles/manage -> loadProfileManagerData) reads the
-- caller's OWN memberships DIRECTLY through the RLS-bound anon-key session
-- client:
--     from('profile_memberships').select('role, profile:profiles!inner(...)')
-- On dev this was masked by auto-expose. On production the `authenticated` role
-- has no SELECT on the table, so the page fails with 42501
-- "permission denied for table profile_memberships".
--
-- FIX
-- Grant SELECT on profile_memberships to `authenticated` only. anon gets
-- nothing: membership / authorization rows must never be world-readable.
--
-- SECURITY POSTURE
-- * RLS is NOT modified. Row visibility remains enforced by the existing
--   memberships_select_members policy (own rows: user_id = auth.uid(), or
--   administrator+ on the profile). This grant only lets the role reach the
--   table; RLS still decides which rows are returned.
-- * NO write privileges (INSERT/UPDATE/DELETE) are granted. All membership
--   writes run via SECURITY DEFINER RPCs / the service role.
-- * profile_memberships has no sensitive columns (id, profile_id, user_id,
--   role, status, timestamps), so table-level SELECT is used with no column
--   withholding. The join target profiles was already column-scoped in 0010.
-- * A defensive REVOKE ALL first strips anything implicitly exposed (e.g. the
--   write access auto-expose granted on dev), making the posture identical and
--   least-privilege on both projects. On production (auto-expose OFF) the
--   REVOKE is a harmless no-op.
set local search_path = public, extensions;

-- 1. Deterministic least-privilege baseline: remove anything implicitly exposed.
revoke all on table public.profile_memberships from anon, authenticated;

-- 2. Runtime session client (authenticated) may SELECT; RLS filters to the
--    caller's own rows (or profiles they administer). anon gets nothing.
grant select on table public.profile_memberships to authenticated;
