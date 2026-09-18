-- ===========================================================================
-- GigStar — 0011 Onboarding Foundation test harness
-- ===========================================================================
-- Repeatable, DEVELOPMENT-ONLY SQL test harness for the multi-profile
-- onboarding foundation shipped in migrations 0002/0006/0007/0011/0012.
--
-- It exercises 21 checks across: onboarding, ownership, idempotency,
-- concurrency, the five-active-profile limit, default-profile resolution,
-- slug availability, privacy (public views), and cross-account regression —
-- and returns an individual PASS/FAIL row for every check.
--
-- SAFETY MODEL (why this can never harm Production)
-- -------------------------------------------------------------------------
--   1. FAIL-CLOSED GUARD. The harness refuses to run unless the operator
--      explicitly asserts they are on Development by supplying a session
--      confirmation token (see "HOW TO RUN"). There is no reliable intrinsic
--      Dev/Prod signal on this stack (current_database() is 'postgres' in
--      both), so the only safe default is to refuse. Production operators
--      must NEVER supply the token.
--   2. TOTAL ROLLBACK. Every mutation (generated auth users, accounts,
--      profiles, memberships, attempts, onboarding state) happens inside a
--      single transaction that ALWAYS ends in ROLLBACK. Even if the harness
--      were somehow run against a populated database, it commits nothing.
--   3. GENERATED IDENTIFIERS. All test users/slugs use a per-run random
--      'hbtest-<random>' namespace, so runs never collide and residue is
--      trivially detectable.
--   4. NO CREDENTIALS. No passwords, secrets, JWTs, or service keys appear
--      here. Test users are minted directly in auth.users with a random id;
--      identity is simulated via request.jwt.claims (the same GUC auth.uid()
--      reads), never via real authentication.
--   5. TRIGGER PRESERVED. trg_protect_last_owner is never dropped or
--      disabled; it is exercised and its enabled state is asserted. The
--      wrapping ROLLBACK is what guarantees teardown, so the trigger stays
--      intact throughout.
--
-- HOW TO RUN (Development only)
-- -------------------------------------------------------------------------
--   psql "$POSTGRES_URL_NON_POOLING" -v ON_ERROR_STOP=1 \
--     -c "set gigstar.allow_onboarding_test = 'I_CONFIRM_DEVELOPMENT'" \
--     -f supabase/tests/0011_onboarding_foundation_test.sql
--
--   The -c token is set at session scope and carries into the -f script on
--   the same connection. Omit it (or run against Production) and the harness
--   aborts before doing anything.
--
-- OUTPUT
-- -------------------------------------------------------------------------
--   * one row per check: seq | category | name | result | detail
--   * a summary row: "<passed>/<total> checks passed"
--   * a post-rollback residue proof: every count MUST be 0
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Fail-closed environment guard. Aborts the whole transaction unless the
-- operator has explicitly confirmed a Development run.
-- ---------------------------------------------------------------------------
do $guard$
begin
  if coalesce(current_setting('gigstar.allow_onboarding_test', true), '')
     <> 'I_CONFIRM_DEVELOPMENT' then
    raise exception
      using
        errcode = 'P0001',
        message = '0011 onboarding test harness REFUSED to run.',
        detail  = 'This is a Development-only harness. It will not run without explicit confirmation.',
        hint    = 'On Development only, run with: -c "set gigstar.allow_onboarding_test = ''I_CONFIRM_DEVELOPMENT''". Never set this on Production.';
  end if;
end
$guard$;

-- Results collector (transaction-scoped; vanishes on ROLLBACK).
create temporary table hb_test_results (
  seq       integer primary key,
  category  text not null,
  name      text not null,
  passed    boolean not null,
  detail    text
);

-- ---------------------------------------------------------------------------
-- The harness body: mints generated users, runs 21 checks, records PASS/FAIL.
-- Each check is an isolated subtransaction (BEGIN/EXCEPTION) so an expected
-- error, or an unexpected failure, is captured as a FAIL without derailing
-- the rest of the run.
-- ---------------------------------------------------------------------------
do $harness$
declare
  v_run     text := 'hbtest-' || substr(md5(gen_random_uuid()::text), 1, 8);
  v_a       uuid := gen_random_uuid();  -- generated test user A
  v_b       uuid := gen_random_uuid();  -- generated test user B
  v_attempt uuid;
  v_dup     uuid;
  v_p1      uuid;
  v_p2      uuid;
  v_p3      uuid;
  v_p4      uuid;
  v_p5      uuid;
  v_uuid    uuid;
  v_bool    boolean;
  v_bool2   boolean;
  v_int     integer;
  v_txt     text;
  v_blocked_sole    boolean;
  v_allowed_nonlast boolean;
  v_blocked_last    boolean;
begin
  -- =========================================================================
  -- SETUP: two generated login accounts. Inserting into auth.users fires
  -- on_auth_user_created -> handle_new_user(), which provisions
  -- public.user_accounts automatically. No credentials are stored.
  -- =========================================================================
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
  values
    (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     v_run || '-a@harness.invalid', jsonb_build_object('display_name', 'Harness User A'), now(), now(), now()),
    (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     v_run || '-b@harness.invalid', jsonb_build_object('display_name', 'Harness User B'), now(), now(), now());

  -- Sanity: user_accounts must have been auto-provisioned for both.
  if not exists (select 1 from public.user_accounts where id = v_a)
     or not exists (select 1 from public.user_accounts where id = v_b) then
    raise exception 'setup failed: handle_new_user did not provision user_accounts';
  end if;

  -- Impersonate user A for the onboarding/creation flow.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  -- =========================================================================
  -- ONBOARDING
  -- =========================================================================

  -- 1. start_profile_creation_attempt() mints a server-side attempt key.
  begin
    v_attempt := public.start_profile_creation_attempt();
    insert into hb_test_results values (
      1, 'onboarding', 'start_profile_creation_attempt() returns a server-minted attempt id',
      v_attempt is not null
        and exists (select 1 from public.profile_creation_attempts
                    where id = v_attempt and user_id = v_a and status = 'pending'),
      'attempt=' || coalesce(v_attempt::text, 'null'));
  exception when others then
    insert into hb_test_results values (1, 'onboarding',
      'start_profile_creation_attempt() returns a server-minted attempt id',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 2. set_onboarding_step persists the first step ('type').
  begin
    perform public.set_onboarding_step('type', v_attempt);
    select current_step::text into v_txt from public.onboarding_state where user_id = v_a;
    insert into hb_test_results values (
      2, 'onboarding', 'set_onboarding_step persists initial step "type"',
      v_txt = 'type', 'current_step=' || coalesce(v_txt, 'null'));
  exception when others then
    insert into hb_test_results values (2, 'onboarding',
      'set_onboarding_step persists initial step "type"',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 3. Onboarding step progression is resumable (advances to 'review').
  begin
    perform public.set_onboarding_step('details', v_attempt);
    perform public.set_onboarding_step('handle', v_attempt);
    perform public.set_onboarding_step('review', v_attempt);
    select current_step::text into v_txt from public.onboarding_state where user_id = v_a;
    insert into hb_test_results values (
      3, 'onboarding', 'set_onboarding_step progresses to "review"',
      v_txt = 'review', 'current_step=' || coalesce(v_txt, 'null'));
  exception when others then
    insert into hb_test_results values (3, 'onboarding',
      'set_onboarding_step progresses to "review"',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 4. Onboarding ownership guard: user B cannot write onboarding state that
  --    references user A's attempt (regression / cross-account security).
  perform set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  begin
    perform public.set_onboarding_step('type', v_attempt);
    insert into hb_test_results values (4, 'onboarding',
      'set_onboarding_step rejects an attempt owned by another account',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (4, 'onboarding',
      'set_onboarding_step rejects an attempt owned by another account',
      sqlstate = '42501', 'got ' || sqlstate || ': ' || sqlerrm);
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  -- =========================================================================
  -- SLUG
  -- =========================================================================

  -- 5. slug_available() is true for a fresh, valid candidate.
  begin
    v_bool := public.slug_available(v_run || '-free');
    insert into hb_test_results values (
      5, 'slug', 'slug_available() true for a fresh valid slug',
      v_bool is true, 'slug_available=' || coalesce(v_bool::text, 'null'));
  exception when others then
    insert into hb_test_results values (5, 'slug',
      'slug_available() true for a fresh valid slug',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 6. slug_available() rejects reserved words, too-short, and bad formats.
  begin
    insert into hb_test_results values (
      6, 'slug', 'slug_available() rejects reserved / too-short / malformed slugs',
      public.slug_available('admin') = false
        and public.slug_available('ab') = false
        and public.slug_available('Bad Slug!') = false,
      format('admin=%s ab=%s badfmt=%s',
        public.slug_available('admin'), public.slug_available('ab'), public.slug_available('Bad Slug!')));
  exception when others then
    insert into hb_test_results values (6, 'slug',
      'slug_available() rejects reserved / too-short / malformed slugs',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- OWNERSHIP (create the first profile via the atomic RPC)
  -- =========================================================================

  -- 8. create_profile() creates a hidden/draft profile (defined before 7 so a
  --    real slug exists to prove "taken"; recorded under seq 8).
  begin
    v_p1 := public.create_profile(v_attempt, v_run || '-1', 'dj', 'Harness DJ One');
    select (visibility::text = 'hidden' and lifecycle_status::text = 'draft')
      into v_bool from public.profiles where id = v_p1;
    insert into hb_test_results values (
      8, 'ownership', 'create_profile() creates a hidden/draft profile',
      v_p1 is not null and coalesce(v_bool, false),
      'profile=' || coalesce(v_p1::text, 'null'));
  exception when others then
    insert into hb_test_results values (8, 'ownership',
      'create_profile() creates a hidden/draft profile',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 7. slug_available() is false once a slug is taken.
  begin
    v_bool := public.slug_available(v_run || '-1');
    insert into hb_test_results values (
      7, 'slug', 'slug_available() false for an already-used slug',
      v_bool is false, 'slug_available=' || coalesce(v_bool::text, 'null'));
  exception when others then
    insert into hb_test_results values (7, 'slug',
      'slug_available() false for an already-used slug',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 9. create_profile() grants the creator an active OWNER membership.
  begin
    select exists (
      select 1 from public.profile_memberships
      where profile_id = v_p1 and user_id = v_a
        and role = 'owner' and status = 'active'
    ) into v_bool;
    insert into hb_test_results values (
      9, 'ownership', 'create_profile() grants an active owner membership',
      coalesce(v_bool, false), 'owner_membership=' || coalesce(v_bool::text, 'null'));
  exception when others then
    insert into hb_test_results values (9, 'ownership',
      'create_profile() grants an active owner membership',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 10. Cross-account isolation: user B cannot set user A's profile as their
  --     default (has_profile_access denies it). Regression guard.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  begin
    perform public.set_default_profile(v_p1);
    insert into hb_test_results values (10, 'regression',
      'a non-member cannot set another account''s profile as default',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (10, 'regression',
      'a non-member cannot set another account''s profile as default',
      sqlstate = '42501', 'got ' || sqlstate || ': ' || sqlerrm);
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  -- =========================================================================
  -- IDEMPOTENCY / CONCURRENCY
  -- =========================================================================

  -- 11. Idempotent replay: re-running create_profile() with the SAME completed
  --     attempt returns the SAME profile and creates no duplicate.
  begin
    v_uuid := public.create_profile(v_attempt, v_run || '-1', 'dj', 'Harness DJ One');
    select count(*) into v_int from public.profiles p
      join public.profile_memberships m on m.profile_id = p.id
      where m.user_id = v_a and m.role = 'owner' and m.status = 'active';
    insert into hb_test_results values (
      11, 'idempotency', 'replaying a completed attempt returns the same profile (no duplicate)',
      v_uuid = v_p1 and v_int = 1,
      format('replay=%s original=%s owner_profiles=%s', v_uuid, v_p1, v_int));
  exception when others then
    insert into hb_test_results values (11, 'idempotency',
      'replaying a completed attempt returns the same profile (no duplicate)',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 12. Idempotency ledger: the attempt is marked completed and bound to the
  --     single profile it produced.
  begin
    select (status::text = 'completed' and created_profile_id = v_p1 and completed_at is not null)
      into v_bool from public.profile_creation_attempts where id = v_attempt;
    insert into hb_test_results values (
      12, 'idempotency', 'attempt ledger is marked completed and bound to its profile',
      coalesce(v_bool, false), 'ledger_ok=' || coalesce(v_bool::text, 'null'));
  exception when others then
    insert into hb_test_results values (12, 'idempotency',
      'attempt ledger is marked completed and bound to its profile',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 13. Concurrency / uniqueness race guard: a fresh attempt reusing a taken
  --     slug surfaces a controlled 'slug_taken' (23505).
  begin
    v_dup := public.start_profile_creation_attempt();
    perform public.create_profile(v_dup, v_run || '-1', 'dj', 'Dup Slug');
    insert into hb_test_results values (13, 'concurrency',
      'duplicate slug is rejected with slug_taken (unique race guard)',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (13, 'concurrency',
      'duplicate slug is rejected with slug_taken (unique race guard)',
      sqlstate = '23505', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- FIVE-PROFILE LIMIT
  -- =========================================================================

  -- 14. The limit is the single-source-of-truth value 5.
  begin
    v_int := public.max_active_profiles_per_account();
    insert into hb_test_results values (
      14, 'five-limit', 'max_active_profiles_per_account() = 5',
      v_int = 5, 'limit=' || coalesce(v_int::text, 'null'));
  exception when others then
    insert into hb_test_results values (14, 'five-limit',
      'max_active_profiles_per_account() = 5',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 15. An account may hold exactly five active profiles (create 4 more).
  begin
    v_p2 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-2', 'artist', 'Harness Two');
    v_p3 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-3', 'venue',  'Harness Three');
    v_p4 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-4', 'organiser', 'Harness Four');
    v_p5 := public.create_profile(public.start_profile_creation_attempt(), v_run || '-5', 'dj', 'Harness Five');
    select count(*) into v_int from public.profiles p
      join public.profile_memberships m on m.profile_id = p.id
      where m.user_id = v_a and m.role = 'owner' and m.status = 'active'
        and p.deleted_at is null and p.archived_at is null and p.lifecycle_status <> 'archived';
    insert into hb_test_results values (
      15, 'five-limit', 'an account may own exactly five active profiles',
      v_int = 5, 'active_owner_profiles=' || coalesce(v_int::text, 'null'));
  exception when others then
    insert into hb_test_results values (15, 'five-limit',
      'an account may own exactly five active profiles',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 16. The sixth active profile is refused with profile_limit_reached (P0001).
  begin
    perform public.create_profile(public.start_profile_creation_attempt(), v_run || '-6', 'dj', 'Harness Six');
    insert into hb_test_results values (16, 'five-limit',
      'a sixth active profile is refused with profile_limit_reached',
      false, 'expected exception, none raised');
  exception when others then
    insert into hb_test_results values (16, 'five-limit',
      'a sixth active profile is refused with profile_limit_reached',
      sqlstate = 'P0001', 'got ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- DEFAULT PROFILE
  -- =========================================================================

  -- 17. The first created profile becomes the account default automatically.
  begin
    v_uuid := public.resolve_default_profile();
    insert into hb_test_results values (
      17, 'default-profile', 'first created profile auto-resolves as the account default',
      v_uuid = v_p1, 'resolved=' || coalesce(v_uuid::text, 'null') || ' expected=' || v_p1::text);
  exception when others then
    insert into hb_test_results values (17, 'default-profile',
      'first created profile auto-resolves as the account default',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 18. set_default_profile() switches the resolved default.
  begin
    perform public.set_default_profile(v_p2);
    v_uuid := public.resolve_default_profile();
    insert into hb_test_results values (
      18, 'default-profile', 'set_default_profile() switches the resolved default',
      v_uuid = v_p2, 'resolved=' || coalesce(v_uuid::text, 'null') || ' expected=' || v_p2::text);
  exception when others then
    insert into hb_test_results values (18, 'default-profile',
      'set_default_profile() switches the resolved default',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- 19. An archived profile is not a valid default: resolve returns NULL and
  --     set_default_profile() refuses it (22023).
  begin
    update public.profiles
      set lifecycle_status = 'archived', archived_at = now()
      where id = v_p2;
    v_uuid := public.resolve_default_profile();  -- default was v_p2, now archived
    v_bool := (v_uuid is null);
    begin
      perform public.set_default_profile(v_p2);
      v_bool2 := false;  -- should have raised
    exception when others then
      v_bool2 := (sqlstate = '22023');
    end;
    insert into hb_test_results values (
      19, 'default-profile', 'an archived profile is not a valid default (resolve NULL, set refused)',
      v_bool and v_bool2,
      format('resolved_null=%s set_refused_22023=%s', v_bool, v_bool2));
  exception when others then
    insert into hb_test_results values (19, 'default-profile',
      'an archived profile is not a valid default (resolve NULL, set refused)',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- TRIGGER: trg_protect_last_owner (preserve + verify)
  -- =========================================================================

  -- 20. The trigger is ENABLED and enforces its full contract: it blocks
  --     removing the sole owner, allows removing a non-last owner, then blocks
  --     removing the final remaining owner. v_p3 is a single-owner profile.
  begin
    -- (a) trigger must be enabled ('O' = enabled, origin)
    select tgenabled = 'O' into v_bool from pg_trigger where tgname = 'trg_protect_last_owner';

    -- (b) deleting the sole owner must fail
    begin
      delete from public.profile_memberships where profile_id = v_p3 and user_id = v_a;
      v_blocked_sole := false;
    exception when others then
      v_blocked_sole := (sqlstate = '23514');
    end;

    -- (c) with a second active owner present, removing the first is allowed
    insert into public.profile_memberships (profile_id, user_id, role, status)
      values (v_p3, v_b, 'owner', 'active');
    begin
      delete from public.profile_memberships where profile_id = v_p3 and user_id = v_a;
      v_allowed_nonlast := true;
    exception when others then
      v_allowed_nonlast := false;
    end;

    -- (d) removing the now-final owner must fail again
    begin
      delete from public.profile_memberships where profile_id = v_p3 and user_id = v_b;
      v_blocked_last := false;
    exception when others then
      v_blocked_last := (sqlstate = '23514');
    end;

    insert into hb_test_results values (
      20, 'trigger', 'trg_protect_last_owner enabled and enforces last-owner protection',
      coalesce(v_bool, false) and v_blocked_sole and v_allowed_nonlast and v_blocked_last,
      format('enabled=%s block_sole=%s allow_nonlast=%s block_last=%s',
        v_bool, v_blocked_sole, v_allowed_nonlast, v_blocked_last));
  exception when others then
    insert into hb_test_results values (20, 'trigger',
      'trg_protect_last_owner enabled and enforces last-owner protection',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;

  -- =========================================================================
  -- PRIVACY (public-safe views)
  -- =========================================================================

  -- 21. A hidden/draft profile is invisible in public_profiles; once made
  --     public + active it becomes visible. v_p4 is still hidden/draft.
  begin
    select exists (select 1 from public.public_profiles where id = v_p4) into v_bool;   -- expect false
    update public.profiles
      set visibility = 'public', lifecycle_status = 'active', published_at = now()
      where id = v_p4;
    select exists (select 1 from public.public_profiles where id = v_p4) into v_bool2;  -- expect true
    insert into hb_test_results values (
      21, 'privacy', 'unpublished profile hidden from public_profiles; published profile visible',
      (v_bool is false) and (v_bool2 is true),
      format('hidden_visible=%s published_visible=%s', v_bool, v_bool2));
  exception when others then
    insert into hb_test_results values (21, 'privacy',
      'unpublished profile hidden from public_profiles; published profile visible',
      false, 'unexpected error ' || sqlstate || ': ' || sqlerrm);
  end;
end
$harness$;

-- ---------------------------------------------------------------------------
-- Per-check results (individual PASS/FAIL for all 21 checks).
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
-- Every count MUST be 0 — this confirms no test user or related record from
-- THIS or ANY prior run of this harness persists in the database.
-- ===========================================================================
select 'auth.users'                as relation, count(*) as residual_rows
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
union all
select 'public.onboarding_state', count(*)
  from public.onboarding_state s
  where not exists (select 1 from public.user_accounts u where u.id = s.user_id)
order by relation;
