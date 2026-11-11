-- 고구마마켓 STEP 2: 판매글 사진 (여러 장)
-- 사진 파일은 Supabase Storage(파일 저장소)에, DB에는 "파일 경로"만 저장해요.
-- (이미 DB에 적용되어 있어요. 새 프로젝트를 만들 때 SQL Editor 에서 실행하면 같은 구조가 생깁니다.)

-- 1) 판매글에 사진 경로 목록 칸 추가
--    text[] 는 "글자들의 배열"이에요. 순서가 그대로 저장되고, 첫 번째 사진이 대표 사진이에요.
--    예) {"<회원id>/a1b2.webp", "<회원id>/c3d4.webp"}
alter table public.market_products
  add column images text[] not null default '{}'
  constraint market_products_images_max check (cardinality(images) <= 10);

-- 글쓰기·수정할 때 images 칸도 넣을 수 있게 권한 추가
grant insert (images), update (images) on public.market_products to authenticated;

-- 2) 사진을 담을 Storage 버킷(폴더 같은 것)
--    public = true: 주소만 알면 누구나 사진을 볼 수 있어요. (판매글 사진은 공개 정보라서 괜찮아요)
--    용량은 장당 5MB 까지, 이미지 형식만 허용해요.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'market-product-images',
  'market-product-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
);

-- 3) Storage 정책: 파일 경로의 첫 폴더가 "내 회원 id" 일 때만 올리고 지울 수 있어요.
--    storage.foldername('회원id/사진.webp') → {'회원id'}
create policy "market product images upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'market-product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 지우기(remove)는 내부적으로 "찾기(select) + 지우기(delete)" 권한이 둘 다 필요해요.
-- 보기는 공개 주소로 하니까, select 는 내 폴더만 열어줘요. (남이 파일 목록을 훑어보지 못하게)
create policy "market product images select own folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'market-product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "market product images delete own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'market-product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
