-- GigStar Phase Five foundation — migration 0005
-- Security-definer RPCs + module-definition catalog seed.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- create_profile_with_owner: atomically create a profile and grant the caller
-- the owner membership. Needed because the owner-only membership policy can
-- never insert the FIRST owner row. security definer with pinned search_path.
-- ---------------------------------------------------------------------------
create or replace function public.create_profile_with_owner(
  p_slug text,
  p_type public.profile_type,
  p_display_name text,
  p_tagline text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Ensure the caller has a user_accounts row (defensive; trigger normally makes it).
  if not exists (select 1 from public.user_accounts u where u.id = v_uid) then
    raise exception 'user account not initialised' using errcode = '42501';
  end if;

  insert into public.profiles (slug, type, display_name, tagline, created_by)
  values (lower(p_slug), p_type, p_display_name, p_tagline, v_uid)
  returning id into v_profile_id;

  insert into public.profile_memberships (profile_id, user_id, role, status)
  values (v_profile_id, v_uid, 'owner', 'active');

  return v_profile_id;
end;
$$;
comment on function public.create_profile_with_owner(text, public.profile_type, text, text) is
  'Atomically create a profile and grant the caller owner membership. Breaks the first-owner chicken-and-egg.';

-- ---------------------------------------------------------------------------
-- publish_profile: copy each module's draft_content -> published_content,
-- stamp published_at, mark the profile active/published, and snapshot a
-- revision. Requires editor+ on the profile.
-- ---------------------------------------------------------------------------
create or replace function public.publish_profile(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_revision_id uuid;
  v_snapshot jsonb;
begin
  if not public.has_profile_access(p_profile_id, 'editor') then
    raise exception 'editor access required' using errcode = '42501';
  end if;

  -- Promote drafts of visible (non-hidden) modules to published.
  update public.profile_modules
  set published_content = draft_content,
      published_at = now(),
      updated_at = now()
  where profile_id = p_profile_id
    and is_hidden = false;

  -- Hidden modules retain content but are not published to the public surface.
  update public.profile_modules
  set published_content = null,
      updated_at = now()
  where profile_id = p_profile_id
    and is_hidden = true;

  update public.profiles
  set lifecycle_status = case when lifecycle_status = 'draft' then 'active' else lifecycle_status end,
      published_at = coalesce(published_at, now()),
      updated_at = now()
  where id = p_profile_id;

  -- Build a snapshot of the published state for history/restore.
  select jsonb_build_object(
    'profile', to_jsonb(p) - 'location_exact',
    'modules', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'module_key', m.module_key,
        'position', m.position,
        'is_hidden', m.is_hidden,
        'published_content', m.published_content
      ) order by m.position)
      from public.profile_modules m
      where m.profile_id = p_profile_id), '[]'::jsonb)
  )
  into v_snapshot
  from public.profiles p
  where p.id = p_profile_id;

  insert into public.profile_revisions (profile_id, snapshot, created_by)
  values (p_profile_id, v_snapshot, v_uid)
  returning id into v_revision_id;

  return v_revision_id;
end;
$$;
comment on function public.publish_profile(uuid) is
  'Promote module drafts to published, activate the profile, and snapshot a revision. Requires editor+.';

-- ---------------------------------------------------------------------------
-- Seed the module-definition catalog from the app registry (lib/profiles/
-- editor/module-registry.ts). Idempotent: re-running updates the catalog.
-- ---------------------------------------------------------------------------
insert into public.profile_module_definitions
  (key, label, description, category, applies_to, is_required, is_singleton, feeds_discovery, default_position)
values
  ('about',          'About',              'Biography and introduction shown near the top of the profile.', 'Recommended',      array['dj','artist','venue','organiser']::public.profile_type[], true,  true, false, 10),
  ('facts',          'Quick facts',        'Scannable key/value highlights at a glance.',                   'Information',      array['dj','artist','venue','organiser']::public.profile_type[], false, true, false, 20),
  ('featured-event', 'Featured event',     'Spotlight one event, referenced by its shared event ID.',       'Events & Booking', array['dj','artist','organiser']::public.profile_type[],          false, true, true,  30),
  ('events',         'Events',             'Upcoming events, appearances or listings.',                     'Events & Booking', array['dj','artist','venue','organiser']::public.profile_type[], false, true, true,  40),
  ('past-events',    'Past events',        'A track record of previous events with highlights.',            'Events & Booking', array['artist','organiser']::public.profile_type[],               false, true, true,  50),
  ('releases',       'Releases',           'Music releases with artwork and streaming links.',              'Media',            array['artist']::public.profile_type[],                           false, true, true,  60),
  ('audio',          'Mixes & audio',      'Mixes and audio sets with artwork and duration.',               'Media',            array['dj','artist']::public.profile_type[],                      false, true, true,  70),
  ('videos',         'Videos',             'Video clips, live footage and short-form content.',             'Media',            array['dj','artist','venue','organiser']::public.profile_type[], false, true, true,  80),
  ('gallery',        'Gallery',            'Photo gallery with an accessible lightbox.',                    'Media',            array['dj','artist','venue','organiser']::public.profile_type[], false, true, true,  90),
  ('spaces',         'Spaces for hire',    'Bookable spaces, each with capacity and facilities.',           'Information',      array['venue']::public.profile_type[],                            false, true, false, 100),
  ('menu',           'Sample menu',        'Food & drink menu grouped into sections.',                      'Information',      array['venue']::public.profile_type[],                            false, true, false, 110),
  ('technical',      'Stage & production', 'Technical specification, backline and rider notes.',            'Information',      array['venue','artist']::public.profile_type[],                   false, true, false, 120),
  ('reviews',        'Reviews',            'Ratings and testimonials from past collaborators.',             'Information',      array['dj','artist','venue','organiser']::public.profile_type[], false, true, false, 130),
  ('partners',       'Partners',           'Sponsors and partner organisations.',                           'Information',      array['organiser']::public.profile_type[],                        false, true, false, 140),
  ('mailing-list',   'Mailing list',       'A prototype signup block (no addresses are stored).',           'Social & Contact', array['organiser']::public.profile_type[],                        false, true, false, 150),
  ('contact',        'Contact & enquiry',  'Booking/enquiry form and contact details.',                     'Social & Contact', array['dj','artist','venue','organiser']::public.profile_type[], true,  true, false, 160),
  ('related',        'Related profiles',   'Cross-links to connected GigStar profiles.',                    'Social & Contact', array['dj','artist','venue','organiser']::public.profile_type[], false, true, false, 170)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  category = excluded.category,
  applies_to = excluded.applies_to,
  is_required = excluded.is_required,
  is_singleton = excluded.is_singleton,
  feeds_discovery = excluded.feeds_discovery,
  default_position = excluded.default_position;
