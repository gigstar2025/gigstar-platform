/**
 * DEV-ONLY verification helper.
 *
 * Signs in a DEV test user against the DEV Supabase project and lets
 * @supabase/ssr produce the exact auth cookies the server guard expects.
 * Prints ONLY the resulting Cookie header (name=value pairs) to stdout so it
 * can be piped into curl for deterministic server-side route verification.
 *
 * It never prints tokens in isolation, never touches production, and refuses
 * to run against anything other than the DEV project ref.
 *
 * Usage:
 *   node scripts/dev-mint-session-cookie.mjs <email> <password>
 */
import { createServerClient } from "@supabase/ssr"

const DEV_REF = "ecxundnkvwilsqokecdg"

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error("usage: node scripts/dev-mint-session-cookie.mjs <email> <password>")
  process.exit(2)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in env")
  process.exit(2)
}

const ref = new URL(url).hostname.split(".")[0]
if (ref !== DEV_REF) {
  console.error(`refusing: this helper only runs against DEV (${DEV_REF}), got ${ref}`)
  process.exit(3)
}

// Capture whatever cookies @supabase/ssr decides to set on successful sign-in.
const captured = new Map()
const supabase = createServerClient(url, anon, {
  cookies: {
    getAll() {
      return []
    },
    setAll(cookiesToSet) {
      for (const { name, value } of cookiesToSet) captured.set(name, value)
    },
  },
})

const { data, error } = await supabase.auth.signInWithPassword({ email, password })
if (error) {
  console.error("sign-in failed:", error.message)
  process.exit(1)
}
if (!data?.session) {
  console.error("sign-in returned no session")
  process.exit(1)
}

const header = [...captured.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; ")
if (!header) {
  console.error("no auth cookies were produced")
  process.exit(1)
}
// Only the cookie header is printed — no standalone token output.
process.stdout.write(header)
