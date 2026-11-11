-- 동네 인증을 잠시 쓰지 않기로 해서, 글쓰기 정책에서 "동네 인증한 사람만" 조건을 뺐어요.
-- 이제 다시 "로그인한 사람이 내 이름으로" 쓰기만 하면 돼요. (002 의 정책과 같아요)
-- 동네 칸·트리거(004)는 그대로 두었어요. 인증 안 한 사람이 쓴 글은 동네가 비어 있을 뿐이에요.
--
-- 다시 동네 인증을 켜려면: 004_market_neighborhood.sql 의 3) 정책을 다시 실행하고,
-- src/lib/features.ts 의 NEIGHBORHOOD_ENABLED 를 true 로 바꾸면 돼요.
-- (이미 DB에 적용되어 있어요.)

drop policy "market products insert own verified" on public.market_products;

create policy "market products insert own" on public.market_products
  for insert to authenticated
  with check (seller_id = (select auth.uid()));
