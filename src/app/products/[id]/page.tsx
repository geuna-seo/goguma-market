// 판매글 상세 (/products/글id) — 누구나 볼 수 있고, 내 글이면 수정·삭제 버튼이 보여요
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProduct } from "@/lib/product-data";
import { categoryEmoji, formatPrice, timeAgo } from "@/lib/products";
import { StatusBadge } from "../ProductCard";
import { DeleteButton } from "./DeleteButton";

// 브라우저 탭 제목을 글 제목으로
export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.title ?? "판매글" };
}

// page 는 async 가 아니에요. params(주소의 id)는 "요청이 와야 알 수 있는 값"이라서
// Suspense 안쪽 컴포넌트에 넘겨서 거기서 꺼내요. 그래야 바깥 틀은 먼저 보여줄 수 있어요.
export default function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  return (
    <>
      <Link href="/products" className="text-sm font-semibold text-muted hover:text-ink">
        ← 목록으로
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/products/[id]">, "params">) {
  const { id } = await params;
  // 두 가지를 동시에 요청해서 기다리는 시간을 줄여요
  const [product, user] = await Promise.all([getProduct(id), getCurrentUser()]);
  if (!product) notFound();

  const isMine = user?.id === product.seller_id;
  const edited = product.updated_at !== product.created_at;

  return (
    <article className="mt-4 grid gap-8 md:grid-cols-2">
      {/* 사진 자리 (사진 업로드는 다음 단계) */}
      <div
        className="grid aspect-square place-items-center rounded-[2rem] bg-gradient-to-br from-flesh-soft to-surface-2 text-[8rem] ring-1 ring-line"
        aria-hidden="true"
      >
        {categoryEmoji(product.category)}
      </div>

      <div className="flex flex-col">
        {/* 판매자 */}
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <span className="grid size-11 place-items-center rounded-full bg-flesh text-lg font-bold text-[#1d1720]">
            {product.seller?.nickname.slice(0, 1) ?? "?"}
          </span>
          <div>
            <p className="font-bold">{product.seller?.nickname ?? "알 수 없음"}</p>
            {isMine && <p className="text-xs font-semibold text-goguma">내가 쓴 글</p>}
          </div>
        </div>

        <div className="py-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={product.status} />
            <h1 className="text-2xl font-extrabold tracking-tight">{product.title}</h1>
          </div>
          <p className="mt-2 text-sm text-muted">
            {product.category} · {timeAgo(product.created_at)}
            {edited && " · 수정됨"}
          </p>
          <p className="mt-4 text-3xl font-extrabold text-goguma">{formatPrice(product.price)}</p>

          {/* whitespace-pre-wrap: 사용자가 친 줄바꿈을 그대로 보여줘요 */}
          <p className="mt-6 whitespace-pre-wrap leading-relaxed">
            {product.description || <span className="text-muted">설명이 없어요.</span>}
          </p>
        </div>

        {isMine && (
          <div className="mt-auto flex gap-3 border-t border-line pt-5">
            <Link
              href={`/products/${product.id}/edit`}
              className="grid h-13 flex-1 place-items-center rounded-2xl bg-goguma font-bold text-on-goguma shadow-lg shadow-goguma/25 transition hover:-translate-y-0.5"
            >
              수정하기
            </Link>
            <DeleteButton id={product.id} />
          </div>
        )}
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-4 grid gap-8 md:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-[2rem] bg-surface-2" />
      <div className="space-y-4">
        <div className="h-11 w-40 animate-pulse rounded-full bg-surface-2" />
        <div className="h-8 w-3/4 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-32 animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}
