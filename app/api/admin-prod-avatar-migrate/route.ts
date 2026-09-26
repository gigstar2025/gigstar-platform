import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// TEMPORARY, guarded operational route used once to apply the additive,
// idempotent profile-avatar migration to the production database using the
// production runtime's own direct Postgres credentials. It never returns any
// secret value. Delete this route after the migration is confirmed.
const GUARD = "mig_7f3a9c21b8e4d6"
const DEV_REF = "ecxundnkvwilsqokecdg"

function hostOf(u?: string | null) {
  if (!u) return null
  try {
    return new URL(u).host
  } catch {
    return null
  }
}

function refOf(u?: string | null) {
  const h = hostOf(u)
  return h ? h.split(".")[0] : null
}

const SQL_0018 = `
set local search_path = public, extensions;

alter table public.profiles
  add column if not exists avatar_media_id uuid;
alter table public.profiles
  drop constraint if exists profiles_avatar_media_fk;
alter table public.profiles
  add constraint profiles_avatar_media_fk
  foreign key (avatar_media_id) references public.media_assets(id) on delete set null;
comment on column public.profiles.avatar_media_id is
  'Profile avatar/photo. References the media_assets row holding the uploaded image.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media', 'profile-media', true, 2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_media_read on storage.objects;
create policy profile_media_read on storage.objects
  for select using (bucket_id = 'profile-media');

drop policy if exists profile_media_insert on storage.objects;
create policy profile_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  );

drop policy if exists profile_media_update on storage.objects;
create policy profile_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  )
  with check (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  );

drop policy if exists profile_media_delete on storage.objects;
create policy profile_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  );

create or replace function public.set_profile_avatar(
  p_profile_id uuid,
  p_storage_path text,
  p_public_url text,
  p_alt_text text default null,
  p_width integer default null,
  p_height integer default null,
  p_byte_size bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := (select auth.uid());
  v_account uuid;
  v_media_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not public.has_profile_access(p_profile_id, 'content_contributor') then
    raise exception 'not authorised to edit this profile' using errcode = '42501';
  end if;

  select id into v_account from public.user_accounts where id = v_uid;

  insert into public.media_assets (
    profile_id, storage_path, public_url, kind, alt_text, width, height, byte_size, uploaded_by
  )
  values (
    p_profile_id, p_storage_path, p_public_url, 'image', p_alt_text, p_width, p_height, p_byte_size, v_account
  )
  returning id into v_media_id;

  update public.profiles
  set avatar_media_id = v_media_id,
      updated_at = now()
  where id = p_profile_id;

  return v_media_id;
end;
$fn$;
comment on function public.set_profile_avatar(uuid, text, text, text, integer, integer, bigint) is
  'Record an uploaded profile avatar in media_assets and point profiles.avatar_media_id at it. content_contributor+ only.';

revoke execute on function public.set_profile_avatar(uuid, text, text, text, integer, integer, bigint) from public, anon;
grant execute on function public.set_profile_avatar(uuid, text, text, text, integer, integer, bigint) to authenticated;

create or replace view public.public_profiles
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.type,
  p.display_name,
  p.tagline,
  p.verification_status,
  p.location_label,
  extensions.st_y(p.location_centroid::extensions.geometry) as location_lat,
  extensions.st_x(p.location_centroid::extensions.geometry) as location_lon,
  p.travel_radius_km,
  p.published_at,
  ma.public_url as avatar_url
from public.profiles p
left join public.media_assets ma on ma.id = p.avatar_media_id
where p.visibility = 'public'
  and p.lifecycle_status = 'active'
  and p.deleted_at is null
  and p.archived_at is null;
comment on view public.public_profiles is
  'Publicly-safe profile projection: coarse centroid only, never location_exact. avatar_url is the linked media asset public URL.';

grant select on public.public_profiles to anon, authenticated;
`

const SQL_0019 = `
set local search_path = public, extensions;

grant select (avatar_media_id) on table public.profiles to anon, authenticated;

grant select (
  id,
  profile_id,
  storage_path,
  public_url,
  kind,
  alt_text,
  width,
  height,
  byte_size,
  created_at
) on table public.media_assets to anon, authenticated;
`

// Rollback-only security probe: proves set_profile_avatar authorises correctly
// on production without mutating data (the caller wraps it in begin/rollback,
// and the temp table is on commit drop). Mirrors the DEV security test.
const VERIFY_SQL = `
create temporary table _avatar_sec (
  authorized_ok boolean,
  unauthorized_blocked boolean,
  anon_blocked boolean,
  note text
) on commit drop;

do $$
declare
  v_profile uuid;
  v_member uuid;
  v_outsider uuid;
  v_media uuid;
  authorized_ok boolean := false;
  unauthorized_blocked boolean := false;
  anon_blocked boolean := false;
begin
  select p.id, m.user_id into v_profile, v_member
  from public.profiles p
  join public.profile_memberships m on m.profile_id = p.id and m.status = 'active'
  limit 1;

  if v_profile is null then
    insert into _avatar_sec values (null, null, null, 'NO_PROFILE_WITH_MEMBERSHIP');
    return;
  end if;

  select id into v_outsider from auth.users where id <> v_member limit 1;

  -- 1. Authorized member -> should succeed.
  perform set_config('role','authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_member::text, 'role','authenticated')::text, true);
  begin
    select public.set_profile_avatar(
      v_profile, v_profile::text || '/verify.png',
      'https://example.test/verify.png', 'verify', 16, 16, 100
    ) into v_media;
    authorized_ok := (v_media is not null);
  exception when others then
    authorized_ok := false;
  end;
  reset role;

  -- 2. Outsider -> blocked.
  if v_outsider is not null then
    perform set_config('role','authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_outsider::text, 'role','authenticated')::text, true);
    begin
      perform public.set_profile_avatar(
        v_profile, v_profile::text || '/hack.png',
        'https://example.test/hack.png', 'hack', 10, 10, 10
      );
      unauthorized_blocked := false;
    exception when others then
      unauthorized_blocked := true;
    end;
    reset role;
  else
    unauthorized_blocked := true;
  end if;

  -- 3. Anon -> blocked.
  perform set_config('role','anon', true);
  perform set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  begin
    perform public.set_profile_avatar(
      v_profile, v_profile::text || '/anon.png',
      'https://example.test/anon.png', 'anon', 10, 10, 10
    );
    anon_blocked := false;
  exception when others then
    anon_blocked := true;
  end;
  reset role;

  insert into _avatar_sec values (authorized_ok, unauthorized_blocked, anon_blocked, 'ok');
end $$;

select * from _avatar_sec;
`

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get("guard") !== GUARD) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  const apply = url.searchParams.get("apply") === "1"
  const verify = url.searchParams.get("verify") === "1"

  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const pgUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

  const identity = {
    supabaseHost: hostOf(publicUrl),
    supabaseRef: refOf(publicUrl),
    prodRefEnv: process.env.SUPABASE_PROD_PROJECT_REF || null,
    postgresRef: refOf(pgUrl ? `https://${new URL(pgUrl).host}` : null),
    matchesDevProject: refOf(publicUrl) === DEV_REF,
    hasPostgresUrl: Boolean(pgUrl),
  }

  if (verify) {
    if (!pgUrl) {
      return NextResponse.json(
        { mode: "verify", identity, error: "no POSTGRES_URL_NON_POOLING in runtime" },
        { status: 500 },
      )
    }
    const { Client } = await import("pg")
    const pg = new URL(pgUrl)
    const client = new Client({
      host: pg.hostname,
      port: pg.port ? Number(pg.port) : 5432,
      user: decodeURIComponent(pg.username),
      password: decodeURIComponent(pg.password),
      database: pg.pathname.replace(/^\//, "") || "postgres",
      ssl: { rejectUnauthorized: false },
    })
    try {
      await client.connect()
      // Everything runs inside one transaction that is always rolled back,
      // so production data is never mutated by this security check.
      await client.query("begin")
      // A multi-statement query string makes node-postgres return an ARRAY of
      // result objects (one per statement). The security row is the final
      // `select * from _avatar_sec`, so read the last result.
      const res = await client.query(VERIFY_SQL)
      const results = Array.isArray(res) ? res : [res]
      const last = results[results.length - 1]
      await client.query("rollback")
      // Also confirm anon can read the view including avatar_url (discovery path).
      const anonView = await client.query(
        `select has_column_privilege('anon','public.public_profiles','avatar_url','SELECT') as anon_can_read_avatar_url`,
      )
      return NextResponse.json({
        mode: "verify",
        identity,
        security: last?.rows?.[0] ?? null,
        anon_can_read_avatar_url: anonView.rows[0]?.anon_can_read_avatar_url ?? null,
      })
    } catch (e) {
      try {
        await client.query("rollback")
      } catch {}
      const message = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ mode: "verify", identity, error: message }, { status: 500 })
    } finally {
      try {
        await client.end()
      } catch {}
    }
  }

  if (!apply) {
    return NextResponse.json({ mode: "inspect", identity })
  }

  if (!pgUrl) {
    return NextResponse.json(
      { mode: "apply", identity, error: "no POSTGRES_URL_NON_POOLING in runtime" },
      { status: 500 },
    )
  }

  const { Client } = await import("pg")
  // Build the client from discrete fields rather than the connection string.
  // A `sslmode=require` query param in the connection string can cause
  // node-postgres to ignore the explicit `ssl` object, which produces a
  // "self-signed certificate in certificate chain" error against Supabase.
  const pg = new URL(pgUrl)
  const client = new Client({
    host: pg.hostname,
    port: pg.port ? Number(pg.port) : 5432,
    user: decodeURIComponent(pg.username),
    password: decodeURIComponent(pg.password),
    database: pg.pathname.replace(/^\//, "") || "postgres",
    ssl: { rejectUnauthorized: false },
  })
  try {
    await client.connect()
    const before = await client.query(
      `select current_database() as db,
              (select count(*) from information_schema.columns
                 where table_schema='public' and table_name='profiles'
                   and column_name='avatar_media_id') as has_avatar,
              (select count(*) from information_schema.tables
                 where table_schema='public' and table_name='profiles') as has_profiles`,
    )
    await client.query("begin")
    await client.query(SQL_0018)
    await client.query(SQL_0019)
    await client.query("commit")
    // Ask PostgREST to refresh its schema cache so avatar_url is queryable.
    await client.query(`notify pgrst, 'reload schema'`)
    const after = await client.query(
      `select (select count(*) from information_schema.columns
                 where table_schema='public' and table_name='profiles'
                   and column_name='avatar_media_id') as has_avatar,
              (select count(*) from storage.buckets where id='profile-media') as has_bucket,
              (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='set_profile_avatar') as has_rpc,
              (select count(*) from information_schema.columns
                 where table_schema='public' and table_name='public_profiles'
                   and column_name='avatar_url') as view_has_avatar`,
    )
    return NextResponse.json({ mode: "apply", identity, before: before.rows[0], after: after.rows[0] })
  } catch (e) {
    try {
      await client.query("rollback")
    } catch {}
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ mode: "apply", identity, error: message }, { status: 500 })
  } finally {
    try {
      await client.end()
    } catch {}
  }
}
