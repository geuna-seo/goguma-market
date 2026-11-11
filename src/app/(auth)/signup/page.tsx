import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">고구마마켓 시작하기 🍠</h1>
      <p className="mt-2 text-muted">이메일만 있으면 바로 가입할 수 있어요.</p>

      <SignupForm />

      <p className="mt-8 text-center text-sm text-muted">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-bold text-goguma hover:underline">
          로그인
        </Link>
      </p>
    </>
  );
}
