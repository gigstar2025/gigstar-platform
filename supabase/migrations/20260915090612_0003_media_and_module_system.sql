-- GigStar Phase Five foundation — migration 0003
-- Media library + profile module system (definitions, per-profile modules, revisions).
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- media_assets: profile-scoped media library. Load-bearing shared entity,
-- so normalised (not JSONB). Modules reference assets by id.
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  public_url text,
  kind text not null default 'image',
  alt_text text,
  width integer,
  height integer,
  byte_size bigint,
  uploaded_by uuid references public.user_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint media_assets_kind_check check (kind in ('image', 'audio', 'video', 'document'))
);
comment on table public.media_assets is 'Profile-scoped media library. Modules reference assets by id.';
create index if not exists media_assets_profile_idx on public.media_assets (profile_id);

-- Deferred FK from migration 0002: user avatar points at a media asset.
alter table public.user_accounts
  drop constraint if exists user_accounts_avatar_media_fk;
alter table public.user_accounts
  add constraint user_accounts_avatar_media_fk
  foreign key (avatar_media_id) references public.media_assets(id) on delete set null;

-- ---------------------------------------------------------------------------
-- profile_module_definitions: catalog of module types available to profiles.
-- Seeded (migration 0005) from the app's module registry. `applies_to` lists
-- the profile types allowed to use the module; `is_required` cannot be hidden.
-- Presentational shape is validated against `content_schema` (JSON Schema).
-- ---------------------------------------------------------------------------
create table if not exists public.profile_module_definitions (
  key text primary key,
  label text not null,
  description text,
  category text not null default 'content',
  applies_to public.profile_type[] not null default array[]::public.profile_type[],
  is_required boolean not null default false,
  is_singleton boolean not null default true,
  feeds_discovery boolean not null default false,
  default_position integer not null default 100,
  content_schema jsonb,
  created_at timestamptz not null default now()
);
comment on table public.profile_module_definitions is 'Catalog of profile module types. Seeded from the app module registry.';
comment on column public.profile_module_definitions.applies_to is 'Profile types allowed to use this module. Empty array = all types.';

-- ---------------------------------------------------------------------------
-- profile_modules: an instance of a module on a specific profile.
-- draft_content is the working copy; published_content is what the public
-- page renders. Publishing copies draft -> published and snapshots a revision.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_modules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null references public.profile_module_definitions(key) on delete restrict,
  position integer not null default 100,
  is_hidden boolean not null default false,
  draft_content jsonb not null default '{}'::jsonb,
  published_content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (profile_id, module_key)
);
comment on table public.profile_modules is 'Per-profile module instance. draft_content = working copy; published_content = public render.';
create index if not exists profile_modules_profile_idx on public.profile_modules (profile_id);
create index if not exists profile_modules_order_idx on public.profile_modules (profile_id, position);

-- ---------------------------------------------------------------------------
-- profile_revisions: point-in-time snapshot written at each publish, so the
-- full published state can be restored without per-edit row duplication.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_revisions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references public.user_accounts(id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.profile_revisions is 'Published-state snapshots written at publish points for history/restore.';
create index if not exists profile_revisions_profile_idx on public.profile_revisions (profile_id, created_at desc);
