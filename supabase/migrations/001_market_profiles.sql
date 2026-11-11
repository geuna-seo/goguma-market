-- 고구마마켓 STEP 1: 회원 프로필
-- 가계부(ledger_entries)와 같은 Supabase 프로젝트를 쓰기 때문에
-- 고구마마켓 테이블/함수에는 모두 market_ 접두어를 붙여 구분합니다.
-- (이미 DB에 적용되어 있어요. 새 프로젝트를 만들 때 SQL Editor 에서 실행하면 같은 구조가 생깁니다.)

create table public.market_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null unique check (char_length(nickname) between 2 and 12),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.market_profiles enable row level security;

-- 프로필(닉네임)은 누구나 볼 수 있음 (판매자 정보 표시용)
create policy "market profiles readable" on public.market_profiles
  for select to anon, authenticated
  using (true);

-- 본인 프로필만 수정
create policy "market profiles update own" on public.market_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.market_profiles from anon, authenticated;
grant select on public.market_profiles to anon, authenticated;
grant update (nickname, avatar_url, updated_at) on public.market_profiles to authenticated;

-- 회원가입 시 자동으로 프로필 생성 (고구마마켓에서 가입한 경우만: metadata.app = 'goguma')
create or replace function public.market_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'app' = 'goguma' then
    insert into public.market_profiles (id, nickname)
    values (new.id, new.raw_user_meta_data ->> 'nickname');
  end if;
  return new;
end;
$$;

revoke execute on function public.market_handle_new_user() from public, anon, authenticated;

create trigger market_on_auth_user_created
  after insert on auth.users
  for each row execute function public.market_handle_new_user();
