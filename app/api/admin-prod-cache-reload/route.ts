import { NextResponse } from "next/server"
import { Client } from "pg"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const GUARD = "mig_7f3a9c21b8e4d6"

// TEMPORARY, guarded operational route: reloads the production PostgREST schema
// cache over a DIRECT (non-pooling) connection, because NOTIFY is dropped by the
// transaction-mode pooler. Deleted immediately after use; never aliased or merged.
export async function GET(request: Request) {
  const url = new URL(request.url)
  if (url.searchParams.get("guard") !== GUARD) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const conn = process.env.POSTGRES_URL_NON_POOLING
  if (!conn) {
    return NextResponse.json({ error: "no POSTGRES_URL_NON_POOLING" }, { status: 500 })
  }

  // Parse discrete fields from the DIRECT (non-pooling) URL so:
  //  1. NOTIFY reaches PostgREST (the transaction pooler silently drops NOTIFY), and
  //  2. node-postgres does not inherit sslmode from the connection string (which
  //     would override the ssl object below and trip the self-signed-cert check).
  let parsed: URL
  try {
    parsed = new URL(conn)
  } catch {
    return NextResponse.json({ error: "POSTGRES_URL_NON_POOLING is not a valid URL" }, { status: 500 })
  }

  const client = new Client({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: { rejectUnauthorized: false },
  })

  const refFromHost = (host: string | undefined): string | null => {
    if (!host) return null
    // db.<ref>.supabase.co  OR  <ref>.supabase.co  OR pooler hosts aws-*-<region>.pooler.supabase.com (ref is in username)
    const m = host.match(/(?:^db\.)?([a-z0-9]{20})\.supabase\.(?:co|com)/)
    return m ? m[1] : null
  }

  try {
    await client.connect()
    const dbInfo = await client.query("select current_database() as db")

    // Does the column actually exist in THIS database's view right now?
    const colCheck = await client.query(
      `select count(*)::int as n
         from information_schema.columns
        where table_schema='public' and table_name='public_profiles' and column_name='avatar_url'`,
    )

    await client.query("notify pgrst, 'reload schema'")
    await client.query("notify pgrst, 'reload config'")

    // Compare project refs: the DB we migrated vs. the REST endpoint the app reads.
    const restUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const pgRef = refFromHost(parsed.hostname) || process.env.SUPABASE_PROD_PROJECT_REF || null
    let restRef: string | null = null
    try {
      restRef = refFromHost(restUrl ? new URL(restUrl).hostname : undefined)
    } catch {
      restRef = null
    }

    let restCheck: { status: number; body: string } | null = null
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    if (restUrl && anon) {
      // Give PostgREST a moment to pick up the reload, then probe the view.
      await new Promise((r) => setTimeout(r, 1500))
      const res = await fetch(
        `${restUrl}/rest/v1/public_profiles?select=avatar_url&limit=1`,
        { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
      )
      restCheck = { status: res.status, body: (await res.text()).slice(0, 300) }
    }

    return NextResponse.json({
      ok: true,
      db: dbInfo.rows[0]?.db,
      reloaded: true,
      avatarColumnExistsInPgDb: colCheck.rows[0]?.n === 1,
      pgProjectRef: pgRef,
      restProjectRef: restRef,
      projectRefsMatch: pgRef != null && restRef != null && pgRef === restRef,
      restCheck,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  } finally {
    await client.end().catch(() => {})
  }
}
