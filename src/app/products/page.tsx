// 판매글 목록 (/products) — 누구나 볼 수 있어요
// ?area=mine 이면 "내가 인증한 동네"의 글만 보여줘요.
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getProducts } from "@/lib/product-data";
import { ProductCard } from "./ProductCard";

export const metadata: Metadata = { title: "중고거래" };

// searchParams(주소의 ?area=...)도 요청이 와야 알 수 있는 값이라, Suspense 안쪽에서 꺼내요.
export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">우리 동네 매물 🍠</h1>
          <p className="mt-1 text-muted">방금 올라온 따끈한 물건들이에요.</p>
        </div>
        <Link
          href="/products/new"
          className="shrink-0 rounded-2xl bg-goguma px-5 py-3 font-bold text-on-goguma shadow-lg shadow-goguma/25 transition hover:-translate-y-0.5"
        >
          + 글쓰기
        </Link>
      </div>

      {/* DB·로그인 정보를 읽는 부분만 Suspense 로 감싸서, 제목·버튼은 먼저 보여줘요 */}
      <Suspense fallback={<ListSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductList({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const { area } = await searchParams;
  const onlyMine = area === "mine";
  const user = await getCurrentUser();
  const myArea =
    user?.region && user.neighborhood ? { region: user.region, neighborhood: user.neighborhood } : null;

  // "우리 동네"를 골랐는데 인증한 동네가 없으면 안내만 보여줘요
  if (onlyMine && !myArea) {
    return (
      <>
        <AreaTabs onlyMine myNeighborhood={null} />
        <Empty
          emoji="📍"
          title={user ? "아직 동네 인증을 안 했어요" : "로그인하고 동네를 인증해 주세요"}
          desc="동네를 인증하면 우리 동네 물건만 모아 볼 수 있어요."
          href={user ? "/neighborhood" : "/login"}
          cta={user ? "동네 인증하기" : "로그인하기"}
        />
      </>
    );
  }

  const products = await getProducts(onlyMine && myArea ? myArea : undefined);

  return (
    <>
      <AreaTabs onlyMine={onlyMine} myNeighborhood={myArea?.neighborhood ?? null} />
      {products.length === 0 ? (
        onlyMine ? (
          <Empty
            emoji="🫙"
            title={`${myArea?.neighborhood}에 올라온 물건이 아직 없어요`}
            desc="우리 동네 첫 번째 판매글을 올려 보세요!"
            href="/products/new"
            cta="내 물건 팔기"
          />
        ) : (
          <Empty emoji="🫙" title="아직 올라온 물건이 없어요" desc="첫 번째 판매글의 주인공이 되어 보세요!" />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} eager={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}

// "전체 / 우리 동네" 선택 버튼. 링크라서 새로고침해도, 주소를 공유해도 같은 화면이 보여요.
function AreaTabs({ onlyMine, myNeighborhood }: { onlyMine: boolean; myNeighborhood: string | null }) {
  const tab = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      active ? "bg-ink text-bg" : "bg-surface text-muted ring-1 ring-line hover:text-ink"
    }`;

  return (
    <nav className="mb-5 flex gap-2" aria-label="동네 필터">
      <Link href="/products" className={tab(!onlyMine)} aria-current={!onlyMine ? "page" : undefined}>
        전체
      </Link>
      <Link href="/products?area=mine" className={tab(onlyMine)} aria-current={onlyMine ? "page" : undefined}>
        📍 {myNeighborhood ?? "우리 동네"}
      </Link>
    </nav>
  );
}

function Empty(props: { emoji: string; title: string; desc: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-3xl bg-surface px-6 py-16 text-center ring-1 ring-line">
      <p className="text-5xl">{props.emoji}</p>
      <p className="mt-4 font-bold">{props.title}</p>
      <p className="mt-1 text-sm text-muted">{props.desc}</p>
      {props.href && (
        <Link
          href={props.href}
          className="mt-6 inline-block rounded-2xl bg-goguma px-6 py-3 font-bold text-on-goguma"
        >
          {props.cta}
        </Link>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-3xl bg-surface-2 sm:h-72" />
      ))}
    </div>
  );
}
