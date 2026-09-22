import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY
const PROD = "https://www.gigstar.co.uk"

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const email = `v0confirm.${Date.now()}@gmail.com`
const pw1 = `Init-${Date.now()}-a`
const pw2 = `Reset-${Date.now()}-b`

// 1. create a confirmed user
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password: pw1,
  email_confirm: true,
})
if (createErr) throw createErr
console.log("[v0] created user:", created.user.id, email)

// 2. generate a recovery link -> token_hash
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: "recovery",
  email,
})
if (linkErr) throw linkErr
const tokenHash = linkData.properties?.hashed_token
const otpType = "recovery"
console.log("[v0] recovery token_hash minted:", tokenHash?.slice(0, 12) + "...")

// 3. hit the live /auth/confirm route (follow no redirects, inspect Location + Set-Cookie)
const confirmUrl = `${PROD}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${otpType}&next=${encodeURIComponent("/auth/update-password")}`
const res = await fetch(confirmUrl, { redirect: "manual" })
console.log("[v0] /auth/confirm status:", res.status)
console.log("[v0] location:", res.headers.get("location"))
const setCookie = res.headers.get("set-cookie") || ""
const gotSessionCookie = /sb-[^=]*-auth-token/.test(setCookie)
console.log("[v0] session cookie set:", gotSessionCookie)

// 4. independently prove the recovery chain resolves to a working password change
const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
const { data: verifyData, error: verifyErr } = await anon.auth.verifyOtp({
  type: "recovery",
  token_hash: tokenHash,
})
if (verifyErr) {
  console.log("[v0] NOTE: token already consumed by the live route (expected if cookie set):", verifyErr.message)
} else {
  console.log("[v0] verifyOtp session established for user:", verifyData.user?.id)
}

// The live route consumes the token, so mint a second one to prove password update + sign-in
const { data: link2 } = await admin.auth.admin.generateLink({ type: "recovery", email })
const th2 = link2.properties?.hashed_token
const anon2 = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
const { data: v2, error: v2err } = await anon2.auth.verifyOtp({ type: "recovery", token_hash: th2 })
if (v2err) throw v2err
console.log("[v0] second recovery verified, updating password...")
const { error: updErr } = await anon2.auth.updateUser({ password: pw2 })
if (updErr) throw updErr
console.log("[v0] password updated")

// 5. sign in with the NEW password
const signInClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
const { data: si, error: siErr } = await signInClient.auth.signInWithPassword({ email, password: pw2 })
if (siErr) throw siErr
console.log("[v0] SIGN-IN WITH NEW PASSWORD OK:", si.user?.id === created.user.id)

// 6. confirm the OLD password no longer works
const oldClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
const { error: oldErr } = await oldClient.auth.signInWithPassword({ email, password: pw1 })
console.log("[v0] OLD password rejected:", !!oldErr, oldErr?.message)

// cleanup
await admin.auth.admin.deleteUser(created.user.id)
console.log("[v0] cleaned up test user")
