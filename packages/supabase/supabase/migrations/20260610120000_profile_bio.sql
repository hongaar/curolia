-- Optional short bio shown on public map blog views.

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  drop constraint if exists profiles_bio_length_chk;

alter table public.profiles
  add constraint profiles_bio_length_chk
  check (bio is null or char_length(bio) <= 500);
