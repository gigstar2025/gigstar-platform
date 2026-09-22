-- =====================================================================
-- GigStar Production FUNCTIONAL TEST (ROLLED BACK — persists nothing)
-- Run in the Supabase SQL Editor for the PRODUCTION project AFTER applying
-- pr5-modular-profiles-prod-migration.sql and confirming the read-only
-- verification (pr5-modular-profiles-verify.sql) passes.
--
-- Everything runs inside a single transaction that ALWAYS ends in ROLLBACK,
-- so no draft, published_content, or revision row is left behind:
--   1. Find one existing ACTIVE OWNER membership on a dj/artist profile
--      (gigs is allowed for those profile types).
--   2. Impersonate that user (transaction-local request.jwt.claims.sub) so
--      the SECURITY DEFINER auth checks resolve to a real owner.
--   3. save_profile_module_draft(...) writes a throwaway gigs draft.
--   4. publish_profile_modules(...) promotes drafts -> published_content.
--   5. Assert gigs.published_content was set AND exactly one new
--      profile_revisions row was recorded.
--   6. Record the outcome, SELECT it as a visible Results row, then ROLLBACK.
--
-- The final SELECT returns ONE row in the SQL Editor "Results" pane:
--   status  = 'PASS' | 'SKIP' | 'FAIL'
--   detail  = human-readable explanation
-- A 'FAIL' status is returned as a row (not raised), so you always see a
-- result rather than "Success. No rows returned." The transaction still
-- rolls back regardless of status.
--
-- Keep MODULAR_PROFILES_FLOW OFF until this test and the verification pass.
-- =====================================================================
begin;

create temp table _pr5_test_result (
  status text,
  detail text
) on commit drop;

do $test$
declare
  v_profile    uuid;
  v_owner      uuid;
  v_saved      uuid;
  v_published  integer;
  v_pub        jsonb;
  v_rev_before integer;
  v_rev_after  integer;
begin
  -- 1. Pick a real owner + profile that allows the gigs module.
  select m.profile_id, m.user_id
    into v_profile, v_owner
  from public.profile_memberships m
  join public.profiles p on p.id = m.profile_id
  where m.status = 'active'
    and m.role = 'owner'
    and p.type = any (array['dj','artist']::public.profile_type[])
  limit 1;

  if v_profile is null then
    insert into _pr5_test_result values (
      'SKIP',
      'No active owner membership on a dj/artist profile; functional test not run.'
    );
    return;
  end if;

  select count(*) into v_rev_before
  from public.profile_revisions where profile_id = v_profile;

  -- 2. Impersonate the owner for auth.uid()-based checks (transaction-local).
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_owner, 'role', 'authenticated')::text,
    true
  );

  -- 3. Save a throwaway gigs draft.
  v_saved := public.save_profile_module_draft(
    v_profile,
    'gigs',
    '{"gigs":[{"id":"__rollback_test__","title":"Rolled-back Test Gig","date":"2026-12-31","venueName":"Test Venue","town":"Testville","status":"on-sale"}]}'::jsonb
  );

  -- 4. Publish (promotes draft_content -> published_content, records a revision).
  v_published := public.publish_profile_modules(v_profile);

  -- 5a. Assert the gigs module now has published content.
  select published_content into v_pub
  from public.profile_modules
  where profile_id = v_profile and module_key = 'gigs';

  if v_pub is null or not (v_pub ? 'gigs') then
    insert into _pr5_test_result values (
      'FAIL',
      format('gigs.published_content missing after publish (got %s).', coalesce(v_pub::text, 'null'))
    );
    return;
  end if;

  -- 5b. Assert exactly one new revision snapshot was recorded.
  select count(*) into v_rev_after
  from public.profile_revisions where profile_id = v_profile;

  if v_rev_after <> v_rev_before + 1 then
    insert into _pr5_test_result values (
      'FAIL',
      format('expected exactly one new revision (before %s, after %s).', v_rev_before, v_rev_after)
    );
    return;
  end if;

  -- 5c. Success.
  insert into _pr5_test_result values (
    'PASS',
    format(
      'save -> publish -> revision verified on profile %s (owner %s). Modules promoted: %s. Revisions %s -> %s.',
      v_profile, v_owner, v_published, v_rev_before, v_rev_after
    )
  );
end
$test$;

-- Visible Results row (PASS / SKIP / FAIL). Runs before the rollback below.
select status, detail from _pr5_test_result;

rollback;
