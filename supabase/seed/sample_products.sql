-- 샘플 판매글 5개 (화면 확인용)
-- 테스트 계정(닉네임 '테스트고구마')이 판 것으로 넣어요.
-- SQL Editor 는 로그인한 사용자가 아니라서 auth.uid() 가 비어 있어요 → seller_id 를 직접 넣어요.
-- created_at 을 조금씩 다르게 해서 "3시간 전", "2일 전" 처럼 보이게 했어요.

insert into public.market_products (seller_id, title, description, category, price, status, created_at, updated_at)
select p.id, s.title, s.description, s.category, s.price, s.status, now() - s.ago, now() - s.ago
from public.market_profiles p
cross join (values
  ('아이패드 미니 6 64GB 스페이스그레이',
   E'작년 봄에 사서 거의 집에서만 썼어요.\n기스 없고 배터리 성능 92%입니다.\n충전기·케이스 같이 드려요. 역 근처 직거래 원해요.',
   '디지털기기', 380000, 'selling', interval '25 minutes'),
  ('캠핑 의자 2개 일괄',
   E'한 시즌 쓰고 보관만 했어요.\n접이식이라 가볍고 수납 가방 포함입니다.',
   '스포츠/레저', 20000, 'reserved', interval '3 hours'),
  ('몬스테라 화분 나눔해요',
   E'잎이 너무 많아져서 포기 나눔합니다 🌿\n화분째 가져가실 분, 직접 오셔야 해요.',
   '생활/주방', 0, 'selling', interval '9 hours'),
  ('원목 2인 식탁 (의자 포함)',
   E'이사 가면서 정리해요.\n가로 120cm, 생활 기스 조금 있어요.\n1층이라 옮기기 쉬워요. 차 가져오실 분만요!',
   '가구/인테리어', 45000, 'selling', interval '1 day 4 hours'),
  ('불편한 편의점 1·2권 세트',
   E'한 번 읽고 책장에 꽂아만 뒀어요.\n밑줄·낙서 없어요.',
   '도서', 12000, 'sold', interval '3 days')
) as s(title, description, category, price, status, ago)
where p.nickname = '테스트고구마';
