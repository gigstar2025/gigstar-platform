-- =====================================================================
-- GigStar Production verification (READ-ONLY)
-- Run in the Supabase SQL Editor for the PRODUCTION project AFTER applying
-- pr5-modular-profiles-prod-migration.sql. Changes no data or schema.
--
-- PASS criteria after the migration:
--   * migrations contains 20260921120000 and 20260921130000
--   * has_profiles / has_profile_modules / has_profile_revisions = true
--   * has_module_defs = true, defs_radio = true, defs_gigs = true
--   * rpcs contains exactly these three, each with:
--       - security_definer = true
--       - config includes "search_path=" (pinned empty search_path)
--       - owner = the privileged migration role (typically "postgres")
--       - execute_authenticated = true
--       - execute_anon         = false
--       - identity_args exactly:
--           get_profile_modules_for_editor : "p_profile_id uuid"
--           save_profile_module_draft      :
--             "p_profile_id uuid, p_module_key text, p_content jsonb,
--              p_position integer, p_is_hidden boolean"
--           publish_profile_modules        : "p_profile_id uuid"
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
  'rpcs', (
    select coalesce(
      json_agg(
        json_build_object(
          'name',                  p.proname,
          'identity_args',         pg_get_function_identity_arguments(p.oid),
          'result',                pg_get_function_result(p.oid),
          'owner',                 pg_get_userbyid(p.proowner),
          'security_definer',      p.prosecdef,
          'config',                p.proconfig,
          'execute_authenticated', has_function_privilege('authenticated', p.oid, 'execute'),
          'execute_anon',          has_function_privilege('anon', p.oid, 'execute')
        )
        order by p.proname
      ),
      '[]'::json
    )
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'get_profile_modules_for_editor',
        'save_profile_module_draft',
        'publish_profile_modules'
      )
  )
) as report;
