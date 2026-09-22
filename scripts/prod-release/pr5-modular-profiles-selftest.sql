-- =============================================================================
-- PR-5 modular profiles — SELF-CONTAINED functional test (save -> publish -> revision)
-- =============================================================================
-- Purpose:
--   Exercise the publish flow end-to-end against the REAL production schema and
--   the REAL RPCs (save_profile_module_draft, publish_profile_modules) WITHOUT
--   depending on any pre-existing profile or owner. It builds its own throwaway
--   fixtures (auth user + account + dj profile + owner membership) inside a
--   single transaction, runs the flow while impersonating the fixture owner,
--   asserts the outcome, prints ONE visible Results row (PASS / FAIL), and then
--   ROLLS BACK everything so nothing persists.
--
-- How to read the result:
--   The final SELECT returns exactly one row in the Results pane:
--     status = 'PASS'  -> save/publish/revision all behaved correctly
--     status = 'FAIL'  -> detail column explains which assertion failed (incl.
--                         any SQLSTATE/message from an unexpected exception)
--
-- Safety:
--   * Wrapped in BEGIN ... ROLLBACK. No data is ever committed.
--   * The temp result table is ON COMMIT DROP and the transaction rolls back,
--     so it never persists either.
--   * Runs as the SQL Editor role (postgres); the fixture auth user is created
--     and destroyed within this aborted transaction only.
--
-- This test does NOT change the feature flag. Keep MODULAR_PROFILES_FLOW OFF in
-- production until this returns PASS and the schema/permission verification passes.
-- =============================================================================

begin;

create temp table _pr5_selftest_result (status text, detail text) on commit drop;

do $$
declare
  v_uid          uuid := gen_random_uuid();
  v_pid          uuid := gen_random_uuid();
  v_slug         text := 'pr5-selftest-' || replace(gen_random_uuid()::text, '-', '');
  v_gigs         jsonb := jsonb_build_object(
                    'gigs', jsonb_build_array(
                      jsonb_build_object(
                        'id', 'g1', 'title', 'Selftest Opening',
                        'date', '2026-10-01', 'venueName', 'Selftest Club',
                        'town', 'Berlin', 'status', 'on-sale',
                        'ticketUrl', 'https://tickets.example.test/g1'
                      ),
                      jsonb_build_object(
                        'id', 'g2', 'title', 'Selftest Warehouse',
                        'date', '2026-11-15', 'venueName', 'Warehouse 9',
                        'town', 'Amsterdam', 'status', 'sold-out'
                      )
                    )
                  );
  v_module_id    uuid;
  v_publish_ret  integer;
  v_published    jsonb;
  v_draft        jsonb;
  v_rev_count    integer;
  v_rev_snapshot jsonb;
begin
  -- -------------------------------------------------------------------------
  -- Fixtures. auth.users is the FK target for user_accounts; create it first.
  -- Only stable, long-standing columns are populated so this works across
  -- GoTrue schema versions. Everything rolls back at the end.
  -- -------------------------------------------------------------------------
  insert into auth.users (instance_id, id, aud, role, email)
  values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated',
          'authenticated', 'pr5-selftest+' || v_uid::text || '@example.test');

  insert into public.user_accounts (id, display_name, email, status)
  values (v_uid, 'PR5 Selftest User',
          'pr5-selftest+' || v_uid::text || '@example.test', 'active');

  insert into public.profiles
    (id, slug, type, display_name, visibility, lifecycle_status, created_by)
  values
    (v_pid, v_slug, 'dj', 'PR5 Selftest DJ', 'public', 'active', v_uid);

  insert into public.profile_memberships (profile_id, user_id, role, status)
  values (v_pid, v_uid, 'owner', 'active');

  -- -------------------------------------------------------------------------
  -- Impersonate the fixture owner for the duration of this transaction so the
  -- SECURITY DEFINER RPCs see the correct auth.uid() and membership.
  -- -------------------------------------------------------------------------
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::text, 'role', 'authenticated')::text,
    true  -- local: transaction-scoped, cleared on rollback
  );

  -- -------------------------------------------------------------------------
  -- 1) save draft
  -- -------------------------------------------------------------------------
  v_module_id := public.save_profile_module_draft(v_pid, 'gigs', v_gigs);

  select draft_content into v_draft
  from public.profile_modules
  where profile_id = v_pid and module_key = 'gigs';

  if v_module_id is null then
    insert into _pr5_selftest_result values ('FAIL', 'save_profile_module_draft returned null module id');
    return;
  end if;
  if v_draft is distinct from v_gigs then
    insert into _pr5_selftest_result values ('FAIL', 'draft_content does not match the saved payload');
    return;
  end if;

  -- Pre-publish invariant: nothing published yet.
  select published_content into v_published
  from public.profile_modules
  where profile_id = v_pid and module_key = 'gigs';
  if v_published is not null then
    insert into _pr5_selftest_result values ('FAIL', 'published_content was non-null before publish');
    return;
  end if;

  -- -------------------------------------------------------------------------
  -- 2) publish
  -- -------------------------------------------------------------------------
  v_publish_ret := public.publish_profile_modules(v_pid);

  -- -------------------------------------------------------------------------
  -- 3) assertions: published_content promoted, exactly one revision snapshot
  -- -------------------------------------------------------------------------
  select published_content into v_published
  from public.profile_modules
  where profile_id = v_pid and module_key = 'gigs';

  select count(*), max(snapshot) into v_rev_count, v_rev_snapshot
  from public.profile_revisions
  where profile_id = v_pid;

  if v_publish_ret is distinct from 1 then
    insert into _pr5_selftest_result
      values ('FAIL', format('publish_profile_modules returned %s, expected 1', v_publish_ret));
    return;
  end if;
  if v_published is null then
    insert into _pr5_selftest_result values ('FAIL', 'published_content is null after publish');
    return;
  end if;
  if v_published is distinct from v_gigs then
    insert into _pr5_selftest_result values ('FAIL', 'published_content does not match the saved draft');
    return;
  end if;
  if v_rev_count <> 1 then
    insert into _pr5_selftest_result
      values ('FAIL', format('expected exactly 1 revision snapshot, found %s', v_rev_count));
    return;
  end if;
  if (v_rev_snapshot ->> 'kind') is distinct from 'modules' then
    insert into _pr5_selftest_result
      values ('FAIL', format('revision snapshot.kind = %L, expected "modules"', v_rev_snapshot ->> 'kind'));
    return;
  end if;
  if jsonb_typeof(v_rev_snapshot -> 'modules') is distinct from 'array'
     or jsonb_array_length(v_rev_snapshot -> 'modules') < 1 then
    insert into _pr5_selftest_result
      values ('FAIL', 'revision snapshot.modules is not a non-empty array');
    return;
  end if;

  -- All assertions passed.
  insert into _pr5_selftest_result values (
    'PASS',
    format('module_id=%s publish_ret=%s revisions=%s snapshot_modules=%s',
           v_module_id, v_publish_ret, v_rev_count,
           jsonb_array_length(v_rev_snapshot -> 'modules'))
  );

exception
  when others then
    -- Any unexpected error is reported as a visible FAIL row instead of aborting
    -- the query with no result. The block's implicit savepoint keeps the
    -- transaction usable so the final SELECT still returns this row.
    insert into _pr5_selftest_result
      values ('FAIL', format('unexpected exception %s: %s', sqlstate, sqlerrm));
end
$$;

-- Visible Results row (PASS or FAIL) — shown before the rollback discards it.
select status, detail from _pr5_selftest_result;

rollback;
