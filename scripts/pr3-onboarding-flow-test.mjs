import pg from "/tmp/pgtest/node_modules/pg/lib/index.js"

// Faithful, residue-free integration test of the PR-3 onboarding server-action
// RPC sequence against the Development database. Everything runs inside a single
// transaction that ALWAYS rolls back, so no rows survive. A user is impersonated
// via request.jwt.claims (matching auth.uid()), exactly like the RLS-bound
// Supabase client the server actions use.

const rawUrl = process.env.POSTGRES_URL_NON_POOLING
if (!rawUrl) {
  console.error("MISSING POSTGRES_URL_NON_POOLING")
  process.exit(1)
}
// Strip sslmode from the connection string and force non-verifying TLS
// (Supabase uses a self-signed chain for direct connections).
const url = rawUrl.replace(/[?&]sslmode=[^&]*/i, "")

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

let pass = 0
let fail = 0
function check(name, cond, detail) {
  if (cond) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`)
  }
}

// Impersonate a given auth user for subsequent RLS-bound statements.
async function actAs(userId) {
  await client.query(
    `select set_config('request.jwt.claims', json_build_object('sub', $1::text, 'role','authenticated')::text, true),
            set_config('request.jwt.claim.sub', $1::text, true),
            set_config('role', 'authenticated', true)`,
    [userId],
  )
  await client.query(`set local role authenticated`)
}
async function actAsService() {
  await client.query(`reset role`)
  await client.query(`select set_config('request.jwt.claims', '', true)`)
}

const uniq = Date.now()
const email = `pr3-test-${uniq}@example.test`
const slug = `pr3-dj-${uniq}`

async function main() {
  await client.connect()
  await client.query("begin")
  try {
    // --- Setup: create an auth user; handle_new_user auto-provisions user_accounts.
    const ins = await client.query(
      `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
       values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $1, crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
       returning id`,
      [email],
    )
    const userId = ins.rows[0].id
    console.log(`\nImpersonating user ${userId}\n`)

    const acct = await client.query(`select id from public.user_accounts where id = $1`, [userId])
    check("handle_new_user provisioned user_accounts", acct.rowCount === 1)

    await actAs(userId)

    // --- Step 1: selectTypeAction → start attempt + set step 'details'.
    const attempt = await client.query(`select public.start_profile_creation_attempt() as id`)
    const attemptId = attempt.rows[0].id
    check("start_profile_creation_attempt returns id", !!attemptId)

    await client.query(`select public.set_onboarding_step('details'::public.onboarding_step, $1::uuid)`, [attemptId])
    let state = await client.query(
      `select current_step, active_attempt_id from public.onboarding_state where user_id = $1`,
      [userId],
    )
    check("onboarding_state.current_step = details", state.rows[0]?.current_step === "details", JSON.stringify(state.rows[0]))
    check("onboarding_state.active_attempt_id = attempt", state.rows[0]?.active_attempt_id === attemptId)

    // --- Step 2: submitDetailsAction → set step 'handle'.
    await client.query(`select public.set_onboarding_step('handle'::public.onboarding_step, $1::uuid)`, [attemptId])
    state = await client.query(`select current_step from public.onboarding_state where user_id = $1`, [userId])
    check("onboarding_state.current_step = handle", state.rows[0]?.current_step === "handle")

    // --- Step 3: checkHandle + submitHandleAction → slug available, set step 'review'.
    const avail = await client.query(`select public.slug_available($1) as ok`, [slug])
    check("slug_available true for fresh slug", avail.rows[0]?.ok === true)
    await client.query(`select public.set_onboarding_step('review'::public.onboarding_step, $1::uuid)`, [attemptId])
    state = await client.query(`select current_step from public.onboarding_state where user_id = $1`, [userId])
    check("onboarding_state.current_step = review", state.rows[0]?.current_step === "review")

    // --- Step 4: createProfileAction → create_profile(...).
    const created = await client.query(
      `select public.create_profile($1::uuid, $2, 'dj'::public.profile_type, $3, $4, $5, $6::double precision, $7::double precision) as pid`,
      [attemptId, slug, "PR3 Test DJ", "Test tagline", "Brighton", -0.1372, 50.8225],
    )
    const profileId = created.rows[0].pid
    check("create_profile returns profile id", !!profileId)

    // Profile row shape + defaults.
    const prof = await client.query(
      `select slug, type, display_name, tagline, location_label, lifecycle_status, visibility, created_by
       from public.profiles where id = $1`,
      [profileId],
    )
    const p = prof.rows[0]
    check("profile.slug matches", p?.slug === slug)
    check("profile.type = dj", p?.type === "dj")
    check("profile.display_name matches", p?.display_name === "PR3 Test DJ")
    check("profile.lifecycle_status = draft", p?.lifecycle_status === "draft", `got ${p?.lifecycle_status}`)
    check("profile.visibility = hidden", p?.visibility === "hidden", `got ${p?.visibility}`)
    check("profile.created_by = user", p?.created_by === userId, `got ${p?.created_by}`)

    // Owner membership created.
    const mem = await client.query(
      `select role, status from public.profile_memberships where profile_id = $1 and user_id = $2`,
      [profileId, userId],
    )
    check("owner membership exists", mem.rowCount === 1)
    check("owner membership role = owner", mem.rows[0]?.role === "owner", JSON.stringify(mem.rows[0]))
    check("owner membership status = active", mem.rows[0]?.status === "active", JSON.stringify(mem.rows[0]))

    // Default profile assigned (first profile).
    const def = await client.query(`select public.resolve_default_profile() as d`)
    check("resolve_default_profile = new profile", def.rows[0]?.d === profileId, `got ${def.rows[0]?.d}`)

    // Attempt completed.
    const att = await client.query(
      `select status, created_profile_id from public.profile_creation_attempts where id = $1`,
      [attemptId],
    )
    check("attempt.status = completed", att.rows[0]?.status === "completed", JSON.stringify(att.rows[0]))
    check("attempt.created_profile_id = profile", att.rows[0]?.created_profile_id === profileId)

    // --- completed step.
    await client.query(`select public.set_onboarding_step('completed'::public.onboarding_step, $1::uuid)`, [attemptId])
    state = await client.query(`select current_step from public.onboarding_state where user_id = $1`, [userId])
    check("onboarding_state.current_step = completed", state.rows[0]?.current_step === "completed")

    // --- Idempotency: create_profile replays same profile for a completed attempt.
    const replay = await client.query(
      `select public.create_profile($1::uuid, $2, 'dj'::public.profile_type, $3, null, null, null, null) as pid`,
      [attemptId, slug, "PR3 Test DJ"],
    )
    check("create_profile idempotent replay returns same id", replay.rows[0]?.pid === profileId, `got ${replay.rows[0]?.pid}`)

    // --- slug now taken.
    const avail2 = await client.query(`select public.slug_available($1) as ok`, [slug])
    check("slug_available false after creation", avail2.rows[0]?.ok === false)

    await actAsService()
    await client.query("rollback")

    // --- Post-rollback residue proof.
    const resProfiles = await client.query(`select count(*)::int c from public.profiles where slug = $1`, [slug])
    const resUsers = await client.query(`select count(*)::int c from auth.users where email = $1`, [email])
    check("post-rollback: 0 profiles with test slug", resProfiles.rows[0].c === 0, `got ${resProfiles.rows[0].c}`)
    check("post-rollback: 0 auth.users with test email", resUsers.rows[0].c === 0, `got ${resUsers.rows[0].c}`)

    console.log(`\n${fail === 0 ? "ALL PASS" : "FAILURES PRESENT"} — ${pass} passed, ${fail} failed\n`)
    process.exitCode = fail === 0 ? 0 : 1
  } catch (err) {
    console.error("\nHARNESS ERROR:", err.message)
    try {
      await client.query("rollback")
    } catch {}
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
