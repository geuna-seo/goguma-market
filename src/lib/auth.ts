// 현재 로그인한 사용자 정보를 가져오는 곳 (Data Access Layer)
// 여러 컴포넌트에서 불러도 한 요청 안에서는 한 번만 실행되도록 React cache 로 감쌌어요.
import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  nickname: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // 로그인 정보는 요청할 때마다 달라지므로 미리 렌더링(prerender)하지 않도록 표시해요.
  // (Supabase 가 토큰 만료 확인에 Date.now() 를 쓰기 때문에 이게 없으면 Next 가 경고해요)
  await connection();

  const supabase = await createClient();

  // getClaims: 쿠키의 토큰(JWT)을 검증해서 사용자 정보를 꺼내요.
  // (getSession 은 검증 없이 쿠키를 그대로 믿기 때문에 서버에서는 쓰지 않아요)
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("market_profiles")
    .select("nickname")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    nickname:
      profile?.nickname ??
      (claims.user_metadata?.nickname as string | undefined) ??
      "고구마",
  };
});
