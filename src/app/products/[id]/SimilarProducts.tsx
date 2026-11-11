// 상세 화면 아래 "이런 물건은 어때요?" — 비슷한 판매중 물건 추천 + 가격 비교
// 추천 기준은 src/lib/product-data.ts 의 getSimilarProducts 에 있어요.
import Link from "next/link";
import { getSimilarProducts } from "@/lib/product-data";
import { priceCompare, type Product } from "@/lib/products";
import { ProductCard } from "../ProductCard";

const REASON_LABEL = {
  category: "같은 카테고리",
  price: "비슷한 가격대",
} as const;

const TONE_STYLE = {
  cheaper: "text-goguma",
  pricier: "text-muted",
  same: "text-ink",
} as const;

export async function SimilarProducts({ product }: { product: Product }) {
  const similar = await getSimilarProducts(product);

  return (
    <section className="mt-14 border-t border-line pt-8" aria-labelledby="similar-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="similar-title" className="text-xl font-extrabold tracking-tight">
            이런 물건은 어때요? 👀
          </h2>
          <p className="mt-1 text-sm text-muted">
            지금 판매중인 비슷한 물건이에요. 가격은 <b className="text-ink">이 글</b>과 비교했어요.
          </p>
        </div>
        <Link href="/products" className="shrink-0 text-sm font-semibold text-muted hover:text-ink">
          전체 보기 →
        </Link>
      </div>

      {similar.length === 0 ? (
        <p className="rounded-3xl bg-surface px-6 py-10 text-center text-sm text-muted ring-1 ring-line">
          아직 비슷한 물건이 없어요. 새 글이 올라오면 여기에 보여드릴게요 🍠
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {similar.map((p) => {
            const compare = priceCompare(product.price, p.price);
            return (
              <ProductCard key={p.id} product={p}>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5 text-xs">
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-semibold text-muted">
                    {REASON_LABEL[p.reason]}
                  </span>
                  <span className={`font-bold ${TONE_STYLE[compare.tone]}`}>{compare.text}</span>
                </div>
              </ProductCard>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function SimilarProductsSkeleton() {
  return (
    <div className="mt-14 border-t border-line pt-8">
      <div className="h-7 w-48 animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-3xl bg-surface-2 sm:h-72" />
        ))}
      </div>
    </div>
  );
}
