-- =====================================================================
-- GigStar Production release: Admin Issues section
-- Creates the admin issue tracker used at /admin/issues.
--
-- HOW TO RUN
--   Paste this entire file into the Supabase SQL Editor for the PRODUCTION
--   project (ref: dyshjxdznhswctluhzmc) and run it once. The whole thing is a
--   single transaction: if any statement fails, nothing is applied (safe to
--   retry).
--
-- PRECONDITIONS (already true on Production):
--   * auth.users exists (Supabase Auth)
--   * public.platform_admins + public.is_platform_admin() helper
--     (created by the admin-login release). Both tables' RLS is gated on
--     is_platform_admin(), so only platform admins can read or write issues.
--
-- IDEMPOTENT: tables use create table if not exists, policies use
--   drop policy if exists / create policy, indexes use if not exists, and
--   grants are explicit. Re-running makes no further changes.
--
-- SIGNED-OFF LOCKDOWN (the point of this migration's policy shape):
--   A signed-off issue is permanent history. The database — not just the
--   server actions — rejects any UPDATE to a signed-off issue and any new
--   comment on a signed-off issue. A direct PostgREST/API request as the
--   authenticated role cannot bypass this.
-- =====================================================================

begin;

set local search_path = public;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists public.admin_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('bug','improvement','task','other')),
  status text not null default 'open'
    check (status in ('open','in_progress','ready_for_signoff','signed_off')),
  created_by uuid not null references auth.users(id),
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  signed_off_by uuid references auth.users(id),
  signed_off_by_email text,
  signed_off_at timestamptz
);

create table if not exists public.admin_issue_comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.admin_issues(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  author_email text,
  body text not null,
  kind text not null default 'comment'
    check (kind in ('comment','fix','status_change','signoff')),
  created_at timestamptz not null default now()
);

create index if not exists admin_issue_comments_issue_id_idx
  on public.admin_issue_comments (issue_id, created_at);
create index if not exists admin_issues_created_at_idx
  on public.admin_issues (created_at desc);

-- ---------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------

alter table public.admin_issues enable row level security;
alter table public.admin_issue_comments enable row level security;

-- Issues: platform admins can read all and create their own.
drop policy if exists admin_issues_select on public.admin_issues;
create policy admin_issues_select on public.admin_issues
  for select using (public.is_platform_admin());

drop policy if exists admin_issues_insert on public.admin_issues;
create policy admin_issues_insert on public.admin_issues
  for insert with check (public.is_platform_admin() and auth.uid() = created_by);

-- UPDATE is rejected once an issue is signed off. USING evaluates the EXISTING
-- row, so a signed-off row matches no update target (the signoff transition
-- itself is the last permitted update, performed while status is still open).
drop policy if exists admin_issues_update on public.admin_issues;
create policy admin_issues_update on public.admin_issues
  for update
  using (public.is_platform_admin() and status <> 'signed_off')
  with check (public.is_platform_admin());

-- Comments: platform admins read all. New comments are rejected when the
-- parent issue is signed off, enforcing the history lockdown at the DB layer.
drop policy if exists admin_issue_comments_select on public.admin_issue_comments;
create policy admin_issue_comments_select on public.admin_issue_comments
  for select using (public.is_platform_admin());

drop policy if exists admin_issue_comments_insert on public.admin_issue_comments;
create policy admin_issue_comments_insert on public.admin_issue_comments
  for insert
  with check (
    public.is_platform_admin()
    and auth.uid() = author_id
    and exists (
      select 1 from public.admin_issues i
      where i.id = admin_issue_comments.issue_id
        and i.status <> 'signed_off'
    )
  );

-- ---------------------------------------------------------------------
-- 3. Grants
-- ---------------------------------------------------------------------
-- Explicit grants are mandatory: PostgreSQL checks table privileges BEFORE
-- RLS, so without these the authenticated role gets "permission denied" and
-- the admin guard reads it as a denial. (This was the admin-login root cause.)

grant select, insert, update on table public.admin_issues to authenticated;
grant select, insert on table public.admin_issue_comments to authenticated;

commit;

-- =====================================================================
-- VERIFICATION (run separately, read-only)
-- =====================================================================
-- Expect: four policies per table shape below, and the two lockdown policies
-- carrying the status <> 'signed_off' guard.
--
-- select tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('admin_issues','admin_issue_comments')
-- order by tablename, policyname;
--
-- select grantee, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name in ('admin_issues','admin_issue_comments')
--   and grantee = 'authenticated'
-- order by table_name, privilege_type;
