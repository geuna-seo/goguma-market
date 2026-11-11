// 목록에 보이는 판매글 카드 한 장
import Link from "next/link";
import { STATUS_LABELS, categoryEmoji, formatPrice, timeAgo, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const done = product.status === "sold";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex gap-4 rounded-3xl bg-surface p-3 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 sm:flex-col sm:p-4"
    >
      {/* 사진 자리 (사진 업로드는 다음 단계) */}
      <div
        className={`grid aspect-square w-28 shrink-0 place-items-center rounded-2xl bg-surface-2 text-5xl transition group-hover:scale-[1.02] sm:w-full ${done ? "opacity-50 grayscale" : ""}`}
        aria-hidden="true"
      >
        {categoryEmoji(product.category)}
      </div>

      <div className="min-w-0 flex-1 py-1 sm:py-0">
        <p className="truncate font-semibold">{product.title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {product.category} · {timeAgo(product.created_at)}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {product.status !== "selling" && <StatusBadge status={product.status} />}
          <p className="font-extrabold text-goguma">{formatPrice(product.price)}</p>
        </div>
        <p className="mt-2 truncate text-xs text-muted">{product.seller?.nickname ?? "알 수 없음"}</p>
      </div>
    </Link>
  );
}

export function StatusBadge({ status }: { status: Product["status"] }) {
  const style =
    status === "selling"
      ? "bg-flesh-soft text-goguma-deep"
      : status === "reserved"
        ? "bg-goguma text-on-goguma"
        : "bg-ink/80 text-bg";
  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${style}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
