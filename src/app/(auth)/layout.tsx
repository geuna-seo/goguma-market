// 로그인/회원가입 공통 레이아웃: 왼쪽 브랜드 패널 + 오른쪽 폼
// (auth) 처럼 괄호로 감싼 폴더는 URL 에 포함되지 않아요. → /login, /signup
import { GogumaMark, Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-2">
      {/* 왼쪽: 브랜드 패널 (큰 화면에서만) */}
      <aside className="relative hidden overflow-hidden bg-goguma-deep p-12 text-white lg:flex lg:flex-col dark:bg-[#2a1224]">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-goguma blur-3xl opacity-70" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-flesh blur-3xl opacity-30" />

        <div className="relative flex items-center gap-2 text-xl font-extrabold">
          <GogumaMark className="size-8" /> 고구마마켓
        </div>

        <div className="relative mt-auto">
          <p className="text-5xl font-extrabold leading-[1.15] tracking-[-0.04em]">
            동네에서
            <br />
            가장 <span className="text-flesh">달달한</span>
            <br />
            거래 🍠
          </p>
          <div className="mt-10 flex gap-3">
            {["#직거래", "#나눔", "#동네인증"].map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                {t}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* 오른쪽: 폼 */}
      <main className="flex flex-col px-4 py-6 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
