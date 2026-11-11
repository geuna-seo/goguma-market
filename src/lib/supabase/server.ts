// 서버(Server Component, Server Action, Route Handler)에서 쓰는 Supabase 클라이언트
// 요청마다 새로 만들어야 해요. (요청한 사람의 쿠키 = 로그인 세션을 읽기 때문)
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 안에서는 쿠키를 쓸 수 없어요.
            // 세션 갱신은 proxy.ts 가 매 요청마다 처리하므로 무시해도 괜찮습니다.
          }
        },
      },
    },
  );
}
