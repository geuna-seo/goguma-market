-- 고구마마켓 STEP 4: 1:1 채팅
-- 채팅방 = (물건 1개 + 구매 희망자 1명). 판매자와 구매자 두 사람만 볼 수 있어요.
-- (이미 DB에 적용되어 있어요. 새 프로젝트를 만들 때 SQL Editor 에서 실행하면 같은 구조가 생깁니다.)

-- 1) 채팅방
create table public.market_chat_rooms (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.market_products (id) on delete cascade,
  seller_id        uuid not null references public.market_profiles (id) on delete cascade,
  -- 구매자는 방을 만드는 사람 = 지금 로그인한 사람
  buyer_id         uuid not null default auth.uid() references public.market_profiles (id) on delete cascade,
  -- 채팅 목록에 보여줄 "마지막 메시지" (메시지가 올 때마다 트리거가 갱신해요)
  last_message     text,
  last_message_at  timestamptz,
  created_at       timestamptz not null default now(),
  -- 같은 물건에 같은 구매자는 방이 하나만 생기게
  constraint market_chat_rooms_one_per_buyer unique (product_id, buyer_id),
  -- 내 물건에 나 혼자 채팅할 수는 없어요
  constraint market_chat_rooms_not_self check (buyer_id <> seller_id)
);

create index market_chat_rooms_seller_idx on public.market_chat_rooms (seller_id, last_message_at desc);
create index market_chat_rooms_buyer_idx on public.market_chat_rooms (buyer_id, last_message_at desc);

-- 2) 메시지
create table public.market_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.market_chat_rooms (id) on delete cascade,
  sender_id   uuid not null default auth.uid() references public.market_profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index market_chat_messages_room_idx on public.market_chat_messages (room_id, created_at);

-- 3) RLS: 채팅방의 두 사람만
alter table public.market_chat_rooms enable row level security;
alter table public.market_chat_messages enable row level security;

create policy "market chat rooms participants read" on public.market_chat_rooms
  for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));

-- 방 만들기: 내가 구매자이고, seller_id 가 진짜 그 물건의 판매자여야 해요 (내 물건은 안 돼요)
create policy "market chat rooms buyer create" on public.market_chat_rooms
  for insert to authenticated
  with check (
    buyer_id = (select auth.uid())
    and exists (
      select 1 from public.market_products p
       where p.id = product_id
         and p.seller_id = market_chat_rooms.seller_id
         and p.seller_id <> (select auth.uid())
    )
  );

-- 방 참여자인지 확인하는 함수 (메시지 정책에서 여러 번 쓰려고 따로 만들었어요)
-- security invoker: 부르는 사람 권한으로 실행돼요. 채팅방 테이블의 RLS(참여자만 보기)가 그대로 적용되니
--   "내가 볼 수 있는 방이 있다" = "내가 참여자다" 가 돼요.
--   (처음엔 security definer 로 만들었다가 보안 점검 경고가 나서 invoker 로 바꿨어요)
create or replace function public.market_is_chat_participant(p_room_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.market_chat_rooms r
     where r.id = p_room_id
       and (select auth.uid()) in (r.buyer_id, r.seller_id)
  );
$$;

revoke execute on function public.market_is_chat_participant(uuid) from public, anon;
grant execute on function public.market_is_chat_participant(uuid) to authenticated;

create policy "market chat messages participants read" on public.market_chat_messages
  for select to authenticated
  using ((select public.market_is_chat_participant(room_id)));

create policy "market chat messages participants send" on public.market_chat_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.market_is_chat_participant(room_id))
  );

-- 권한: 꼭 필요한 컬럼만
revoke all on public.market_chat_rooms from anon, authenticated;
revoke all on public.market_chat_messages from anon, authenticated;
grant select on public.market_chat_rooms to authenticated;
grant insert (product_id, seller_id) on public.market_chat_rooms to authenticated;
grant select on public.market_chat_messages to authenticated;
grant insert (room_id, body) on public.market_chat_messages to authenticated;

-- 4) 메시지가 오면 채팅방의 "마지막 메시지"를 갱신하는 트리거
--    사용자에게는 채팅방 수정 권한이 없으니, 이 함수만 특별히(security definer) 수정할 수 있게 해요.
create or replace function public.market_touch_chat_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.market_chat_rooms
     set last_message = left(new.body, 100),
         last_message_at = new.created_at
   where id = new.room_id;
  return new;
end;
$$;

revoke execute on function public.market_touch_chat_room() from public, anon, authenticated;

create trigger market_chat_messages_touch_room
  after insert on public.market_chat_messages
  for each row execute function public.market_touch_chat_room();

-- 5) 실시간(Realtime): 새 메시지가 생기면 브라우저로 바로 알려주도록 등록해요.
--    Realtime 도 RLS 를 지켜서, 방 참여자에게만 메시지가 전달돼요.
alter publication supabase_realtime add table public.market_chat_messages;
