-- ===========================================================================
-- 0012_restrict_onboarding_rpc_grants
--
-- Defense-in-depth for the Phase-6 onboarding RPCs introduced in migration
-- 0011. Supabase installs ALTER DEFAULT PRIVILEGES that grant `anon` a DIRECT
-- EXECUTE on every newly created function in `public`. A `revoke ... from
-- public` does NOT remove that direct grant, so `anon` retained EXECUTE on the
-- 0011 RPCs even though they reject unauthenticated callers at runtime via
-- auth.uid(). This migration closes the grant surface explicitly: revoke from
-- both PUBLIC and anon, then grant only the minimum EXECUTE to `authenticated`.
--
-- Idempotent and safe to re-run.
-- ===========================================================================

-- max_active_profiles_per_account()
revoke execute on function public.max_active_profiles_per_account() from public;
revoke execute on function public.max_active_profiles_per_account() from anon;
grant execute on function public.max_active_profiles_per_account() to authenticated;

-- slug_available(text)
revoke execute on function public.slug_available(text) from public;
revoke execute on function public.slug_available(text) from anon;
grant execute on function public.slug_available(text) to authenticated;

-- start_profile_creation_attempt()
revoke execute on function public.start_profile_creation_attempt() from public;
revoke execute on function public.start_profile_creation_attempt() from anon;
grant execute on function public.start_profile_creation_attempt() to authenticated;

-- set_onboarding_step(public.onboarding_step, uuid)
revoke execute on function public.set_onboarding_step(public.onboarding_step, uuid) from public;
revoke execute on function public.set_onboarding_step(public.onboarding_step, uuid) from anon;
grant execute on function public.set_onboarding_step(public.onboarding_step, uuid) to authenticated;

-- set_default_profile(uuid)
revoke execute on function public.set_default_profile(uuid) from public;
revoke execute on function public.set_default_profile(uuid) from anon;
grant execute on function public.set_default_profile(uuid) to authenticated;

-- resolve_default_profile()
revoke execute on function public.resolve_default_profile() from public;
revoke execute on function public.resolve_default_profile() from anon;
grant execute on function public.resolve_default_profile() to authenticated;

-- create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision)
revoke execute on function public.create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision) from public;
revoke execute on function public.create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision) from anon;
grant execute on function public.create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision) to authenticated;

-- create_profile_with_owner(text, public.profile_type, text, text)
revoke execute on function public.create_profile_with_owner(text, public.profile_type, text, text) from public;
revoke execute on function public.create_profile_with_owner(text, public.profile_type, text, text) from anon;
grant execute on function public.create_profile_with_owner(text, public.profile_type, text, text) to authenticated;
