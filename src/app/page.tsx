import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

const COMING_SOON = [
  { emoji: "📸", title: "내 물건 팔기", desc: "사진 몇 장이면 판매글 완성", step: "STEP 2" },
  { emoji: "📍", title: "동네 인증", desc: "가까운 이웃끼리만 거래해요", step: "STEP 3" },
  { emoji: "💬", title: "1:1 채팅", desc: "판매자와 바로 대화하기", step: "STEP 4" },
  { emoji: "🧡", title: "관심 목록", desc: "찜한 물건 모아보기", step: "STEP 5" },
];

const STICKERS = [
  { label: "아이패드 미니 6", price: "38만원", emoji: "📱", pos: "left-0 top-6", r: "-6deg" },
  { label: "캠핑 의자 2개", price: "2만원", emoji: "🏕️", pos: "right-0 top-28", r: "5deg" },
  { label: "몬스테라 화분", price: "나눔", emoji: "🪴", pos: "left-10 bottom-4", r: "3deg" },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* 히어로 */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-flesh-soft px-3 py-1 text-xs font-bold text-goguma-deep">
              <span className="size-1.5 rounded-full bg-goguma" /> 우리 동네 중고거래
            </span>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.12] tracking-[-0.04em] sm:text-6xl">
              안 쓰는 물건,
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-goguma">따끈하게</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded-sm bg-flesh/70 sm:h-5" />
              </span>{" "}
              팔아요
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              갓 구운 고구마처럼 따뜻한 거래.
              <br className="hidden sm:block" /> 가까운 이웃과 믿고 사고팔아요.
            </p>

            <Suspense fallback={<div className="mt-8 h-14 w-72 animate-pulse rounded-2xl bg-surface-2" />}>
              <HeroAction />
            </Suspense>
          </div>

          {/* 떠다니는 상품 스티커 (장식용) */}
          <div className="relative mx-auto aspect-square w-full max-w-sm" aria-hidden="true">
            <div className="absolute inset-8 rounded-[3rem] bg-gradient-to-br from-goguma to-goguma-deep shadow-2xl shadow-goguma/30" />
            <div className="absolute inset-16 grid place-items-center rounded-[2.5rem] bg-flesh text-8xl">🍠</div>
            {STICKERS.map((s, i) => (
              <div
                key={s.label}
                className={`animate-float absolute ${s.pos} flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-2.5 shadow-xl shadow-black/10 ring-1 ring-line`}
                style={{ "--r": s.r, animationDelay: `${i * 0.6}s` } as React.CSSProperties}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-xl">{s.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-sm font-extrabold text-goguma">{s.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 앞으로 만들 기능 */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight">곧 구워지는 중 🔥</h2>
            <span className="text-sm text-muted">STEP 1 · 회원 기능 완료</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {COMING_SOON.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl bg-surface p-5 ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl transition group-hover:scale-110">{f.emoji}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">
                    {f.step}
                  </span>
                </div>
                <p className="mt-6 font-bold">{f.title}</p>
                <p className="mt-1 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

// 로그인 상태에 따라 다른 버튼을 보여줌
async function HeroAction() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <div className="mt-8 inline-flex items-center gap-4 rounded-3xl bg-surface p-2 pr-6 ring-1 ring-line">
        <span className="grid size-12 place-items-center rounded-2xl bg-flesh text-2xl">👋</span>
        <p className="font-semibold">
          반가워요, <span className="text-goguma">{user.nickname}</span>님!
          <br />
          <span className="text-sm font-normal text-muted">판매 기능은 다음 단계에서 열려요.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/signup"
        className="rounded-2xl bg-goguma px-6 py-4 font-bold text-on-goguma shadow-lg shadow-goguma/25 transition hover:-translate-y-0.5 hover:shadow-xl"
      >
        3초 만에 시작하기 →
      </Link>
      <Link
        href="/login"
        className="rounded-2xl bg-surface px-6 py-4 font-bold ring-1 ring-line transition hover:bg-surface-2"
      >
        이미 회원이에요
      </Link>
    </div>
  );
}
