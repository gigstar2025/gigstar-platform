-- GigStar Phase Five foundation — migration 0008
-- PostGIS distance-search demo function. Ranks public+active profiles by
-- proximity to a coarse centroid using ST_DWithin (GiST-accelerated) and
-- ST_Distance ordering, replacing the in-app Haversine scan. Reads only
-- public-safe rows.
set local search_path = public, extensions;

create or replace function public.search_profiles_near(
  p_lat double precision,
  p_lon double precision,
  p_radius_km double precision default 40,
  p_type public.profile_type default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  slug extensions.citext,
  type public.profile_type,
  display_name text,
  tagline text,
  location_label text,
  distance_km double precision
)
language sql
stable
set search_path = ''
as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326)::extensions.geography as g
  )
  select
    p.id,
    p.slug,
    p.type,
    p.display_name,
    p.tagline,
    p.location_label,
    extensions.st_distance(p.location_centroid, o.g) / 1000.0 as distance_km
  from public.profiles p, origin o
  where p.visibility = 'public'
    and p.lifecycle_status = 'active'
    and p.deleted_at is null
    and p.archived_at is null
    and p.location_centroid is not null
    and (p_type is null or p.type = p_type)
    and extensions.st_dwithin(p.location_centroid, o.g, greatest(p_radius_km, 0) * 1000.0)
  order by extensions.st_distance(p.location_centroid, o.g)
  limit greatest(p_limit, 1);
$$;
comment on function public.search_profiles_near(double precision, double precision, double precision, public.profile_type, integer) is
  'Distance-ranked search of public profiles within a radius (km) of a coarse centroid. PostGIS ST_DWithin + ST_Distance.';

grant execute on function public.search_profiles_near(double precision, double precision, double precision, public.profile_type, integer) to anon, authenticated;
