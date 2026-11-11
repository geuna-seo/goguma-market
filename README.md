# 🍠 고구마마켓

우리 동네 따끈한 중고거래 — Next.js + Supabase 로 단계별로 만들어 가는 공부용 프로젝트입니다.

## 실행하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 열어주세요.
처음 받는 경우 `.env.example` 을 복사해 `.env.local` 을 만들고 Supabase 값을 채워야 해요.

## 진행 단계

- [x] **STEP 1. 회원가입 · 로그인 · 로그아웃**
- [ ] **STEP 2. 상품 등록 / 목록 / 상세**
  - [x] 판매글 쓰기 · 목록 · 상세 · 수정 · 삭제 (CRUD)
  - [ ] 사진 업로드
- [ ] STEP 3. 동네 인증
- [ ] STEP 4. 1:1 채팅
- [ ] STEP 5. 관심 목록(찜)

## 폴더 구조 (STEP 1 ~ 2)

```
src/
├─ proxy.ts                     # 매 요청마다 로그인 세션 갱신 (Next 16: middleware → proxy)
├─ lib/
│  ├─ auth.ts                   # getCurrentUser(): 현재 로그인 사용자 + 닉네임
│  ├─ products.ts               # 판매글 타입·카테고리·가격 표시 (서버/브라우저 공용)
│  ├─ product-data.ts           # 판매글 읽기: getProducts(), getProduct(id) (서버 전용)
│  └─ supabase/
│     ├─ client.ts              # 브라우저용 Supabase 클라이언트
│     ├─ server.ts              # 서버용 Supabase 클라이언트 (쿠키로 세션 읽기)
│     └─ proxy.ts               # proxy.ts 에서 쓰는 세션 갱신 로직
├─ components/
│  ├─ Header.tsx                # 로고 + 로그인/로그아웃 메뉴
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
   └─ products/
      ├─ layout.tsx             # 헤더 + 내용 틀
      ├─ page.tsx               # 목록 /products
      ├─ actions.ts             # Server Actions: createProduct, updateProduct, deleteProduct
      ├─ ProductForm.tsx        # 쓰기·수정 공용 폼
      ├─ ProductCard.tsx        # 목록 카드 + 판매 상태 뱃지
      ├─ new/page.tsx           # 글쓰기 /products/new (로그인 필요)
      └─ [id]/
         ├─ page.tsx            # 상세 /products/글id (내 글이면 수정·삭제 버튼)
         ├─ DeleteButton.tsx    # 확인창 띄우고 삭제
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

## DB (가계부와 같은 Supabase 프로젝트)

- 가계부(`ledger_entries`)와 구분하려고 고구마마켓 테이블·함수는 모두 `market_` 접두어를 씁니다.
- 회원 계정(`auth.users`)은 같은 프로젝트 안에서 공유돼요. 고구마마켓에서 가입하면
  `user_metadata.app = 'goguma'` 가 붙고, 이 경우에만 `market_profiles` 가 만들어집니다.
- 모든 테이블에 RLS(행 단위 보안)가 켜져 있어요. 프로필은 누구나 읽을 수 있고, 본인만 수정할 수 있어요.
- `market_products`(판매글): 누구나 읽을 수 있고, 쓰기·수정·삭제는 로그인한 본인 글만 가능해요.
  (`supabase/migrations/002_market_products.sql`)

## 배포할 때 체크리스트 (나중에)

- 배포 사이트(예: Vercel)에 환경 변수 2개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) 등록
- Supabase 대시보드 → Authentication → URL Configuration → **Redirect URLs** 에
  `https://배포주소/auth/callback` 추가 (이메일 인증을 켤 경우 필요)
