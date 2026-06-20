-- =====================================================================
-- Myeongdong Street Food Guide — initial schema
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- foods
-- ---------------------------------------------------------------------
create table if not exists public.foods (
  id                 uuid primary key default gen_random_uuid(),
  name_ko            text not null,
  name_en            text,
  description        text,
  category           text,
  lat                double precision,
  lng                double precision,
  address            text,
  youtube_shorts_url text,
  thumbnail_url      text,
  hashtags           text[] default '{}',
  view_count         int not null default 0,
  is_trending        boolean not null default false,
  price_range        text,
  created_at         timestamptz not null default now()
);

create index if not exists foods_view_count_idx  on public.foods (view_count desc);
create index if not exists foods_created_at_idx   on public.foods (created_at desc);
create index if not exists foods_is_trending_idx  on public.foods (is_trending);
create index if not exists foods_category_idx     on public.foods (category);

-- ---------------------------------------------------------------------
-- Row Level Security
--   * anyone (anon) may SELECT
--   * only authenticated users may INSERT / UPDATE / DELETE
-- ---------------------------------------------------------------------
alter table public.foods enable row level security;

drop policy if exists "foods public read" on public.foods;
create policy "foods public read"
  on public.foods
  for select
  using (true);

drop policy if exists "foods authenticated insert" on public.foods;
create policy "foods authenticated insert"
  on public.foods
  for insert
  to authenticated
  with check (true);

drop policy if exists "foods authenticated update" on public.foods;
create policy "foods authenticated update"
  on public.foods
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "foods authenticated delete" on public.foods;
create policy "foods authenticated delete"
  on public.foods
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- increment_view_count(food_id)
--   SECURITY DEFINER so anonymous visitors can bump the counter
--   without holding UPDATE rights on the table.
-- ---------------------------------------------------------------------
create or replace function public.increment_view_count(food_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.foods
     set view_count = view_count + 1
   where id = food_id
  returning view_count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_view_count(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage bucket for thumbnail uploads
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('food-thumbnails', 'food-thumbnails', true)
on conflict (id) do nothing;

drop policy if exists "thumbnails public read" on storage.objects;
create policy "thumbnails public read"
  on storage.objects
  for select
  using (bucket_id = 'food-thumbnails');

drop policy if exists "thumbnails authenticated write" on storage.objects;
create policy "thumbnails authenticated write"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'food-thumbnails');

drop policy if exists "thumbnails authenticated update" on storage.objects;
create policy "thumbnails authenticated update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'food-thumbnails');

drop policy if exists "thumbnails authenticated delete" on storage.objects;
create policy "thumbnails authenticated delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'food-thumbnails');
