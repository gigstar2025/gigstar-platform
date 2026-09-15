-- GigStar Phase Five foundation — migration 0001
-- Extensions and enum types. Forward-only. Development project ecxundnkvwilsqokecdg.
set local search_path = public, extensions;

-- PostGIS for geographic profile location (installed in the extensions schema per Supabase convention).
create extension if not exists postgis with schema extensions;
-- pgcrypto is already installed (extensions schema) and is used for invitation token hashing.
create extension if not exists pgcrypto with schema extensions;

-- Enum domains. Enums are used for well-bounded, slow-changing sets so the database
-- itself rejects invalid values; free-growing sets (module category) stay as text.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type public.account_status as enum ('active', 'deactivated', 'suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'profile_type') then
    create type public.profile_type as enum ('dj', 'artist', 'venue', 'organiser');
  end if;
  if not exists (select 1 from pg_type where typname = 'profile_visibility') then
    create type public.profile_visibility as enum ('public', 'hidden', 'unlisted');
  end if;
  if not exists (select 1 from pg_type where typname = 'profile_lifecycle_status') then
    create type public.profile_lifecycle_status as enum ('draft', 'active', 'suspended', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'profile_verification_status') then
    create type public.profile_verification_status as enum ('unverified', 'pending', 'verified', 'rejected', 'revoked');
  end if;
  if not exists (select 1 from pg_type where typname = 'membership_role') then
    create type public.membership_role as enum ('owner', 'administrator', 'editor', 'event_manager', 'content_contributor', 'analyst');
  end if;
  if not exists (select 1 from pg_type where typname = 'membership_status') then
    create type public.membership_status as enum ('active', 'inactive', 'removed');
  end if;
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'expired', 'revoked');
  end if;
end
$$;
