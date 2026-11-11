"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type AuthState } from "../actions";
import { ErrorBox, Field, SubmitButton } from "@/components/form";

export function LoginForm() {
  // useActionState: 서버 액션의 결과(state)와 진행 중 여부(pending)를 받아와요
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});
  const callbackError =
    useSearchParams().get("error") === "auth_callback"
      ? "인증 링크가 만료됐거나 잘못됐어요. 다시 로그인해 주세요."
      : undefined;

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <ErrorBox message={state.error ?? callbackError} />
      <Field
        id="email"
        name="email"
        type="email"
        label="이메일"
        placeholder="goguma@example.com"
        autoComplete="email"
        defaultValue={state.values?.email}
        required
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요"
        autoComplete="current-password"
        required
      />
      <div className="pt-2">
        <SubmitButton pending={pending}>{pending ? "로그인 중…" : "로그인"}</SubmitButton>
      </div>
    </form>
  );
}
