import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-4">
          <Logo />
          <Link
            href="/products"
            className="rounded-full px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-surface-2"
          >
            중고거래
          </Link>
        </div>
        {/* 로그인 정보(쿠키)를 읽는 부분만 Suspense 로 감싸서, 나머지는 바로 보여줘요 */}
        <Suspense fallback={<div className="h-9 w-32 animate-pulse rounded-full bg-surface-2" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <nav className="flex items-center gap-1.5">
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-surface-2"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-85"
        >
          회원가입
        </Link>
      </nav>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/products/new"
        className="hidden rounded-full bg-goguma px-4 py-2 text-sm font-semibold text-on-goguma transition hover:opacity-85 sm:block"
      >
        글쓰기
      </Link>
      <div className="flex items-center gap-2 rounded-full bg-surface p-1 ring-1 sm:pr-3 ring-line">
        <span className="grid size-7 place-items-center rounded-full bg-flesh text-sm font-bold text-[#1d1720]">
          {user.nickname.slice(0, 1)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold sm:inline">{user.nickname}</span>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
