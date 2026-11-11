-- 고구마마켓: 판매글 거래 방법 (여러 개 선택)
--   direct   = 직거래 (만나서 주고받기)
--   doorstep = 문고리 (문 앞에 걸어 두고 비대면으로 주고받기)
--   delivery = 택배
-- 사진(images)처럼 text[] 배열에 담아요. 예) {"direct","delivery"}
-- (이미 DB에 적용되어 있어요. 새 프로젝트를 만들 때 SQL Editor 에서 실행하면 같은 구조가 생깁니다.)

alter table public.market_products
  add column trade_methods text[] not null default '{}'
  -- <@ 는 "왼쪽 배열의 값이 모두 오른쪽 배열 안에 있다"는 뜻이에요. 정해진 3가지 말고는 못 넣어요.
  constraint market_products_trade_methods_valid
    check (trade_methods <@ array['direct', 'doorstep', 'delivery']::text[]);

-- 글쓰기·수정할 때 이 칸도 넣을 수 있게 권한 추가
grant insert (trade_methods), update (trade_methods) on public.market_products to authenticated;

-- "최소 1개 선택"은 화면과 Server Action 에서 검사해요.
-- (이 칸이 생기기 전에 올라온 글들은 빈 배열이라, DB에서 강제하면 그 글들을 수정할 수 없게 돼요)
