-- =====================================================================
-- GigStar Production verification (READ-ONLY)
-- Run in the Supabase SQL Editor for the PRODUCTION project AFTER applying
-- pr5-modular-profiles-prod-migration.sql. Changes no data or schema.
--
-- PASS criteria after the migration:
--   * has_publish_fn            = true
--   * has_save_draft_fn         = true
--   * has_get_editor_modules_fn = true
--   * migrations contains 20260921120000 and 20260921130000
--   * has_profile_revisions     = true
--   * defs_radio / defs_gigs    = true (module definitions present)
--
-- Keep MODULAR_PROFILES_FLOW OFF in Production until this passes.
-- =====================================================================
select json_build_object(
  'migrations', (
    select case when to_regclass('supabase_migrations.schema_migrations') is null then null
      else (select json_agg(version order by version) from supabase_migrations.schema_migrations) end
  ),
  'has_profiles',          (to_regclass('public.profiles') is not null),
  'has_profile_modules',   (to_regclass('public.profile_modules') is not null),
  'has_profile_revisions', (to_regclass('public.profile_revisions') is not null),
  'has_module_defs',       (to_regclass('public.profile_module_definitions') is not null),
  'defs_radio', exists (select 1 from public.profile_module_definitions where key = 'radio'),
  'defs_gigs',  exists (select 1 from public.profile_module_definitions where key = 'gigs'),
  'has_publish_fn', exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'publish_profile_modules'
  ),
  'has_save_draft_fn', exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'save_profile_module_draft'
  ),
  'has_get_editor_modules_fn', exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_profile_modules_for_editor'
  )
) as report;
