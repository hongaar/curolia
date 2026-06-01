-- Inserts may omit `slug`; BEFORE INSERT triggers replace '' with a claimed slug.
-- Defaults align Postgres introspection with triggers so generated Insert types omit slug.

alter table public.maps alter column slug set default '';

alter table public.tags alter column slug set default '';

alter table public.pins alter column slug set default '';
