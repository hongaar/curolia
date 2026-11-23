-- App admins (designated manually via SQL: insert into public.app_admins (user_id) values ('<uuid>');)
-- and admin-managed changelog entries shown on the What's new page.

create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create policy "app_admins_select_own"
  on public.app_admins for select
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

create table public.changelog_entries (
  id uuid primary key default gen_random_uuid(),
  published_on date not null default current_date,
  description text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index changelog_entries_published_on_idx
  on public.changelog_entries (published_on desc, created_at desc);

alter table public.changelog_entries enable row level security;

create policy "changelog_entries_select"
  on public.changelog_entries for select
  to authenticated
  using (true);

create policy "changelog_entries_insert_admin"
  on public.changelog_entries for insert
  to authenticated
  with check ((select public.is_app_admin()));

create policy "changelog_entries_update_admin"
  on public.changelog_entries for update
  to authenticated
  using ((select public.is_app_admin()))
  with check ((select public.is_app_admin()));

create policy "changelog_entries_delete_admin"
  on public.changelog_entries for delete
  to authenticated
  using ((select public.is_app_admin()));

-- Public changelog images bucket; only admins may write.
insert into storage.buckets (id, name, public)
values ('changelog', 'changelog', true)
on conflict (id) do nothing;

create policy "changelog_images_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'changelog' and (select public.is_app_admin()));

create policy "changelog_images_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'changelog' and (select public.is_app_admin()))
  with check (bucket_id = 'changelog' and (select public.is_app_admin()));

create policy "changelog_images_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'changelog' and (select public.is_app_admin()));
