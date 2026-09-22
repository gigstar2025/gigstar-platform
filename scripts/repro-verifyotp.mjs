import { createServerClient } from "@supabase/ssr"
import { createClient as createAdmin } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const admin = createAdmin(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Compare the two "anon" values the app has access to.
console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:", (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 8))
console.log("[v0] SUPABASE_ANON_KEY prefix:            ", (process.env.SUPABASE_ANON_KEY || "").slice(0, 8))
console.log("[v0] keys identical:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === process.env.SUPABASE_ANON_KEY)

function mockCookieStore() {
  const jar = new Map()
  return {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
  }
}

async function tryKey(label, key) {
  const email = `v0repro.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@gmail.com`
  const { data: c, error: ce } = await admin.auth.admin.createUser({ email, password: `Init-${Date.now()}`, email_confirm: true })
  if (ce) { console.log(`[v0] ${label}: createUser err`, ce.message); return }
  const { data: l, error: le } = await admin.auth.admin.generateLink({ type: "recovery", email })
  if (le) { console.log(`[v0] ${label}: generateLink err`, le.message); await admin.auth.admin.deleteUser(c.user.id); return }
  const tokenHash = l.properties?.hashed_token

  const store = mockCookieStore()
  const supabase = createServerClient(url, key, {
    cookies: { getAll: store.getAll, setAll: store.setAll },
  })
  const { data, error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash })
  if (error) {
    console.log(`[v0] ${label}: verifyOtp ERROR ->`, error.status, error.code, error.message)
  } else {
    console.log(`[v0] ${label}: verifyOtp OK -> user`, data.user?.id, "cookies set:", store.getAll().length)
  }
  await admin.auth.admin.deleteUser(c.user.id)
}

await tryKey("ssr + NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
await tryKey("ssr + SUPABASE_ANON_KEY", process.env.SUPABASE_ANON_KEY)
await tryKey("ssr + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
