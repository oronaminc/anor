-- =====================================================================
-- Myeongdong Street Food — full schema for Neon Postgres
--
-- Run once against your Neon database:
--   psql "$DATABASE_URL" -f db/schema.sql
--
-- Notes vs the old Supabase setup:
--   * No RLS / no anon|authenticated roles / no GRANTs — all access is
--     server-side through one DATABASE_URL role, so the app layer is the
--     only authorization boundary (admin password + signed cookie).
--   * No storage bucket — thumbnails live in Cloudflare R2; the DB stores
--     only the public URL (foods.thumbnail_url).
--   * The view/like/search counters are encapsulated in SQL functions so
--     they stay atomic.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- search_events — collected search queries for the admin analytics page.
-- ---------------------------------------------------------------------
create table if not exists public.search_events (
  id             uuid primary key default gen_random_uuid(),
  query          text not null,
  normalized     text not null,
  locale         text,
  results_count  int,
  ip_hash        text,
  created_at     timestamptz not null default now()
);

create index if not exists search_events_created_idx    on public.search_events (created_at desc);
create index if not exists search_events_normalized_idx on public.search_events (normalized);

-- ---------------------------------------------------------------------
-- login_challenges — short-lived admin one-time-code (Telegram 2FA) store.
-- After a correct password we issue a 6-digit code, store only its hash here
-- (never the plaintext code), and require it before granting a session. The
-- row is single-use (deleted on success) and capped at a few attempts, so the
-- code can't be brute-forced even by someone who already knows the password.
-- ---------------------------------------------------------------------
create table if not exists public.login_challenges (
  id          uuid primary key default gen_random_uuid(),
  code_hash   text not null,
  redirect_to text,
  ip_hash     text,
  attempts    int  not null default 0,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists login_challenges_expires_idx on public.login_challenges (expires_at);

-- ---------------------------------------------------------------------
-- log_search(query, normalized, locale, results, ip_hash)
-- ---------------------------------------------------------------------
create or replace function public.log_search(
  p_query text,
  p_normalized text,
  p_locale text,
  p_results integer,
  p_ip_hash text
)
returns void
language plpgsql
as $$
begin
  if p_normalized is null or length(btrim(p_normalized)) = 0 then
    return;
  end if;
  insert into public.search_events (query, normalized, locale, results_count, ip_hash)
  values (left(p_query, 200), left(p_normalized, 200), p_locale, p_results, p_ip_hash);
end;
$$;

-- =====================================================================
-- SHOP / MENU model (가게 + 음식들) — supersedes the single `foods` table.
-- A shop (가게) is the unit of engagement (views/likes/trending/weekly) and
-- carries ONE map point + ONE youtube link. A shop has many menu foods
-- (shop_foods), each with its own photo + multilingual name. Added additively
-- alongside `foods`; the legacy table is dropped at cutover.
-- =====================================================================

create table if not exists public.shops (
  id                 uuid primary key default gen_random_uuid(),
  name_ko            text not null,                 -- shop name (가게 이름)
  name_en            text,
  name_ja            text,
  name_es            text,
  description        text,
  translations       jsonb not null default '{}'::jsonb,
  lat                double precision,
  lng                double precision,
  address            text,
  youtube_shorts_url text,                          -- one per shop
  thumbnail_url      text,                          -- optional shop image
  hashtags           text[] default '{}',
  price_range        text,
  view_count         int not null default 0,        -- all-time
  like_count         int not null default 0,        -- all-time
  weekly_view_count  int not null default 0,
  weekly_like_count  int not null default 0,
  week_start         date not null default (date_trunc('week', (now() at time zone 'Asia/Seoul')))::date,
  growth_weight      numeric not null default 1,    -- per-shop organic-growth multiplier
  is_trending        boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists shops_weekly_view_idx on public.shops (weekly_view_count desc);
create index if not exists shops_view_count_idx  on public.shops (view_count desc);
create index if not exists shops_trending_idx     on public.shops (is_trending);
create index if not exists shops_created_idx      on public.shops (created_at desc);

-- Admin/automated ("synthetic") engagement, kept separate from real
-- view_count/like_count so real human likes (shop_likes) stay pristine. The
-- displayed number is real + synthetic; both are stored, so it's stable.
alter table public.shops add column if not exists synthetic_view_count int not null default 0;
alter table public.shops add column if not exists synthetic_like_count int not null default 0;

-- District/area label + whether the shop accepts PayPay (Japan's top QR pay;
-- LINE Pay merged into it in 2025). Managed via the admin form / the CSV sync.
alter table public.shops add column if not exists district text;
-- Rename the legacy line_pay column to pay_pay once (guarded, idempotent).
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='shops' and column_name='line_pay')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='shops' and column_name='pay_pay')
  then alter table public.shops rename column line_pay to pay_pay; end if;
end $$;
alter table public.shops add column if not exists pay_pay boolean not null default false;
-- Officially certified street vendor (구청/서울시 정식 노점포 인증) → verified badge.
alter table public.shops add column if not exists certified boolean not null default false;
-- Broad food categories for map/feed filtering (a shop has 1+), kept small and
-- separate from the specific menu foods. Codes defined in lib/categories.ts.
alter table public.shops add column if not exists categories text[] not null default '{}';
-- Japanese hashtags; `hashtags` holds the Korean ones, shown per active locale.
alter table public.shops add column if not exists hashtags_ja text[] not null default '{}';
-- Short numeric id for shareable links: hellomyeongdong.com/s/42 (UUID still works).
create sequence if not exists public.shops_short_id_seq;
alter table public.shops add column if not exists short_id integer;
alter table public.shops alter column short_id set default nextval('public.shops_short_id_seq');
-- Backfill any rows that predate the column, in creation order.
update public.shops s set short_id = t.rn from (
  select id, coalesce((select max(short_id) from public.shops), 0)
           + row_number() over (order by created_at) as rn
    from public.shops where short_id is null
) t where s.id = t.id and s.short_id is null;
create unique index if not exists shops_short_id_key on public.shops (short_id);

-- Menu foods belonging to a shop (1 shop -> many foods).
create table if not exists public.shop_foods (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  name_ko      text not null,
  name_en      text,
  name_ja      text,
  name_es      text,
  description  text,
  translations jsonb not null default '{}'::jsonb,
  image_url    text,                                -- food photo (user-provided)
  price_range  text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists shop_foods_shop_idx on public.shop_foods (shop_id, sort_order);

-- One like per anonymized IP per shop (mirrors food_likes).
create table if not exists public.shop_likes (
  shop_id    uuid not null references public.shops(id) on delete cascade,
  ip_hash    text not null,
  created_at timestamptz not null default now(),
  primary key (shop_id, ip_hash)
);

create index if not exists shop_likes_shop_idx on public.shop_likes (shop_id);

-- Key/value app settings (e.g. organic growth speed 0..5), editable at runtime.
create table if not exists public.settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value) values ('growth_speed', '0')
  on conflict (key) do nothing;

-- Monday-00:00 KST week start; weekly counters reset when a row's week_start
-- is older than this.
create or replace function public.kst_week_start()
returns date language sql stable as $$
  select (date_trunc('week', (now() at time zone 'Asia/Seoul')))::date;
$$;

-- increment_shop_view: +1 all-time and this-week views, with a lazy weekly
-- reset when the stored week has rolled over.
create or replace function public.increment_shop_view(p_shop_id uuid)
returns table (view_count integer, weekly_view_count integer)
language plpgsql as $$
declare ws date := public.kst_week_start();
begin
  return query
  update public.shops s set
    view_count        = s.view_count + 1,
    weekly_view_count = (case when s.week_start < ws then 0 else s.weekly_view_count end) + 1,
    weekly_like_count = (case when s.week_start < ws then 0 else s.weekly_like_count end),
    week_start        = ws
  where s.id = p_shop_id
  returning s.view_count, s.weekly_view_count;
end; $$;

-- toggle_shop_like: idempotent per IP, keeps all-time + weekly counts in sync.
create or replace function public.toggle_shop_like(p_shop_id uuid, p_ip_hash text)
returns table (like_count integer, weekly_like_count integer, liked boolean)
language plpgsql as $$
declare
  ws      date := public.kst_week_start();
  v_rows  int;
  v_liked boolean;
  v_delta int;
begin
  if exists (select 1 from public.shop_likes where shop_id = p_shop_id and ip_hash = p_ip_hash) then
    delete from public.shop_likes where shop_id = p_shop_id and ip_hash = p_ip_hash;
    get diagnostics v_rows = row_count;
    v_liked := false;
  else
    insert into public.shop_likes (shop_id, ip_hash) values (p_shop_id, p_ip_hash) on conflict do nothing;
    get diagnostics v_rows = row_count;
    v_liked := true;
  end if;
  v_delta := case when v_rows = 0 then 0 when v_liked then 1 else -1 end;

  return query
  update public.shops s set
    like_count        = greatest(0, s.like_count + v_delta),
    weekly_like_count = greatest(0, (case when s.week_start < ws then 0 else s.weekly_like_count end) + v_delta),
    weekly_view_count = (case when s.week_start < ws then 0 else s.weekly_view_count end),
    week_start        = ws
  where s.id = p_shop_id
  returning s.like_count, s.weekly_like_count, v_liked;
end; $$;

-- District registry: each area has a fixed lat/lng. A shop only needs its
-- `district` set — the sync fills the shop's lat/lng from here.
create table if not exists public.districts (
  name text primary key,
  lat  double precision,
  lng  double precision
);

-- =====================================================================
-- RETAIL model (올리브영 화장품 + 다이소 굿즈) — a second content pillar
-- alongside street food. A `product` is the unit of engagement (views/likes/
-- trending/ranking) and belongs to a `retailer` ('olive_young' | 'daiso') with
-- a category. Products are ranked within their retailer. Where to buy them is
-- the retailer's Myeongdong stores (retail_stores → the map). Mirrors the shop
-- count architecture: displayed count = real + synthetic (both stored), and the
-- invariant total views > total likes holds.
-- =====================================================================

create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  retailer             text not null,                 -- 'olive_young' | 'daiso'
  name_ko              text not null,
  name_en              text,
  name_ja              text,
  brand                text,                          -- e.g. 라운드랩 / TORRIDEN (olive young)
  category             text,                          -- code within the retailer taxonomy (lib/retailers.ts)
  description          text,
  translations         jsonb not null default '{}'::jsonb,
  price_range          text,                          -- won string; JA UI shows ¥ at ₩÷10
  thumbnail_url        text,
  is_trending          boolean not null default false,
  view_count           int not null default 0,
  like_count           int not null default 0,
  synthetic_view_count int not null default 0,
  synthetic_like_count int not null default 0,
  created_at           timestamptz not null default now()
);

create index if not exists products_retailer_idx   on public.products (retailer);
create index if not exists products_view_count_idx  on public.products (view_count desc);
create index if not exists products_trending_idx    on public.products (is_trending);
create index if not exists products_created_idx      on public.products (created_at desc);

-- Short numeric id for shareable links: hellomyeongdong.com/p/42 (UUID still works).
create sequence if not exists public.products_short_id_seq;
alter table public.products add column if not exists short_id integer;
alter table public.products alter column short_id set default nextval('public.products_short_id_seq');
update public.products s set short_id = t.rn from (
  select id, coalesce((select max(short_id) from public.products), 0)
           + row_number() over (order by created_at) as rn
    from public.products where short_id is null
) t where s.id = t.id and s.short_id is null;
create unique index if not exists products_short_id_key on public.products (short_id);

-- One like per anonymized IP per product (mirrors shop_likes).
create table if not exists public.product_likes (
  product_id uuid not null references public.products(id) on delete cascade,
  ip_hash    text not null,
  created_at timestamptz not null default now(),
  primary key (product_id, ip_hash)
);
create index if not exists product_likes_product_idx on public.product_likes (product_id);

-- increment_product_view: +1 all-time views.
create or replace function public.increment_product_view(p_product_id uuid)
returns table (view_count integer)
language plpgsql as $$
begin
  return query
  update public.products s set view_count = s.view_count + 1
  where s.id = p_product_id
  returning s.view_count;
end; $$;

-- toggle_product_like: idempotent per IP; keeps the total-views > total-likes
-- invariant by lifting synthetic views if a new like would otherwise catch up.
create or replace function public.toggle_product_like(p_product_id uuid, p_ip_hash text)
returns table (like_count integer, liked boolean)
language plpgsql as $$
declare
  v_rows  int;
  v_liked boolean;
  v_delta int;
begin
  if exists (select 1 from public.product_likes where product_id = p_product_id and ip_hash = p_ip_hash) then
    delete from public.product_likes where product_id = p_product_id and ip_hash = p_ip_hash;
    get diagnostics v_rows = row_count;
    v_liked := false;
  else
    insert into public.product_likes (product_id, ip_hash) values (p_product_id, p_ip_hash) on conflict do nothing;
    get diagnostics v_rows = row_count;
    v_liked := true;
  end if;
  v_delta := case when v_rows = 0 then 0 when v_liked then 1 else -1 end;

  update public.products s set
    like_count           = greatest(0, s.like_count + v_delta),
    -- keep total views strictly above total likes after this like
    synthetic_view_count = s.synthetic_view_count + greatest(0,
      (s.like_count + s.synthetic_like_count + v_delta) - (s.view_count + s.synthetic_view_count) + 1)
  where s.id = p_product_id;

  return query
  select s.like_count, v_liked from public.products s where s.id = p_product_id;
end; $$;

-- Retailer stores in/near Myeongdong — the "where to buy" map points. A product
-- links to its retailer; the detail page shows that retailer's stores.
create table if not exists public.retail_stores (
  id         uuid primary key default gen_random_uuid(),
  retailer   text not null,                           -- 'olive_young' | 'daiso'
  name_ko    text not null,
  name_ja    text,
  lat        double precision,
  lng        double precision,
  address    text,
  created_at timestamptz not null default now()
);
create index if not exists retail_stores_retailer_idx on public.retail_stores (retailer);
