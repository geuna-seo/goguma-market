// 판매글 수정 (/products/글id/edit) — 내 글만
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProduct } from "@/lib/product-data";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../ProductForm";

export const metadata: Metadata = { title: "판매글 수정" };

export default function EditProductPage({ params }: PageProps<"/products/[id]/edit">) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight">판매글 수정 ✏️</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface-2" />}>
          <EditProductForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditProductForm({ params }: Pick<PageProps<"/products/[id]/edit">, "params">) {
  const { id } = await params;
  const [product, user] = await Promise.all([getProduct(id), getCurrentUser()]);

  if (!user) redirect("/login");
  if (!product) notFound();
  // 남의 글이면 수정 화면 대신 상세 화면으로 (DB의 RLS 도 한 번 더 막아줘요)
  if (product.seller_id !== user.id) redirect(`/products/${id}`);

  // bind: updateProduct(id, prev, formData) 의 첫 번째 값(id)을 미리 채운 새 함수를 만들어요
  const updateThisProduct = updateProduct.bind(null, product.id);

  return (
    <ProductForm
      action={updateThisProduct}
      submitLabel="수정 완료"
      cancelHref={`/products/${product.id}`}
      showStatus
      initialValues={{
        title: product.title,
        category: product.category,
        price: String(product.price),
        description: product.description,
        status: product.status,
      }}
    />
  );
}
