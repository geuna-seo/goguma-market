// 판매글 쓰기 (/products/new) — 로그인한 사람만
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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

  return (
    <ProductForm userId={user.id} action={createProduct} submitLabel="판매글 올리기" cancelHref="/products" />
  );
}
