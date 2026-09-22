-- =====================================================================
-- GigStar Production release: modular profiles PR-5a / PR-5b
-- Applies the two migrations missing from Production (currently at 0013):
--     0014_module_content_schemas_and_persistence
--     0015_publish_profile_modules
--
-- HOW TO RUN
--   Paste this entire file into the Supabase SQL Editor for the PRODUCTION
--   project and run it once. The whole thing is a single transaction:
--   if any statement fails, nothing is applied (safe to retry).
--
-- PRECONDITIONS (already true on Production per inspection):
--   * profiles, profile_modules, profile_module_definitions, profile_revisions
--   * profile_type enum (dj, artist, venue, organiser)
--   * has_profile_access(uuid, text) helper
--
-- IDEMPOTENT: definition rows upsert, content_schema set by keyed UPDATE,
--   functions use create or replace, grants are explicit, and the migration
--   history inserts use on conflict do nothing.
--
-- The application feature flag MODULAR_PROFILES_FLOW stays OFF until this
-- has run successfully and the verification query confirms the schema.
-- =====================================================================

begin;

set local search_path = public, extensions;

-- =====================================================================
-- MIGRATION 0014 — module content schemas and persistence
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1 + 2. Module definitions and content schemas.
-- ---------------------------------------------------------------------

-- New definitions: radio and gigs. Upsert on the natural key (key).
insert into public.profile_module_definitions
  (key, label, description, category, applies_to, is_required, is_singleton,
   feeds_discovery, default_position, recommended_for, can_hide, is_active)
values
  ('radio',
   'Live radio / on-air',
   'Link out to a live radio stream or on-air show, with optional schedule.',
   'Media',
   array['dj','artist']::public.profile_type[],
   false, true, false, 85,
   array['dj']::public.profile_type[], true, true),
  ('gigs',
   'Gig dates',
   'Upcoming and past gig dates with venue, town and ticket links.',
   'Events & Booking',
   array['dj','artist','organiser']::public.profile_type[],
   false, true, false, 45,
   array['dj','artist']::public.profile_type[], true, true)
on conflict (key) do update set
  label            = excluded.label,
  description      = excluded.description,
  category         = excluded.category,
  applies_to       = excluded.applies_to,
  is_singleton     = excluded.is_singleton,
  feeds_discovery  = excluded.feeds_discovery,
  default_position = excluded.default_position,
  recommended_for  = excluded.recommended_for,
  can_hide         = excluded.can_hide,
  is_active        = excluded.is_active;

-- Backfill content_schema for the five modular modules. Each is a JSON Schema
-- (2020-12) describing the exact JSONB stored in draft_content/published_content.
update public.profile_module_definitions set content_schema = v.schema::jsonb
from (values
  ('audio', $json$
    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Mixes & audio module content",
      "type": "object",
      "additionalProperties": false,
      "required": ["items"],
      "properties": {
        "items": {
          "type": "array",
          "maxItems": 50,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "title", "embedUrl"],
            "properties": {
              "id": { "type": "string", "minLength": 1, "maxLength": 64 },
              "title": { "type": "string", "minLength": 1, "maxLength": 160 },
              "description": { "type": "string", "maxLength": 600 },
              "artwork": { "type": "string", "format": "uri", "maxLength": 2048 },
              "provider": { "type": "string", "enum": ["soundcloud", "mixcloud", "other"] },
              "embedUrl": { "type": "string", "format": "uri", "maxLength": 2048 }
            }
          }
        }
      }
    }
  $json$),
  ('videos', $json$
    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Videos module content",
      "type": "object",
      "additionalProperties": false,
      "required": ["items"],
      "properties": {
        "items": {
          "type": "array",
          "maxItems": 50,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "title", "embedUrl"],
            "properties": {
              "id": { "type": "string", "minLength": 1, "maxLength": 64 },
              "title": { "type": "string", "minLength": 1, "maxLength": 160 },
              "thumbnail": { "type": "string", "format": "uri", "maxLength": 2048 },
              "provider": { "type": "string", "enum": ["youtube", "vimeo", "other"] },
              "embedUrl": { "type": "string", "format": "uri", "maxLength": 2048 }
            }
          }
        }
      }
    }
  $json$),
  ('radio', $json$
    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Live radio / on-air module content",
      "type": "object",
      "additionalProperties": false,
      "required": ["radio"],
      "properties": {
        "radio": {
          "type": "object",
          "additionalProperties": false,
          "required": ["stationName", "streamUrl"],
          "properties": {
            "stationName": { "type": "string", "minLength": 1, "maxLength": 160 },
            "showTitle": { "type": "string", "maxLength": 160 },
            "streamUrl": { "type": "string", "format": "uri", "maxLength": 2048 },
            "schedule": { "type": "string", "maxLength": 240 },
            "onAir": { "type": "boolean" }
          }
        }
      }
    }
  $json$),
  ('gallery', $json$
    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Photo gallery module content",
      "type": "object",
      "additionalProperties": false,
      "required": ["photos"],
      "properties": {
        "photos": {
          "type": "array",
          "maxItems": 60,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "alt"],
            "properties": {
              "id": { "type": "string", "minLength": 1, "maxLength": 64 },
              "src": { "type": "string", "format": "uri", "maxLength": 2048 },
              "alt": { "type": "string", "minLength": 1, "maxLength": 300 },
              "caption": { "type": "string", "maxLength": 300 }
            }
          }
        }
      }
    }
  $json$),
  ('gigs', $json$
    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Gig dates module content",
      "type": "object",
      "additionalProperties": false,
      "required": ["gigs"],
      "properties": {
        "gigs": {
          "type": "array",
          "maxItems": 100,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "title", "date", "venueName", "town", "status"],
            "properties": {
              "id": { "type": "string", "minLength": 1, "maxLength": 64 },
              "title": { "type": "string", "minLength": 1, "maxLength": 200 },
              "date": { "type": "string", "format": "date" },
              "venueName": { "type": "string", "minLength": 1, "maxLength": 200 },
              "town": { "type": "string", "minLength": 1, "maxLength": 160 },
              "status": { "type": "string", "enum": ["on-sale", "free", "selling-fast", "last-tickets", "sold-out", "coming-soon"] },
              "ticketUrl": { "type": "string", "format": "uri", "maxLength": 2048 }
            }
          }
        }
      }
    }
  $json$)
) as v(key, schema)
where public.profile_module_definitions.key = v.key;

-- ---------------------------------------------------------------------
-- 3. Editor read/write RPCs (SECURITY DEFINER).
-- ---------------------------------------------------------------------

create or replace function public.get_profile_modules_for_editor(p_profile_id uuid)
returns table (
  module_key text,
  "position" integer,
  is_hidden boolean,
  draft_content jsonb,
  published_content jsonb,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_profile_access(p_profile_id, 'content_contributor') then
    raise exception 'not authorised to read modules for this profile'
      using errcode = '42501';
  end if;

  return query
    select m.module_key, m.position, m.is_hidden,
           m.draft_content, m.published_content, m.updated_at
    from public.profile_modules m
    where m.profile_id = p_profile_id
    order by m.position asc, m.module_key asc;
end;
$$;
comment on function public.get_profile_modules_for_editor(uuid) is
  'Editor read of all module rows (incl. draft_content) for a profile. content_contributor+.';

create or replace function public.save_profile_module_draft(
  p_profile_id uuid,
  p_module_key text,
  p_content jsonb,
  p_position integer default null,
  p_is_hidden boolean default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_module_id uuid;
  v_default_position integer;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not public.has_profile_access(p_profile_id, 'content_contributor') then
    raise exception 'not authorised to edit this profile' using errcode = '42501';
  end if;
  -- The module must be a known, active definition allowed for this profile type.
  if not exists (
    select 1
    from public.profile_module_definitions d
    join public.profiles p on p.id = p_profile_id
    where d.key = p_module_key
      and d.is_active
      and (array_length(d.applies_to, 1) is null or p.type = any (d.applies_to))
  ) then
    raise exception 'module % is not available for this profile', p_module_key
      using errcode = '22023';
  end if;

  select d.default_position into v_default_position
  from public.profile_module_definitions d
  where d.key = p_module_key;

  insert into public.profile_modules
    (profile_id, module_key, position, is_hidden, draft_content, created_by, updated_by)
  values
    (p_profile_id, p_module_key,
     coalesce(p_position, v_default_position, 100),
     coalesce(p_is_hidden, false),
     p_content, v_uid, v_uid)
  on conflict (profile_id, module_key) do update set
    draft_content = excluded.draft_content,
    position      = coalesce(p_position, public.profile_modules.position),
    is_hidden     = coalesce(p_is_hidden, public.profile_modules.is_hidden),
    updated_by    = v_uid,
    updated_at    = now()
  returning id into v_module_id;

  return v_module_id;
end;
$$;
comment on function public.save_profile_module_draft(uuid, text, jsonb, integer, boolean) is
  'Upsert a module draft_content for a profile. content_contributor+. Does not publish.';

-- EXECUTE grants for the runtime (authenticated) role. anon gets nothing.
revoke execute on function public.get_profile_modules_for_editor(uuid) from public, anon;
revoke execute on function public.save_profile_module_draft(
  uuid, text, jsonb, integer, boolean
) from public, anon;

grant execute on function public.get_profile_modules_for_editor(uuid) to authenticated;
grant execute on function public.save_profile_module_draft(
  uuid, text, jsonb, integer, boolean
) to authenticated;

-- =====================================================================
-- MIGRATION 0015 — publish_profile_modules
-- =====================================================================

create or replace function public.publish_profile_modules(p_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
  v_snapshot jsonb;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not public.has_profile_access(p_profile_id, 'owner') then
    raise exception 'not authorised to publish this profile' using errcode = '42501';
  end if;

  -- Promote draft_content -> published_content for every module row on the
  -- profile. Rows with a null draft become null published (i.e. unpublished).
  update public.profile_modules m
  set published_content = m.draft_content,
      published_at      = now(),
      updated_by        = v_uid,
      updated_at        = now()
  where m.profile_id = p_profile_id;

  get diagnostics v_count = row_count;

  -- Snapshot the resulting published module set for the revision history.
  select jsonb_build_object(
    'kind', 'modules',
    'published_at', now(),
    'modules', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'module_key', m.module_key,
          'position', m.position,
          'is_hidden', m.is_hidden,
          'published_content', m.published_content
        )
        order by m.position asc, m.module_key asc
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot
  from public.profile_modules m
  where m.profile_id = p_profile_id;

  insert into public.profile_revisions (profile_id, snapshot, created_by)
  values (p_profile_id, v_snapshot, v_uid);

  return v_count;
end;
$$;
comment on function public.publish_profile_modules(uuid) is
  'Promote all module draft_content to published_content for a profile and record a revision snapshot. Owner only.';

-- EXECUTE grants: publishing always requires an authenticated owner session.
revoke execute on function public.publish_profile_modules(uuid) from public, anon;
grant execute on function public.publish_profile_modules(uuid) to authenticated;

-- =====================================================================
-- Record both migrations in Supabase's migration history so future
-- tooling stays in sync. If your schema_migrations table has a NOT NULL
-- "statements" column, replace the two inserts below with the variant in
-- the block at the bottom of this file, then re-run.
-- =====================================================================
insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260921120000', '0014_module_content_schemas_and_persistence'),
  ('20260921130000', '0015_publish_profile_modules')
on conflict (version) do nothing;

commit;

-- =====================================================================
-- FALLBACK (only if the two history inserts above fail because
-- schema_migrations.statements is NOT NULL). Run this on its own AFTER a
-- successful commit of the migration body above:
--
--   insert into supabase_migrations.schema_migrations (version, name, statements)
--   values
--     ('20260921120000', '0014_module_content_schemas_and_persistence', array['-- applied via SQL editor']),
--     ('20260921130000', '0015_publish_profile_modules', array['-- applied via SQL editor'])
--   on conflict (version) do nothing;
-- =====================================================================
