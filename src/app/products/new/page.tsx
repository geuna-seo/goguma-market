// 판매글 쓰기 (/products/new) — 로그인한 사람만
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NEIGHBORHOOD_ENABLED } from "@/lib/features";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "내 물건 팔기" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight">내 물건 팔기 ✍️</h1>
      <p className="mt-1 text-muted">사진과 함께 올리면 더 빨리 팔려요 📸</p>

      <div className="mt-8">
        {/* 로그인 정보(쿠키)를 읽으니까 Suspense 로 감싸요 */}
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface-2" />}>
          <NewProductForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewProductForm() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 동네 인증을 안 했으면 글쓰기 대신 안내를 보여줘요 (기능 스위치가 켜져 있을 때만)
  if (NEIGHBORHOOD_ENABLED && !user.neighborhood) {
    return (
      <div className="rounded-3xl bg-surface px-6 py-14 text-center ring-1 ring-line">
        <p className="text-5xl">📍</p>
        <p className="mt-4 text-xl font-extrabold">동네 인증이 필요해요</p>
        <p className="mt-1 text-sm text-muted">이웃끼리 믿고 거래하려고, 동네를 인증한 분만 글을 쓸 수 있어요.</p>
        <Link
          href="/neighborhood"
          className="mt-6 inline-block rounded-2xl bg-goguma px-6 py-3 font-bold text-on-goguma shadow-lg shadow-goguma/25"
        >
          동네 인증하러 가기
        </Link>
      </div>
    );
  }

  return (
    <ProductForm userId={user.id} action={createProduct} submitLabel="판매글 올리기" cancelHref="/products" />
  );
}
