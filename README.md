# 🍠 고구마마켓

우리 동네 따끈한 중고거래 — Next.js + Supabase 로 단계별로 만들어 가는 공부용 프로젝트입니다.

## 실행하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 열어주세요.
처음 받는 경우 `.env.example` 을 복사해 `.env.local` 을 만들고 Supabase 값과 카카오 REST API 키를 채워야 해요.

## 진행 단계

- [x] **STEP 1. 회원가입 · 로그인 · 로그아웃**
- [x] **STEP 2. 상품 등록 / 목록 / 상세**
  - [x] 판매글 쓰기 · 목록 · 상세 · 수정 · 삭제 (CRUD)
  - [x] 사진 업로드 (여러 장, 최대 10장)
  - [x] 상세 화면 아래 비슷한 물건 추천 · 가격 비교
- [x] **STEP 3. 동네 인증**
  - [x] 현재 위치(GPS) → 카카오 로컬 API 로 행정동 확인
  - [x] 동네 인증한 사람만 글쓰기, 글에 동네 표시
  - [x] 목록에서 "우리 동네" 물건만 보기
- [x] **STEP 4. 1:1 채팅**
  - [x] 상세 화면에서 판매자에게 채팅하기 (물건·구매자마다 방 1개)
  - [x] 채팅 목록 · 실시간 메시지 (Supabase Realtime)
- [ ] STEP 5. 관심 목록(찜)

## 폴더 구조 (STEP 1 ~ 4)

```
src/
├─ proxy.ts                     # 매 요청마다 로그인 세션 갱신 (Next 16: middleware → proxy)
├─ lib/
│  ├─ auth.ts                   # getCurrentUser(): 현재 로그인 사용자 + 닉네임
│  ├─ products.ts               # 판매글 타입·카테고리·가격 표시 (서버/브라우저 공용)
│  ├─ product-data.ts           # 판매글 읽기: getProducts(), getProduct(id), getSimilarProducts() (서버 전용)
│  ├─ upload-image.ts           # 브라우저에서 사진 줄이기(WebP) + Storage 에 올리기
│  ├─ kakao.ts                  # 카카오 로컬 API: 위도·경도 → 행정동 (서버 전용)
│  ├─ chat-data.ts              # 채팅 읽기: 내 채팅 목록, 채팅방, 메시지 (서버 전용)
│  └─ supabase/
│     ├─ client.ts              # 브라우저용 Supabase 클라이언트
│     ├─ server.ts              # 서버용 Supabase 클라이언트 (쿠키로 세션 읽기)
│     └─ proxy.ts               # proxy.ts 에서 쓰는 세션 갱신 로직
├─ components/
│  ├─ Header.tsx                # 로고 + 동네·채팅·글쓰기·로그인 메뉴
│  ├─ Logo.tsx
│  └─ form.tsx                  # 입력칸, 선택칸, 긴 글 칸, 버튼, 에러 박스
└─ app/
   ├─ page.tsx                  # 홈
   ├─ (auth)/                   # 괄호 폴더는 URL 에 안 나타나요 → /login, /signup
   │  ├─ layout.tsx             # 로그인/회원가입 공통 화면
   │  ├─ actions.ts             # Server Actions: login, signup, logout
   │  ├─ login/
   │  └─ signup/
   ├─ auth/callback/route.ts    # 이메일 인증 링크를 눌렀을 때 돌아오는 곳
   ├─ neighborhood/             # 동네 인증 /neighborhood
   │  ├─ page.tsx
   │  ├─ actions.ts             # Server Action: verifyNeighborhood (좌표 → 동네 저장)
   │  └─ NeighborhoodVerifier.tsx # 위치 권한 묻고 인증 버튼
   ├─ chat/
   │  ├─ page.tsx               # 내 채팅 목록 /chat
   │  ├─ actions.ts             # Server Actions: startChat, sendMessage
   │  └─ [roomId]/
   │     ├─ page.tsx            # 채팅방 /chat/방id (참여자만)
   │     └─ ChatRoom.tsx        # 메시지 목록 + 입력칸 + 실시간 구독
   └─ products/
      ├─ layout.tsx             # 헤더 + 내용 틀
      ├─ page.tsx               # 목록 /products
      ├─ actions.ts             # Server Actions: createProduct, updateProduct, deleteProduct
      ├─ ProductForm.tsx        # 쓰기·수정 공용 폼
      ├─ ImagePicker.tsx        # 폼의 사진 칸 (여러 장 고르기·빼기·대표 사진)
      ├─ ProductCard.tsx        # 목록 카드 + 판매 상태 뱃지
      ├─ new/page.tsx           # 글쓰기 /products/new (로그인 필요)
      └─ [id]/
         ├─ page.tsx            # 상세 /products/글id (내 글이면 수정·삭제 버튼)
         ├─ DeleteButton.tsx    # 확인창 띄우고 삭제
         ├─ ImageGallery.tsx    # 큰 사진 + 썸네일 넘겨보기
         ├─ SimilarProducts.tsx # 비슷한 물건 추천 + 가격 비교
         ├─ not-found.tsx       # 없는 글일 때
         └─ edit/page.tsx       # 수정 /products/글id/edit (내 글만)
supabase/migrations/            # DB 구조(SQL) 기록
```

## 동작 흐름

1. **회원가입**: 폼 → `signup` 서버 액션 → `supabase.auth.signUp()`
   → DB 트리거가 `market_profiles` 에 닉네임 행을 자동으로 만들어요.
2. **로그인**: `signInWithPassword()` 가 성공하면 세션이 **쿠키**에 저장돼요.
3. **로그인 유지**: `proxy.ts` 가 매 요청마다 토큰을 검사·갱신해요.
4. **로그아웃**: `signOut()` 으로 쿠키를 지워요.
5. **판매글 CRUD** (STEP 2)
   - 쓰기: 폼 → `createProduct` → `insert`. 판매자(`seller_id`)는 DB 기본값 `auth.uid()` 가 채워요.
   - 읽기: `market_products` 를 읽을 때 `seller:market_profiles(nickname)` 로 판매자 닉네임도 함께 가져와요.
   - 수정·삭제: `updateProduct` / `deleteProduct`. 화면에서 내 글에만 버튼을 보여주고,
     DB의 RLS 정책이 "내 글만" 바꿀 수 있게 한 번 더 막아요.
   - 가격 0원은 "나눔", 판매 상태는 판매중 · 예약중 · 거래완료 (수정 화면에서 바꿔요).
6. **사진 올리기** (STEP 2)
   - 사진을 고르면 브라우저가 긴 쪽 1600px · WebP 로 줄여서 **Storage 에 바로** 올려요.
     (Server Action 은 한 번에 보낼 수 있는 크기가 작아서, 큰 사진 여러 장은 서버를 거치지 않아요)
   - 저장 경로는 `회원id/랜덤이름.webp`. Storage 정책이 "내 폴더"에만 올리고 지울 수 있게 막아요.
   - 판매글에는 사진 **경로 목록**(`images`)만 저장하고, 첫 번째가 대표 사진이에요.
   - 글을 수정하며 뺀 사진, 삭제한 글의 사진은 서버가 Storage 에서도 지워요.
7. **비슷한 물건 추천** (상세 화면 아래)
   - 판매중인 글 중에서 **같은 카테고리**를 먼저, 그다음 **가격대가 비슷한(1/3배~3배)** 글을 최대 4개 보여줘요.
   - 카드마다 지금 보는 글과 비교해서 "3,000원 더 저렴해요"처럼 가격 차이를 알려줘요.
8. **동네 인증** (STEP 3)
   - 브라우저 위치(GPS) → `verifyNeighborhood` 서버 액션 → 카카오 로컬 API 로 **행정동**("역삼1동")을 찾아 프로필에 저장해요.
   - 정확한 좌표는 저장하지 않아요. 정확도가 5km 보다 나쁘거나 대한민국 밖이면 인증하지 않아요.
   - 인증 시각은 DB 트리거가 기록하고, 글을 쓰면 그때의 판매자 동네가 글에 자동으로 복사돼요.
   - 동네 인증을 안 하면 글쓰기 화면 대신 안내가 나오고, DB의 RLS 정책도 글쓰기를 막아요.
   - 목록의 "📍 우리 동네" 탭(`?area=mine`)은 같은 구·동의 글만 보여줘요.
9. **1:1 채팅** (STEP 4)
   - 상세 화면 "채팅하기" → `startChat` 이 (물건 + 구매자) 방을 찾거나 만들고 → `/chat/방id` 로 이동해요.
   - 메시지는 `sendMessage` 로 저장하고, 상대방 화면에는 **Supabase Realtime** 으로 바로 나타나요.
   - RLS 로 채팅방의 판매자·구매자 두 사람만 방과 메시지를 볼 수 있어요. (Realtime 도 RLS 를 지켜요)

## DB (가계부와 같은 Supabase 프로젝트)

- 가계부(`ledger_entries`)와 구분하려고 고구마마켓 테이블·함수는 모두 `market_` 접두어를 씁니다.
- 회원 계정(`auth.users`)은 같은 프로젝트 안에서 공유돼요. 고구마마켓에서 가입하면
  `user_metadata.app = 'goguma'` 가 붙고, 이 경우에만 `market_profiles` 가 만들어집니다.
- 모든 테이블에 RLS(행 단위 보안)가 켜져 있어요. 프로필은 누구나 읽을 수 있고, 본인만 수정할 수 있어요.
- `market_products`(판매글): 누구나 읽을 수 있고, 쓰기·수정·삭제는 로그인한 본인 글만 가능해요.
  (`supabase/migrations/002_market_products.sql`)
- 사진: Storage 버킷 `market-product-images` (공개 읽기, 장당 5MB, 이미지 형식만).
  (`supabase/migrations/003_market_product_images.sql`)
- 동네: `market_profiles` 의 `region`·`neighborhood`·`neighborhood_verified_at`, 판매글의 `region`·`neighborhood`.
  (`supabase/migrations/004_market_neighborhood.sql`)
- 채팅: `market_chat_rooms`(방), `market_chat_messages`(메시지). 두 사람만 읽고 쓸 수 있어요.
  (`supabase/migrations/005_market_chat.sql`)

## 배포할 때 체크리스트 (나중에)

- 배포 사이트(예: Vercel)에 환경 변수 3개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `KAKAO_REST_API_KEY`) 등록
- 카카오 개발자 콘솔 → 내 애플리케이션 → **카카오맵 사용 설정 ON** (안 켜면 로컬 API 가 403)
- Supabase 대시보드 → Authentication → URL Configuration → **Redirect URLs** 에
  `https://배포주소/auth/callback` 추가 (이메일 인증을 켤 경우 필요)
