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

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    const dbInfo = await client.query("select current_database() as db")
    await client.query("notify pgrst, 'reload schema'")
    await client.query("notify pgrst, 'reload config'")

    let restCheck: { status: number; body: string } | null = null
    const restUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
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
