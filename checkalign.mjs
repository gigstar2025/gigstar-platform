// Decisive project-alignment + runtime Storage check. Prints only non-secret refs and bucket existence.
function refFromUrl(u) {
  try {
    const h = new URL(u).host // <ref>.supabase.co
    return h.split('.')[0]
  } catch {
    return `(unparseable: ${String(u).slice(0, 12)}...)`
  }
}
function refFromPg(u) {
  try {
    // postgresql://user:pass@<host>:port/db  host often db.<ref>.supabase.co or aws-0-...pooler
    const h = new URL(u).host
    return h
  } catch {
    return '(unparseable)'
  }
}

const restUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const restRef = refFromUrl(restUrl)
const pgHost = refFromPg(process.env.POSTGRES_URL_NON_POOLING || '')
const declaredProdRef = process.env.SUPABASE_PROD_PROJECT_REF || '(unset)'

console.log('[align] NEXT_PUBLIC_SUPABASE_URL ref :', restRef)
console.log('[align] POSTGRES_URL_NON_POOLING host:', pgHost)
console.log('[align] SUPABASE_PROD_PROJECT_REF     :', declaredProdRef)

// Check buckets through the SAME runtime Storage API the app uses.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

async function listBuckets(label, key) {
  if (!key) {
    console.log(`[storage:${label}] no key available, skipped`)
    return
  }
  try {
    const res = await fetch(`${restUrl}/storage/v1/bucket`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    const status = res.status
    const body = await res.json().catch(() => null)
    if (Array.isArray(body)) {
      const ids = body.map((b) => b.id)
      console.log(`[storage:${label}] status=${status} buckets=${JSON.stringify(ids)} hasProfileMedia=${ids.includes('profile-media')}`)
    } else {
      console.log(`[storage:${label}] status=${status} body=${JSON.stringify(body)}`)
    }
  } catch (e) {
    console.log(`[storage:${label}] error=${e.message}`)
  }
}

await listBuckets('service', serviceKey)
await listBuckets('anon', anonKey)
