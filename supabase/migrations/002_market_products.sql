-- 고구마마켓 STEP 2: 판매글(상품) — 사진 업로드는 아직 없음
-- (이미 DB에 적용되어 있어요. 새 프로젝트를 만들 때 SQL Editor 에서 실행하면 같은 구조가 생깁니다.)

create table public.market_products (
  id           uuid primary key default gen_random_uuid(),
  -- 판매자. 기본값이 auth.uid() 라서 글을 쓸 때 따로 넣지 않아도 "지금 로그인한 사람"이 들어가요.
  -- market_profiles 를 참조하므로 고구마마켓 회원(프로필이 있는 사람)만 글을 쓸 수 있어요.
  seller_id    uuid not null default auth.uid()
               references public.market_profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 2 and 40),
  description  text not null default '' check (char_length(description) <= 2000),
  category     text not null check (char_length(category) between 1 and 20),
  -- 0원 = 나눔
  price        integer not null check (price between 0 and 100000000),
  -- 판매중 / 예약중 / 거래완료
  status       text not null default 'selling' check (status in ('selling', 'reserved', 'sold')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 목록을 최신순으로 자주 읽고, 판매자별로도 찾을 거라 인덱스를 만들어요.
create index market_products_created_at_idx on public.market_products (created_at desc);
create index market_products_seller_id_idx on public.market_products (seller_id);

-- RLS(행 단위 보안): 켜는 순간 "정책으로 허락한 것만" 할 수 있게 돼요.
alter table public.market_products enable row level security;

-- 판매글은 누구나(로그인 안 해도) 볼 수 있음
create policy "market products readable" on public.market_products
  for select to anon, authenticated
  using (true);

-- 글쓰기: 로그인한 사람이 "자기 이름으로만" 쓸 수 있음
create policy "market products insert own" on public.market_products
  for insert to authenticated
  with check (seller_id = (select auth.uid()));

-- 수정·삭제: 내 글만
create policy "market products update own" on public.market_products
  for update to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

create policy "market products delete own" on public.market_products
  for delete to authenticated
  using (seller_id = (select auth.uid()));

-- 권한(grant)은 꼭 필요한 컬럼만 열어줘요. (seller_id, created_at 등은 직접 바꿀 수 없음)
revoke all on public.market_products from anon, authenticated;
grant select on public.market_products to anon, authenticated;
grant insert (title, description, category, price) on public.market_products to authenticated;
grant update (title, description, category, price, status) on public.market_products to authenticated;
grant delete on public.market_products to authenticated;

-- 수정할 때 updated_at 을 자동으로 지금 시각으로 바꿔주는 트리거
create or replace function public.market_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.market_set_updated_at() from public, anon, authenticated;

create trigger market_products_set_updated_at
  before update on public.market_products
  for each row execute function public.market_set_updated_at();
