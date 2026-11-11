// proxy.ts 에서 매 요청마다 실행: 만료된 로그인 세션(토큰)을 갱신하고 쿠키에 다시 써줘요.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인한 사람은 들어갈 필요 없는 페이지
const GUEST_ONLY_PATHS = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // 세션 쿠키가 담긴 응답이 CDN에 캐시되지 않도록 하는 헤더
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // 주의: createServerClient 와 getClaims 사이에 다른 코드를 넣지 마세요.
  // getClaims 가 토큰을 검증하고, 필요하면 갱신해서 위 setAll 로 쿠키를 써줍니다.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  if (isLoggedIn && GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // 갱신된 세션 쿠키를 리다이렉트 응답에도 옮겨 담기
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
