<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 고구마마켓 작업 규칙

## 1. 개발 공부용 프로젝트 — 한 번에 한 단계씩

- 주인이 **개발 공부를 하면서 단계별로** 만드는 프로젝트예요. 요청받은 단계만 구현하고, 다음 단계 기능을 미리 만들지 마세요.
- 진행 단계는 `README.md`의 "진행 단계" 체크리스트를 기준으로 해요. 한 단계를 끝내면 체크하고 홈 화면(`src/app/page.tsx`)의 `COMING_SOON` 목록도 맞춰 주세요.
  - STEP 1 회원가입·로그인·로그아웃 ✅ / STEP 2 상품 등록·목록·상세 / STEP 3 동네 인증 / STEP 4 채팅 / STEP 5 관심 목록
- 코드는 **배우기 쉽게** 작성해요.
  - 처음 나오는 개념(Server Action, RLS, Suspense 등)에는 짧은 **한국어 주석**으로 "왜 이렇게 하는지"를 적어 주세요.
  - 라이브러리는 꼭 필요할 때만 추가하고, 추가할 때 이유를 설명해 주세요.
  - 기존 파일 구조와 패턴(`src/lib/supabase/*`, `src/lib/auth.ts`, `(auth)/actions.ts`)을 따라 주세요.
- 설명과 UI 문구는 모두 한국어로 써요. 디자인은 2030 감각의 고구마 테마(`globals.css` 토큰: `goguma`, `flesh`, `surface` 등)를 유지해요.

## 2. Supabase — 가계부 프로젝트와 같은 DB를 함께 써요 ⚠️

- Supabase 프로젝트 `ldpdhcodqeljumsagudo`는 **가계부(my-money-log)에서 쓰던 것을 재활용**하는 중이에요. 두 앱이 한 DB를 같이 써요.
- **가계부 객체는 절대 수정·삭제하지 마세요:** `public.ledger_entries` 테이블, `public.request_ledger_id()` 함수와 그 RLS 정책·권한.
  (가계부는 회원가입 없이 `x-ledger-id` 헤더로 동작하는 별도 앱이에요. 소스: `../GGB/`)
- 고구마마켓 테이블·함수·트리거·정책에는 **모두 `market_` 접두어**를 붙여요. (예: `market_profiles`, `market_products`)
- `auth.users`(회원 계정)는 두 앱이 공유해요.
  - 고구마마켓 가입은 `user_metadata.app = 'goguma'`를 붙이고, 트리거 `market_handle_new_user`는 이 값이 있을 때만 프로필을 만들어요. 이 조건을 없애지 마세요.
  - `auth.users`에 거는 트리거는 다른 앱 가입에도 실행되니 반드시 이렇게 조건을 걸어 주세요.
- DB를 바꿀 때:
  1. 먼저 `list_tables`로 현재 구조를 확인해요.
  2. `apply_migration`으로 적용하고, 같은 SQL을 `supabase/migrations/00N_설명.sql`로 저장해요 (번호는 이어서).
  3. 새 테이블은 **RLS를 반드시 켜고**, 필요한 권한만 `grant`해요.
  4. 적용한 뒤 `get_advisors`(security)로 경고가 없는지 확인해요.
- 데이터를 지우거나 테이블을 drop하는 작업은 **먼저 주인에게 물어보세요**. 공유 DB라서 가계부 데이터에 영향이 갈 수 있어요.
- 현재 Supabase **이메일 인증은 꺼져 있어요** (가입하면 바로 로그인돼요). 켜게 되면 Redirect URLs에 배포 주소의 `/auth/callback`을 추가해야 해요.
- 테스트 가입은 실제 사람에게 메일이 가지 않도록 `@example.com` 주소를 써요. 테스트 계정 정보는 `.env.local`에 적어 두었어요.

## 3. Next.js 16 주의사항

- `middleware`가 아니라 **`src/proxy.ts`**를 써요. 세션 갱신 로직은 `src/lib/supabase/proxy.ts`에 있어요.
- `cacheComponents: true`가 켜져 있어요.
  - 쿠키나 로그인 정보를 읽는 컴포넌트는 **`<Suspense>`로 감싸야** 해요 (안 그러면 빌드 에러가 나요).
  - Supabase가 내부에서 `Date.now()`를 쓰기 때문에, 로그인 정보를 읽기 전에 `await connection()`을 불러요 (`src/lib/auth.ts` 참고).
- 서버에서 사용자를 확인할 때는 `getSession()` 말고 **`getClaims()`**를 써요 (토큰을 검증해 주기 때문이에요).
- 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 관련 문서를 확인해요.

## 4. 개발 환경 (Windows)

- Node.js는 `C:\Program Files\nodejs`에 있어요. Git Bash에서는 `export PATH="/c/Program Files/nodejs:$PATH"`가 필요할 수 있어요.
- **PowerShell 5.1에서 CLI로 값을 파이프(`|`)하지 마세요.** 값 앞에 보이지 않는 BOM 문자가 붙어요. (`vercel env add` 값이 이것 때문에 깨진 적이 있어요.)
  → Git Bash에서 `printf '%s' "값" | ...`처럼 넘겨 주세요.
- Git Bash에서 `vercel` 명령이 경로 문제로 실패하면 `node /c/Users/student/AppData/Roaming/npm/node_modules/vercel/dist/vc.js`로 실행해요.
- 개발 서버 실행: `npm run dev` → http://localhost:3000

## 5. Git · 배포

- GitHub: https://github.com/geuna-seo/goguma-market (public, `main` 브랜치)
- 커밋은 **단계 단위**로, 한국어 메시지로 해요 (예: `STEP 2: 상품 등록`). 커밋과 push는 주인이 요청할 때만 해요.
- **`.env.local`은 절대 커밋하지 마세요.** 새 환경변수가 생기면 `.env.example`에 키 이름만 추가해요.
- Vercel 프로젝트는 `geuna-seo/goguma-market`이고, 주소는 https://goguma-market-ebon-ten.vercel.app 이에요.
  - GitHub와 연결돼 있어서 **`main`에 push하면 자동으로 운영 사이트에 배포돼요.** push하기 전에 `npm run lint`와 `npm run build`가 통과하는지 확인해요.
  - 환경변수를 추가하면 Vercel에도 운영·미리보기·개발 3개 환경 모두 등록해요.
  - `vercel link`나 `vercel env pull`을 실행하면 `.gitignore`에 `.env*`가 덧붙을 수 있어요. 그러면 `!.env.example` 예외가 무시되니 되돌려 주세요.
- 운영 사이트에는 테스트 계정 비밀번호를 입력하지 않아요. 로그인 테스트는 로컬(localhost)에서 해요.
