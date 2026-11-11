"use server";
// Server Actions: <form action={...}> 으로 서버에서 바로 실행되는 함수들

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  // 사용자가 입력했던 값 (에러가 나도 입력이 지워지지 않게 다시 돌려줌)
  values?: Record<string, string>;
  // 이메일 인증 메일을 보낸 경우
  sentTo?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Supabase 에러 코드를 한국어 메시지로
function toKoreanMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "이메일 또는 비밀번호가 맞지 않아요.";
    case "email_not_confirmed":
      return "이메일 인증이 아직 안 됐어요. 메일함의 인증 링크를 눌러주세요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일이에요. 로그인해 주세요.";
    case "weak_password":
      return "비밀번호가 너무 쉬워요. 더 길고 복잡하게 만들어 주세요.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
    case "email_address_invalid":
      return "사용할 수 없는 이메일 주소예요.";
    default:
      return fallback;
  }
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  if (!EMAIL_RE.test(email)) {
    return { error: "이메일 형식을 확인해 주세요.", values };
  }
  if (!password) {
    return { error: "비밀번호를 입력해 주세요.", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: toKoreanMessage(error.code, "로그인에 실패했어요. 다시 시도해 주세요."),
      values,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const values = { email, nickname };

  // 1) 입력값 검사 (서버에서도 꼭 검사해야 해요. 브라우저 검사는 우회할 수 있으니까요)
  if (!EMAIL_RE.test(email)) {
    return { error: "이메일 형식을 확인해 주세요.", values };
  }
  if (nickname.length < 2 || nickname.length > 12) {
    return { error: "닉네임은 2~12자로 지어주세요.", values };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 해요.", values };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호 확인이 일치하지 않아요.", values };
  }

  const supabase = await createClient();

  // 2) 닉네임 중복 확인
  const { data: taken } = await supabase
    .from("market_profiles")
    .select("id")
    .eq("nickname", nickname)
    .maybeSingle();
  if (taken) {
    return { error: "이미 누가 쓰고 있는 닉네임이에요.", values };
  }

  // 3) 가입. options.data 는 auth.users 의 user_metadata 로 저장되고,
  //    DB 트리거(market_handle_new_user)가 이 값으로 market_profiles 행을 만들어요.
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { app: "goguma", nickname },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: toKoreanMessage(error.code, "가입에 실패했어요. 다시 시도해 주세요."),
      values,
    };
  }

  // 이메일 인증을 켜둔 경우, 이미 가입된 이메일이면 에러 대신 identities 가 빈 배열로 와요.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "이미 가입된 이메일이에요. 로그인해 주세요.", values };
  }

  // 이메일 인증이 꺼져 있으면 바로 로그인된 상태(session 있음)
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  // 이메일 인증이 켜져 있으면 메일 확인 안내
  return { sentTo: email, values };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
