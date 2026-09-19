-- ===========================================================================
-- GigStar — 0013 Profile Archival test harness
-- ===========================================================================
-- Repeatable, DEVELOPMENT-ONLY SQL test harness for the secured archival RPC
-- shipped in migration 0013 (archive_profile), exercised against the profile /
-- membership / default-profile foundation from 0002/0004/0006/0011.
--
-- It runs 20 checks across: ownership enforcement, cross-account isolation,
-- EXACT-owner authorization (every same-profile non-owner role is denied, an
-- inactive owner is denied, and the true owner is allowed on the same target),
-- last-active-profile protection, atomic default reassignment, replacement
-- validation, archived-from-active-count exclusion, public-view exclusion,
-- membership/history preservation, grant posture, and the preserved
-- trg_protect_last_owner trigger — returning a PASS/FAIL row per check.
--
-- SAFETY MODEL (identical guarantees to the 0011 harness)
-- -------------------------------------------------------------------------
--   1. FAIL-CLOSED GUARD. Refuses to run unless the operator explicitly
--      asserts Development via a session confirmation token. There is no
--      reliable intrinsic Dev/Prod signal on this stack, so refusal is the
--      only safe default. Production operators must NEVER supply the token.
--   2. TOTAL ROLLBACK. Every mutation happens inside a single transaction
--      that ALWAYS ends in ROLLBACK. Nothing is ever committed.
--   3. GENERATED IDENTIFIERS. All test users/slugs use a per-run random
--      'hbtest-<random>' namespace, so runs never collide and residue is
--      trivially detectable.
--   4. NO CREDENTIALS. No passwords, secrets, JWTs, or service keys appear
--      here. Identity is simulated via request.jwt.claims (the GUC auth.uid()
--      reads), never via real authentication.
--   5. TRIGGER PRESERVED. trg_protect_last_owner is never dropped or disabled;
--      it is exercised and its enabled state is asserted.
--
-- HOW TO RUN (Development only)
-- -------------------------------------------------------------------------
--   psql "$POSTGRES_URL_NON_POOLING" -v ON_ERROR_STOP=1 \
--     -c "set gigstar.allow_archive_test = 'I_CONFIRM_DEVELOPMENT'" \
--     -f supabase/tests/0013_archive_profile_test.sql
--
--   Omit the token (or run against Production) and the harness aborts before
--   doing anything.
--
-- OUTPUT
-- -------------------------------------------------------------------------
--   * one row per check: seq | category | name | result | detail
--   * a summary row: "<passed>/<total> checks passed"
--   * a post-rollback residue proof: every count MUST be 0
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Fail-closed environment guard.
-- ---------------------------------------------------------------------------
do $guard$
begin
  if coalesce(current_setting('gigstar.allow_archive_test', true), '')
     <> 'I_CONFIRM_DEVELOPMENT' then
    raise exception
      using
        errcode = 'P0001',
        message = '0013 archive test harness REFUSED to run.',
        detail  = 'This is a Development-only harness. It will not run without explicit confirmation.',
        hint    = 'On Development only, run with: -c "set gigstar.allow_archive_test = ''I_CONFIRM_DEVELOPMENT''". Never set this on Production.';
  end if;
end
$guard$;

create temporary table hb_test_results (
  seq       integer primary key,
  category  text not null,
  name      text not null,
  passed    boolean not null,
  detail    text
);

do $harness$
declare
  v_run   text := 'hbtest-' || substr(md5(gen_random_uuid()::text), 1, 8);
  v_a     uuid := gen_random_uuid();  -- generated test user A (subject)
  v_b     uuid := gen_random_uuid();  -- generated test user B (other account)
  v_p1    uuid;  -- A: auto-default
  v_p2    uuid;  -- A
  v_p3    uuid;  -- A
  v_p4    uuid;  -- A (published, for public-view check)
  v_pb    uuid;  -- B (cross-account replacement candidate)
  v_uuid  uuid;
  v_bool  boolean;
  v_bool2 boolean;
  v_int   integer;
  v_ok    boolean;
  v_p5    uuid;   -- A: fresh active, non-default target for the exact-owner checks
  v_seq   integer;
  v_role  text;
begin
  -- =========================================================================
  -- SETUP: two generated login accounts + four owned profiles for A, one
  -- for B. Inserting into auth.users fires handle_new_user() -> user_accounts.
  -- =========================================================================
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
  values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     v_run || '-a@harness.invalid', jsonb_build_object('display_name', 'Harness User A'), now(), now(), now()),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     v_run || '-b@harness.invalid', jsonb_build_object('display_name', 'Harness User B'), now(), now(), now());

  if not exists (select 1 from public.user_accounts where id = v_a)
     or not exists (select 1 from public.user_accounts where id = v_b) then
    raise exception 'setup failed: handle_new_user did not provision user_accounts';
  end if;

  -- A creates four profiles; the first (v_p1) auto-becomes the account default.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  v_p1 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-1', 'dj',        'Harness DJ One');
  v_p2 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-2', 'artist',    'Harness Two');
  v_p3 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-3', 'venue',     'Harness Three');
  v_p4 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-4', 'organiser', 'Harness Four');

  -- B creates one profile (used as a cross-account replacement candidate).
  perform set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  v_pb := public.create_profile(public.start_profile_creation_attempt(), v_run || '-b1', 'dj', 'Harness B One');

  -- =========================================================================
  -- OWNERSHIP / CROSS-ACCOUNT ISOLATION
  -- =========================================================================

  -- 1. A non-owner (user B) cannot archive user A's profile.
  begin
    perform public.archive_profile(v_p1);
    insert into hb_test_results values (1, 'ownership',
      'a non-owner cannot archive another account''s profile',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (1, 'ownership',
      'a non-owner cannot archive another account''s profile',
      sqlstate = '42501', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 2. Cross-account: even targeting a different profile of A's, B is denied.
  begin
    perform public.archive_profile(v_p3);
    insert into hb_test_results values (2, 'ownership',
      'cross-account archive is denied for every target',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (2, 'ownership',
      'cross-account archive is denied for every target',
      sqlstate = '42501', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- Back to user A for the owner-side checks.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  -- =========================================================================
  -- DEFAULT + REPLACEMENT VALIDATION
  -- =========================================================================

  -- 3. Archiving the default WITHOUT a replacement is refused.
  begin
    perform public.archive_profile(v_p1);  -- v_p1 is the auto default
    insert into hb_test_results values (3, 'default',
      'archiving the default without a replacement is refused',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (3, 'default',
      'archiving the default without a replacement is refused',
      sqlstate = '22023', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 4. A cross-account replacement default is rejected.
  begin
    perform public.archive_profile(v_p1, v_pb);  -- v_pb belongs to B
    insert into hb_test_results values (4, 'default',
      'a cross-account replacement default is rejected',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (4, 'default',
      'a cross-account replacement default is rejected',
      sqlstate = '22023', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 5. Archiving the default WITH a valid replacement reassigns atomically.
  begin
    v_uuid := public.archive_profile(v_p1, v_p2);         -- archive default, hand off to v_p2
    v_bool := (public.resolve_default_profile() = v_p2);  -- default is now v_p2
    select (lifecycle_status::text = 'archived' and archived_at is not null)
      into v_bool2 from public.profiles where id = v_p1;
    insert into hb_test_results values (5, 'default',
      'archiving the default reassigns the default atomically',
      v_uuid = v_p1 and v_bool and coalesce(v_bool2, false),
      format('new_default_is_p2=%s p1_archived=%s', v_bool, v_bool2));
  exception when others then
    insert into hb_test_results values (5, 'default',
      'archiving the default reassigns the default atomically',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- OWNER ARCHIVE / ACTIVE COUNT / MEMBERSHIP PRESERVATION
  -- =========================================================================

  -- 6. Owner archives a NON-last, non-default profile (v_p3). Succeeds.
  begin
    v_uuid := public.archive_profile(v_p3);
    select (lifecycle_status::text = 'archived' and archived_at is not null and visibility::text = 'hidden')
      into v_bool from public.profiles where id = v_p3;
    insert into hb_test_results values (6, 'archive',
      'owner can archive a non-last, non-default profile',
      v_uuid = v_p3 and coalesce(v_bool, false),
      'p3_archived=' || coalesce(v_bool::text, 'null'));
  exception when others then
    insert into hb_test_results values (6, 'archive',
      'owner can archive a non-last, non-default profile',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 7. The archived profile drops OUT of the active-owner count. After
  --    archiving p1 and p3, A has exactly two active profiles (p2, p4).
  begin
    select count(*) into v_int
    from public.profiles p
    join public.profile_memberships m on m.profile_id = p.id
    where m.user_id = v_a and m.role = 'owner' and m.status = 'active'
      and p.deleted_at is null and p.archived_at is null and p.lifecycle_status <> 'archived';
    insert into hb_test_results values (7, 'archive',
      'archived profiles are excluded from the active-profile count',
      v_int = 2, 'active_owner_profiles=' || coalesce(v_int::text, 'null'));
  exception when others then
    insert into hb_test_results values (7, 'archive',
      'archived profiles are excluded from the active-profile count',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 8. Membership + history are preserved: A still holds an active owner
  --    membership on the archived v_p3 (soft-archive never removed it).
  begin
    select exists (
      select 1 from public.profile_memberships
      where profile_id = v_p3 and user_id = v_a and role = 'owner' and status = 'active'
    ) into v_bool;
    insert into hb_test_results values (8, 'archive',
      'archival preserves the owner membership (soft-archive, no delete)',
      coalesce(v_bool, false), 'owner_membership_retained=' || coalesce(v_bool::text, 'null'));
  exception when others then
    insert into hb_test_results values (8, 'archive',
      'archival preserves the owner membership (soft-archive, no delete)',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 9. Re-archiving an already-archived profile is refused (not_archivable).
  begin
    perform public.archive_profile(v_p3);
    insert into hb_test_results values (9, 'archive',
      'an already-archived profile cannot be archived again',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (9, 'archive',
      'an already-archived profile cannot be archived again',
      sqlstate = '22023', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- PUBLIC-VIEW EXCLUSION
  -- =========================================================================

  -- 10. A published profile is visible in public_profiles; once archived it
  --     disappears. v_p4 is published, then archived (p2, p4 active -> p4 not
  --     last, no replacement needed as p4 is not the default).
  begin
    update public.profiles
      set visibility = 'public', lifecycle_status = 'active', published_at = now()
      where id = v_p4;
    select exists (select 1 from public.public_profiles where id = v_p4) into v_bool;  -- expect true
    perform public.archive_profile(v_p4);
    select exists (select 1 from public.public_profiles where id = v_p4) into v_bool2; -- expect false
    insert into hb_test_results values (10, 'privacy',
      'an archived profile is excluded from public_profiles',
      (v_bool is true) and (v_bool2 is false),
      format('published_visible=%s archived_visible=%s', v_bool, v_bool2));
  exception when others then
    insert into hb_test_results values (10, 'privacy',
      'an archived profile is excluded from public_profiles',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- LAST-ACTIVE PROTECTION
  -- =========================================================================

  -- 11. A now has a single active profile (v_p2, also the default). Archiving
  --     it is refused with last_active_profile (P0001) — the account can never
  --     be stranded with zero active profiles.
  begin
    perform public.archive_profile(v_p2, v_p1);  -- replacement offered, but it's the last active
    insert into hb_test_results values (11, 'last-active',
      'the last active profile cannot be archived',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (11, 'last-active',
      'the last active profile cannot be archived',
      sqlstate = 'P0001', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- GRANTS
  -- =========================================================================

  -- 12. Execute grants exclude PUBLIC and anon; authenticated may execute.
  begin
    select
      not has_function_privilege('anon',   'public.archive_profile(uuid, uuid)', 'execute')
      and not has_function_privilege('public', 'public.archive_profile(uuid, uuid)', 'execute')
      and has_function_privilege('authenticated', 'public.archive_profile(uuid, uuid)', 'execute')
      into v_ok;
    insert into hb_test_results values (12, 'grants',
      'archive_profile execute excludes PUBLIC/anon, allows authenticated',
      coalesce(v_ok, false), 'grant_posture_ok=' || coalesce(v_ok::text, 'null'));
  exception when others then
    insert into hb_test_results values (12, 'grants',
      'archive_profile execute excludes PUBLIC/anon, allows authenticated',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- PRESERVED TRIGGER
  -- =========================================================================

  -- 13. trg_protect_last_owner is still ENABLED and still blocks removing the
  --     sole owner of a profile (archival must not have weakened it).
  begin
    select tgenabled = 'O' into v_bool from pg_trigger where tgname = 'trg_protect_last_owner';
    begin
      delete from public.profile_memberships where profile_id = v_p2 and user_id = v_a;
      v_bool2 := false;  -- should have been blocked
    exception when others then
      v_bool2 := (sqlstate = '23514');
    end;
    insert into hb_test_results values (13, 'trigger',
      'trg_protect_last_owner remains enabled and enforces last-owner protection',
      coalesce(v_bool, false) and v_bool2,
      format('enabled=%s blocked_sole_owner_delete=%s', v_bool, v_bool2));
  exception when others then
    insert into hb_test_results values (13, 'trigger',
      'trg_protect_last_owner remains enabled and enforces last-owner protection',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- EXACT-OWNER AUTHORIZATION (archival requires the role to be EXACTLY owner)
  -- -------------------------------------------------------------------------
  -- The authorization gate fires BEFORE any lifecycle/default/last-active
  -- check, so a fresh active, non-default profile of A's stays a valid
  -- archival target throughout these checks: the ONLY thing that changes the
  -- outcome is the caller's role on that exact profile.
  -- =========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  v_p5 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-5', 'dj', 'Harness Five');

  -- 14-18. Every same-profile NON-OWNER role (active membership) is denied.
  v_seq := 14;
  foreach v_role in array array['administrator','editor','event_manager','content_contributor','analyst']
  loop
    insert into public.profile_memberships (profile_id, user_id, role, status)
    values (v_p5, v_b, v_role::public.membership_role, 'active')
    on conflict (profile_id, user_id)
    do update set role = excluded.role, status = 'active';

    perform set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
    begin
      perform public.archive_profile(v_p5);
      insert into hb_test_results values (v_seq, 'exact-owner',
        format('a same-profile %s member cannot archive (owner-only)', v_role),
        false, 'expected exception, none raised');
    exception when others then
      insert into hb_test_results values (v_seq, 'exact-owner',
        format('a same-profile %s member cannot archive (owner-only)', v_role),
        sqlstate = '42501', 'got ' || sqlstate || ': ' || sqlerrm);
    end;
    perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
    v_seq := v_seq + 1;
  end loop;

  -- 19. An INACTIVE owner membership does NOT satisfy the owner requirement.
  begin
    insert into public.profile_memberships (profile_id, user_id, role, status)
    values (v_p5, v_b, 'owner', 'inactive')
    on conflict (profile_id, user_id)
    do update set role = 'owner', status = 'inactive';

    perform set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
    begin
      perform public.archive_profile(v_p5);
      insert into hb_test_results values (19, 'exact-owner',
        'an inactive owner membership cannot archive',
        false, 'expected exception, none raised');
    exception when others then
      insert into hb_test_results values (19, 'exact-owner',
        'an inactive owner membership cannot archive',
        sqlstate = '42501', 'got ' || sqlstate || ': ' || sqlerrm);
    end;
    perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  exception when others then
    insert into hb_test_results values (19, 'exact-owner',
      'an inactive owner membership cannot archive',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 20. POSITIVE CONTROL: the true active owner (A) CAN archive that exact
  --     same profile — proving 14-19 fail on authorization, not on some
  --     unrelated guard. (A still holds p2 as an active default, so p5 is
  --     neither last-active nor the default.)
  begin
    v_uuid := public.archive_profile(v_p5);
    select (lifecycle_status::text = 'archived' and archived_at is not null)
      into v_bool from public.profiles where id = v_p5;
    insert into hb_test_results values (20, 'exact-owner',
      'the true active owner can archive the same profile (positive control)',
      v_uuid = v_p5 and coalesce(v_bool, false),
      'owner_archive_succeeded=' || coalesce(v_bool::text, 'null'));
  exception when others then
    insert into hb_test_results values (20, 'exact-owner',
      'the true active owner can archive the same profile (positive control)',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;
end
$harness$;

-- ---------------------------------------------------------------------------
-- Per-check results.
-- ---------------------------------------------------------------------------
select
  seq,
  category,
  name,
  case when passed then 'PASS' else 'FAIL' end as result,
  detail
from hb_test_results
order by seq;

-- Summary line.
select
  count(*) filter (where passed) || '/' || count(*) || ' checks passed'
    as summary,
  (count(*) = count(*) filter (where passed)) as all_passed
from hb_test_results;

-- ---------------------------------------------------------------------------
-- Discard ALL test data. Nothing this harness created is ever committed.
-- ---------------------------------------------------------------------------
rollback;

-- ===========================================================================
-- ZERO-RESIDUE PROOF (runs after ROLLBACK, in a fresh implicit transaction).
-- Every count MUST be 0.
-- ===========================================================================
select 'auth.users'                       as relation, count(*) as residual_rows
  from auth.users where email like 'hbtest-%@harness.invalid'
union all
select 'public.user_accounts', count(*)
  from public.user_accounts where email::text like 'hbtest-%@harness.invalid'
union all
select 'public.profiles', count(*)
  from public.profiles where slug::text like 'hbtest-%'
union all
select 'public.profile_memberships', count(*)
  from public.profile_memberships m
  where exists (select 1 from public.profiles p where p.id = m.profile_id and p.slug::text like 'hbtest-%')
union all
select 'public.profile_creation_attempts', count(*)
  from public.profile_creation_attempts
  where requested_slug::text like 'hbtest-%'
order by relation;
