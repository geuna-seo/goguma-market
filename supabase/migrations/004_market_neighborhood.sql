-- 고구마마켓 STEP 3: 동네 인증
-- 휴대폰 위치(GPS) → 카카오 로컬 API 로 "행정동" 이름을 알아내서 프로필에 저장해요.
-- 정확한 좌표는 저장하지 않아요. (개인정보라서 동 이름만 남겨요)
-- (이미 DB에 적용되어 있어요. 새 프로젝트를 만들 때 SQL Editor 에서 실행하면 같은 구조가 생깁니다.)

-- 1) 프로필에 동네 칸
--    region: "서울특별시 강남구" / neighborhood: "역삼1동"
--    같은 이름의 동이 여러 구에 있을 수 있어서(예: 신사동) region 도 같이 저장해요.
alter table public.market_profiles
  add column region text check (char_length(region) between 1 and 40),
  add column neighborhood text check (char_length(neighborhood) between 1 and 20),
  add column neighborhood_verified_at timestamptz;

-- 동네는 본인이 바꿀 수 있지만(인증 화면을 통해서), 인증 시각은 직접 못 바꿔요.
grant update (region, neighborhood) on public.market_profiles to authenticated;

-- 동네가 바뀌면 인증 시각을 "지금"으로 자동 기록하는 트리거
create or replace function public.market_stamp_neighborhood_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.region, new.neighborhood) is distinct from (old.region, old.neighborhood) then
    new.neighborhood_verified_at = case when new.neighborhood is null then null else now() end;
  end if;
  return new;
end;
$$;

revoke execute on function public.market_stamp_neighborhood_verified() from public, anon, authenticated;

create trigger market_profiles_stamp_neighborhood
  before update on public.market_profiles
  for each row execute function public.market_stamp_neighborhood_verified();

-- 2) 판매글에도 동네 칸: 글을 쓴 "그때"의 판매자 동네를 복사해 둬요.
--    (나중에 이사해서 동네를 다시 인증해도, 예전 글은 원래 동네에 남아요)
alter table public.market_products
  add column region text,
  add column neighborhood text;

create index market_products_area_idx
  on public.market_products (region, neighborhood, created_at desc);

-- 글을 쓸 때 판매자 프로필의 동네를 자동으로 채워요. (사용자가 직접 넣을 수 없어요)
create or replace function public.market_fill_product_neighborhood()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select p.region, p.neighborhood
    into new.region, new.neighborhood
    from public.market_profiles p
   where p.id = new.seller_id;
  return new;
end;
$$;

revoke execute on function public.market_fill_product_neighborhood() from public, anon, authenticated;

create trigger market_products_fill_neighborhood
  before insert on public.market_products
  for each row execute function public.market_fill_product_neighborhood();

-- 3) 글쓰기 정책 강화: "내 이름으로" + "동네 인증을 한 사람만"
drop policy "market products insert own" on public.market_products;

create policy "market products insert own verified" on public.market_products
  for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and exists (
      select 1 from public.market_profiles p
       where p.id = (select auth.uid())
         and p.neighborhood is not null
    )
  );
