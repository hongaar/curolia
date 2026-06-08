-- Persist first-run onboarding completion on the user profile (cross-device).

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;
