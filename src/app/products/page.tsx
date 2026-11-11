// 판매글 목록 (/products) — 누구나 볼 수 있어요
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/product-data";
import { ProductCard } from "./ProductCard";

export const metadata: Metadata = { title: "중고거래" };

export default function ProductsPage() {
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

      {/* DB에서 목록을 읽는 부분만 Suspense 로 감싸서, 제목·버튼은 먼저 보여줘요 */}
      <Suspense fallback={<ListSkeleton />}>
        <ProductList />
      </Suspense>
    </>
  );
}

async function ProductList() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <div className="rounded-3xl bg-surface px-6 py-16 text-center ring-1 ring-line">
        <p className="text-5xl">🫙</p>
        <p className="mt-4 font-bold">아직 올라온 물건이 없어요</p>
        <p className="mt-1 text-sm text-muted">첫 번째 판매글의 주인공이 되어 보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
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
