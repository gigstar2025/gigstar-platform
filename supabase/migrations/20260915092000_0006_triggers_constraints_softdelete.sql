-- GigStar Phase Five foundation — migration 0006
-- Triggers, integrity enforcement, soft-delete/archival columns.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Soft-delete / archival & audit columns (recoverability; never hard-delete casually).
-- ---------------------------------------------------------------------------
alter table public.user_accounts   add column if not exists deleted_at timestamptz;
alter table public.profiles         add column if not exists archived_at timestamptz;
alter table public.profiles         add column if not exists deleted_at  timestamptz;
alter table public.profile_modules  add column if not exists archived_at timestamptz;
alter table public.profile_modules  add column if not exists schema_version integer not null default 1;
alter table public.profile_modules  add column if not exists created_by uuid references public.user_accounts(id) on delete set null;
alter table public.profile_modules  add column if not exists updated_by uuid references public.user_accounts(id) on delete set null;

-- Display order cannot be negative.
alter table public.profile_modules drop constraint if exists profile_modules_position_nonneg;
alter table public.profile_modules add constraint profile_modules_position_nonneg check (position >= 0);

-- ---------------------------------------------------------------------------
-- Reusable updated_at trigger.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_accounts_updated_at on public.user_accounts;
create trigger trg_user_accounts_updated_at before update on public.user_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_memberships_updated_at on public.profile_memberships;
create trigger trg_memberships_updated_at before update on public.profile_memberships
  for each row execute function public.set_updated_at();

drop trigger if exists trg_modules_updated_at on public.profile_modules;
create trigger trg_modules_updated_at before update on public.profile_modules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Module rule enforcement: module must be allowed for the profile type, and
-- required modules cannot be hidden. Security definer so it can read the
-- catalog and profile regardless of the caller's row visibility.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_profile_module_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_type public.profile_type;
  v_applies_to public.profile_type[];
  v_is_required boolean;
begin
  select p.type into v_profile_type from public.profiles p where p.id = new.profile_id;
  select d.applies_to, d.is_required into v_applies_to, v_is_required
    from public.profile_module_definitions d where d.key = new.module_key;

  if v_applies_to is null then
    raise exception 'unknown module definition %', new.module_key using errcode = '23514';
  end if;

  -- Empty applies_to means "all profile types"; otherwise the type must be listed.
  if array_length(v_applies_to, 1) is not null and not (v_profile_type = any (v_applies_to)) then
    raise exception 'module % is not allowed for profile type %', new.module_key, v_profile_type
      using errcode = '23514';
  end if;

  if coalesce(v_is_required, false) and new.is_hidden then
    raise exception 'required module % cannot be hidden', new.module_key using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_module_rules on public.profile_modules;
create trigger trg_enforce_profile_module_rules
  before insert or update on public.profile_modules
  for each row execute function public.enforce_profile_module_rules();

-- ---------------------------------------------------------------------------
-- Protect the final owner: an active owner cannot be removed or demoted while
-- they are the last active owner of the profile.
-- ---------------------------------------------------------------------------
create or replace function public.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_other_owners integer;
begin
  if (tg_op = 'DELETE' and old.role = 'owner' and old.status = 'active')
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.status = 'active'
         and (new.role <> 'owner' or new.status <> 'active')) then
    select count(*) into v_other_owners
    from public.profile_memberships m
    where m.profile_id = old.profile_id
      and m.role = 'owner'
      and m.status = 'active'
      and m.id <> old.id;

    if v_other_owners = 0 then
      raise exception 'cannot remove or demote the final owner of a profile' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_last_owner on public.profile_memberships;
create trigger trg_protect_last_owner
  before update or delete on public.profile_memberships
  for each row execute function public.protect_last_owner();

-- ---------------------------------------------------------------------------
-- Provision a public.user_accounts row when a new auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_accounts (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
