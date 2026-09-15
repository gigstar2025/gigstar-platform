-- GigStar Phase Five foundation — migration 0002
-- Core: user accounts, professional profiles, team memberships, invitations.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- user_accounts: 1:1 with auth.users. The ONLY entity that logs in.
-- Professional profiles are NEVER logins; access is via profile_memberships.
-- ---------------------------------------------------------------------------
create table if not exists public.user_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email extensions.citext,
  avatar_media_id uuid,
  status public.account_status not null default 'active',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.user_accounts is 'Personal login accounts, 1:1 with auth.users. Professional profiles are not logins.';

-- ---------------------------------------------------------------------------
-- profiles: a professional presence (dj/artist/venue/organiser).
-- Presentational module content is stored per-module (migration 0003);
-- this table holds identity, lifecycle, visibility, and location.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  slug extensions.citext not null unique,
  type public.profile_type not null,
  display_name text not null,
  tagline text,
  visibility public.profile_visibility not null default 'hidden',
  lifecycle_status public.profile_lifecycle_status not null default 'draft',
  verification_status public.profile_verification_status not null default 'unverified',

  -- Coarse, publicly-visible location (town/city centroid) — safe to expose.
  location_label text,
  location_centroid extensions.geography(Point, 4326),
  -- Sensitive precise location (exact venue address / home base) — never public.
  location_exact extensions.geography(Point, 4326),
  travel_radius_km integer check (travel_radius_km is null or travel_radius_km >= 0),

  created_by uuid references public.user_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,

  constraint profiles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
comment on table public.profiles is 'Professional presences. location_centroid is public-coarse; location_exact is sensitive/never public.';
comment on column public.profiles.location_exact is 'Sensitive precise coordinates. Never exposed to anon/public; coarse centroid is used for display.';

create index if not exists profiles_type_idx on public.profiles (type);
create index if not exists profiles_visibility_idx on public.profiles (visibility) where visibility = 'public';
create index if not exists profiles_centroid_gix on public.profiles using gist (location_centroid);
create index if not exists profiles_created_by_idx on public.profiles (created_by);

-- ---------------------------------------------------------------------------
-- profile_memberships: which user has which role on which profile.
-- This is the authorization backbone. (team_id-style join table.)
-- ---------------------------------------------------------------------------
create table if not exists public.profile_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.user_accounts(id) on delete cascade,
  role public.membership_role not null default 'editor',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, user_id)
);
comment on table public.profile_memberships is 'Grants a user a role on a profile. Authorization backbone for all profile-scoped writes.';

create index if not exists profile_memberships_user_idx on public.profile_memberships (user_id) where status = 'active';
create index if not exists profile_memberships_profile_idx on public.profile_memberships (profile_id) where status = 'active';

-- ---------------------------------------------------------------------------
-- profile_invitations: pending invites to join a profile team.
-- Token is stored hashed; the raw token is only ever returned to the inviter.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_invitations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email extensions.citext not null,
  role public.membership_role not null default 'editor',
  status public.invitation_status not null default 'pending',
  token_hash text not null,
  invited_by uuid references public.user_accounts(id) on delete set null,
  expires_at timestamptz not null,
  accepted_by uuid references public.user_accounts(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.profile_invitations is 'Pending team invitations. token_hash only; raw token returned once to inviter.';

create index if not exists profile_invitations_profile_idx on public.profile_invitations (profile_id);
create unique index if not exists profile_invitations_pending_email_idx
  on public.profile_invitations (profile_id, email)
  where status = 'pending';

-- avatar_media_id FK is wired in migration 0003 once media_assets exists.
