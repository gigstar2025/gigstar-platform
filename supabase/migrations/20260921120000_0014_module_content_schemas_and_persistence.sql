-- GigStar Phase Five — migration 0014
-- Modular profile pages: converge the module vocabulary and give the five
-- optional content modules a persisted, validated home in profile_modules.
--
-- WHAT THIS MIGRATION CHANGES
--   1. Adds two module definitions to profile_module_definitions:
--        * radio  — live radio / on-air link          (dj, artist)
--        * gigs   — gig dates                          (dj, artist, organiser)
--      (audio, videos, gallery already exist from 0005.)
--   2. Backfills content_schema (JSON Schema 2020-12) for the five modular
--      modules so the app and future DB triggers share one content contract:
--        audio, videos, radio, gallery, gigs
--   3. Adds two SECURITY DEFINER RPCs so the editor can read and write
--      draft_content WITHOUT granting anon/authenticated direct table writes
--      or SELECT on draft_content (see 0010 least-privilege grants):
--        * get_profile_modules_for_editor(profile_id)   [content_contributor+]
--        * save_profile_module_draft(...)               [content_contributor+]
--
-- WHAT THIS MIGRATION DOES NOT DO
--   * No RLS changes. Row visibility is still governed by 0004.
--   * No new table-level GRANTs to anon/authenticated. Public reads of
--     PUBLISHED module content continue to work through the existing 0010
--     column grant + profile_modules_select policy.
--   * No Storage buckets / photo upload (that is PR-5c). gallery photo `src`
--     is validated as an optional URL string only.
--   * content_schema is stored for the app validator and future enforcement;
--     this migration does NOT add a DB trigger that rejects invalid content.
--
-- SAFETY
--   * Idempotent: definition rows are upserted; content_schema is set with a
--     keyed UPDATE; RPCs use create or replace.
--   * profile_type enum values referenced: dj, artist, venue, organiser.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- 1 + 2. Module definitions and content schemas.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 3. Editor read/write RPCs (SECURITY DEFINER).
-- draft_content is intentionally NOT selectable by anon/authenticated (0010),
-- and those roles have no INSERT/UPDATE. These definer functions perform the
-- membership check internally, mirroring publish_profile in 0005.
-- ---------------------------------------------------------------------------

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

-- EXECUTE grants for the runtime (authenticated) role. anon gets nothing:
-- editing always requires a session.
grant execute on function public.get_profile_modules_for_editor(uuid) to authenticated;
grant execute on function public.save_profile_module_draft(
  uuid, text, jsonb, integer, boolean
) to authenticated;
