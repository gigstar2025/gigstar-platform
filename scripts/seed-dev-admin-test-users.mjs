/**
 * DEV-ONLY helper: create two test users (one platform admin, one not) with
 * confirmed emails and known passwords so the admin editor can be exercised
 * through the browser. Uses the service-role Admin API against the DEV project.
 *
 * Never run against production. Prints only non-secret identifiers.
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing SUPABASE URL or service role key")
  process.exit(1)
}

const ref = new URL(url).host.split(".")[0]
if (ref !== "ecxundnkvwilsqokecdg") {
  console.error(`Refusing to run: expected DEV project, got ${ref}`)
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const users = [
  { email: "gigstar.admintest@gmail.com", password: process.env.SEED_ADMIN_PW, makeAdmin: true },
  { email: "gigstar.nonadmintest@gmail.com", password: process.env.SEED_NONADMIN_PW, makeAdmin: false },
]

async function findUserByEmail(email) {
  // listUsers is paginated; small DEV dataset so one page is enough.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) throw error
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

for (const u of users) {
  if (!u.password) {
    console.error(`Missing password env for ${u.email}`)
    process.exit(1)
  }
  let existing = await findUserByEmail(u.email)
  let userId
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: u.password,
      email_confirm: true,
    })
    if (error) throw error
    userId = data.user.id
    console.log(`updated existing user ${u.email} -> ${userId}`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })
    if (error) throw error
    userId = data.user.id
    console.log(`created user ${u.email} -> ${userId}`)
  }

  if (u.makeAdmin) {
    const { error } = await admin.from("platform_admins").upsert(
      { user_id: userId, created_by: userId },
      { onConflict: "user_id" },
    )
    if (error) throw error
    console.log(`granted platform_admin to ${u.email}`)
  } else {
    // Ensure this user is NOT an admin (clean state for the denial test).
    const { error } = await admin.from("platform_admins").delete().eq("user_id", userId)
    if (error) throw error
    console.log(`ensured ${u.email} is NOT a platform_admin`)
  }
}

console.log("done")
