import pg from 'pg'
const { Client } = pg
const url = new URL(process.env.POSTGRES_URL_NON_POOLING)
const c = new Client({
  host: url.hostname,
  port: url.port ? Number(url.port) : 5432,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: false },
})
await c.connect()
const pol = await c.query(
  "select policyname, cmd, roles::text from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'profile_media%' order by policyname"
)
const bucket = await c.query(
  "select id, public from storage.buckets where id='profile-media'"
)
const rls = await c.query(
  "select relrowsecurity as rls from pg_class where oid='storage.objects'::regclass"
)
console.log('POLICIES:', JSON.stringify(pol.rows))
console.log('BUCKET:', JSON.stringify(bucket.rows))
console.log('RLS:', JSON.stringify(rls.rows))
await c.end()
