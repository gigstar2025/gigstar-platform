import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

// TEMPORARY one-off route to apply the profile-avatar migration to the
// PRODUCTION Supabase project via the Management API. Reads the sensitive,
// runtime-only SUPABASE_ACCESS_TOKEN + SUPABASE_PROD_PROJECT_REF from
// process.env (not available in the sandbox shell). Delete after use.

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GUARD = "mig_7f3a9c21b8e4d6"

const MIGRATION_FILES = [
  "supabase/migrations/20260926120000_0018_profile_avatar_media.sql",
  "supabase/migrations/20260926123000_0019_profile_avatar_grants.sql",
]

const VERIFY_SQL = `select
  (select count(*) from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='avatar_media_id') as has_avatar_col,
  (select count(*) from storage.buckets where id='profile-media') as has_bucket,
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='set_profile_avatar') as has_rpc,
  (select count(*) from information_schema.columns where table_schema='public' and table_name='public_profiles' and column_name='avatar_url') as view_has_avatar,
  (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'profile_media%') as storage_policies;`

async function runQuery(ref: string, token: string, query: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  return { status: res.status, ok: res.ok, body: text.slice(0, 4000) }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (url.searchParams.get("guard") !== GUARD) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const ref = process.env.SUPABASE_PROD_PROJECT_REF
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const envPresence = { hasRef: Boolean(ref), hasToken: Boolean(token) }
  if (!ref || !token) {
    return NextResponse.json({ envPresence, error: "missing prod env vars at runtime" }, { status: 500 })
  }

  try {
    const applied: Array<{ file: string; status: number; ok: boolean; body: string }> = []
    for (const rel of MIGRATION_FILES) {
      const sql = await readFile(path.join(process.cwd(), rel), "utf8")
      const result = await runQuery(ref, token, sql)
      applied.push({ file: rel, ...result })
      if (!result.ok) {
        return NextResponse.json({ envPresence, applied }, { status: 500 })
      }
    }
    // Ask PostgREST to refresh its schema cache, then verify.
    await runQuery(ref, token, "notify pgrst, 'reload schema';")
    const verify = await runQuery(ref, token, VERIFY_SQL)
    return NextResponse.json({ envPresence, applied, verify }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { envPresence, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
