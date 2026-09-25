/**
 * PRODUCTION admin setup (gated, controlled, one-off).
 *
 * What it does, in order:
 *   1. Applies the idempotent admin schema (platform_admins,
 *      admin_email_templates, is_platform_admin(), RLS policies) to the
 *      PRODUCTION Supabase project — identical to what was applied to DEV.
 *   2. Looks up your existing Gigstar account by email in production auth.users.
 *   3. Seeds that user id into platform_admins (idempotent).
 *   4. Reads back is_platform_admin(<id>) and table existence to confirm.
 *
 * Safety / secret handling:
 *   - Requires SUPABASE_ACCESS_TOKEN (Supabase Management API personal access
 *     token) in process.env. It is READ ONLY from the environment, never
 *     printed, logged, or written to disk.
 *   - The production project ref is NOT hardcoded. Pass it explicitly and it is
 *     validated against the DEV ref so this can never run against DEV by mistake.
 *   - Prints only booleans / counts / the resolved user id — no secrets, no row
 *     contents, no token.
 *   - Leaves all existing production accounts and profiles untouched; it only
 *     ADDs two tables and one admin row.
 *
 * Usage (token comes from the environment, never the command line):
 *   node --env-file-if-exists=/vercel/share/.env.project \
 *     scripts/setup-prod-admin.mjs --ref <PROD_REF> --email <YOUR_EMAIL>
 *
 * You may also set SUPABASE_PROD_PROJECT_REF and PROD_ADMIN_EMAIL instead of flags.
 */

const DEV_REF = "ecxundnkvwilsqokecdg" // never target this project

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined
}

const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = arg("ref") ?? process.env.SUPABASE_PROD_PROJECT_REF
const email = arg("email") ?? process.env.PROD_ADMIN_EMAIL

if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN in the environment. Set it as a server-side project env var and re-run. Do not pass it on the command line.",
  )
  process.exit(1)
}
if (!ref) {
  console.error("Missing production project ref. Pass --ref <PROD_REF> or set SUPABASE_PROD_PROJECT_REF.")
  process.exit(1)
}
if (!email) {
  console.error("Missing admin email. Pass --email <YOUR_EMAIL> or set PROD_ADMIN_EMAIL.")
  process.exit(1)
}
if (ref === DEV_REF) {
  console.error(`Refusing to run: ref ${ref} is the DEV project. This script is production-only.`)
  process.exit(1)
}

const API = `https://api.supabase.com/v1/projects/${ref}/database/query`

/**
 * Runs SQL against the target project via the Management API.
 * The token is sent only in the Authorization header, never logged.
 */
async function runSql(query) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    // Surface status + body text but NOT the request headers (which carry the token).
    const text = await res.text().catch(() => "")
    throw new Error(`Management API query failed (${res.status}): ${text}`)
  }
  return res.json()
}

const SCHEMA_DDL = `
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = uid
  );
$$;

drop policy if exists platform_admins_select on public.platform_admins;
create policy platform_admins_select on public.platform_admins
  for select using (public.is_platform_admin());

create table if not exists public.admin_email_templates (
  template_key text primary key,
  subject text not null,
  body_html text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  published_at timestamptz,
  published_subject text,
  published_body_html text
);

alter table public.admin_email_templates enable row level security;

drop policy if exists admin_email_templates_select on public.admin_email_templates;
create policy admin_email_templates_select on public.admin_email_templates
  for select using (public.is_platform_admin());

drop policy if exists admin_email_templates_insert on public.admin_email_templates;
create policy admin_email_templates_insert on public.admin_email_templates
  for insert with check (public.is_platform_admin());

drop policy if exists admin_email_templates_update on public.admin_email_templates;
create policy admin_email_templates_update on public.admin_email_templates
  for update using (public.is_platform_admin()) with check (public.is_platform_admin());

insert into public.admin_email_templates (template_key, subject, body_html)
values (
  'confirmation',
  'Confirm your email for GigStar',
  '<p>Welcome to GigStar!</p><p>Please confirm your email address to activate your account and start booking gigs.</p>'
)
on conflict (template_key) do nothing;

-- Table & function privileges for the authenticated role.
-- Supabase's default privileges are NOT reliably applied to objects created
-- through the Management API / SQL editor, so grant them explicitly. Without
-- these, an authenticated request hits "permission denied for table ..." BEFORE
-- RLS is even evaluated. RLS policies above still restrict rows to admins.
grant select on table public.platform_admins to authenticated;
grant select, insert, update on table public.admin_email_templates to authenticated;
grant execute on function public.is_platform_admin(uuid) to authenticated;
`

function esc(s) {
  return String(s).replace(/'/g, "''")
}

async function main() {
  console.log(`Target production ref: ${ref}`)

  console.log("1/4 Applying admin schema (idempotent)...")
  await runSql(SCHEMA_DDL)

  console.log("2/4 Looking up your account in production auth.users...")
  const lookup = await runSql(`select id from auth.users where lower(email) = lower('${esc(email)}') limit 1;`)
  const userId = Array.isArray(lookup) && lookup[0]?.id
  if (!userId) {
    console.error(`No production user found for the given email. No admin row created.`)
    process.exit(1)
  }
  console.log(`   Found user id: ${userId}`)

  console.log("3/4 Seeding platform_admins (idempotent)...")
  await runSql(
    `insert into public.platform_admins (user_id, created_by) values ('${userId}', '${userId}') on conflict (user_id) do nothing;`,
  )

  console.log("4/4 Verifying...")
  const verify = await runSql(`
    select
      (select count(*) from public.platform_admins) as admins,
      (select count(*) from public.admin_email_templates) as templates,
      public.is_platform_admin('${userId}') as you_are_admin;
  `)
  const row = Array.isArray(verify) ? verify[0] : undefined
  console.log(
    `   admins=${row?.admins} templates=${row?.templates} you_are_admin=${row?.you_are_admin}`,
  )

  if (row?.you_are_admin !== true) {
    console.error("Verification failed: your account is not showing as a platform admin.")
    process.exit(1)
  }
  console.log("done")
}

main().catch((err) => {
  // err.message may include Management API status/body, but never the token.
  console.error(String(err?.message ?? err))
  process.exit(1)
})
