"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "../actions";
import { ErrorBox, Field, SubmitButton } from "@/components/form";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signup, {});

  // 이메일 인증이 켜져 있어서 인증 메일을 보낸 경우
  if (state.sentTo) {
    return (
      <div className="mt-8 rounded-3xl bg-surface p-6 text-center ring-1 ring-line">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-flesh-soft text-3xl">💌</div>
        <p className="mt-4 text-lg font-bold">메일함을 확인해 주세요</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          <b className="text-ink">{state.sentTo}</b>
          <br />
          으로 보낸 인증 링크를 누르면 가입이 끝나요.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-2xl bg-surface-2 px-5 py-3 text-sm font-bold hover:opacity-80"
        >
          로그인 화면으로
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <ErrorBox message={state.error} />
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
        id="nickname"
        name="nickname"
        type="text"
        label="닉네임"
        placeholder="달콤한고구마"
        hint="2~12자, 거래할 때 이웃에게 보여지는 이름이에요."
        autoComplete="nickname"
        minLength={2}
        maxLength={12}
        defaultValue={state.values?.nickname}
        required
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="비밀번호"
        placeholder="8자 이상"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        id="passwordConfirm"
        name="passwordConfirm"
        type="password"
        label="비밀번호 확인"
        placeholder="한 번 더 입력하세요"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <div className="pt-2">
        <SubmitButton pending={pending}>{pending ? "가입하는 중…" : "가입하기"}</SubmitButton>
      </div>
    </form>
  );
}
