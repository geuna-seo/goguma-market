import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">다시 만나 반가워요 👋</h1>
      <p className="mt-2 text-muted">이메일로 로그인하고 동네 거래를 이어가세요.</p>

      {/* LoginForm 이 URL 쿼리(?error=)를 읽기 때문에 Suspense 로 감싸요 */}
      <Suspense>
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-muted">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-bold text-goguma hover:underline">
          회원가입
        </Link>
      </p>
    </>
  );
}
