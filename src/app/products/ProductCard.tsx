// 목록에 보이는 판매글 카드 한 장
import Image from "next/image";
import Link from "next/link";
import {
  STATUS_LABELS,
  categoryEmoji,
  formatPrice,
  productImageUrl,
  timeAgo,
  type Product,
} from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const done = product.status === "sold";
  const cover = product.images[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex gap-4 rounded-3xl bg-surface p-3 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 sm:flex-col sm:p-4"
    >
      {/* 대표 사진 (없으면 카테고리 이모지) */}
      <div
        className={`relative grid aspect-square w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-2 text-5xl sm:w-full ${done ? "opacity-50 grayscale" : ""}`}
      >
        {cover ? (
          // next/image: 화면 크기에 맞게 줄인 사진을 자동으로 만들어 줘서 빨리 떠요.
          // fill = 부모 상자를 꽉 채우기, sizes = "화면에서 대략 이 정도 폭으로 보여요" 힌트
          <Image
            src={productImageUrl(cover)}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 112px"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <span aria-hidden="true">{categoryEmoji(product.category)}</span>
        )}
        {product.images.length > 1 && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-white">
            📷 {product.images.length}
          </span>
        )}
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
