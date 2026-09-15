-- GigStar Phase Five foundation — migration 0001b
-- citext for case-insensitive slugs and emails (installed in the extensions schema).
create extension if not exists citext with schema extensions;
