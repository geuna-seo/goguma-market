"use client";
// 상세 화면 사진 보기: 큰 사진 1장 + 아래 작은 사진(썸네일)을 누르면 바뀌어요.
// "지금 몇 번째 사진을 보는지" 상태(useState)가 필요해서 Client Component 로 만들었어요.

import { useState } from "react";
import Image from "next/image";
import { categoryEmoji, productImageUrl } from "@/lib/products";

type Props = {
  images: string[];
  title: string;
  category: string;
};

export function ImageGallery({ images, title, category }: Props) {
  const [index, setIndex] = useState(0);

  // 사진이 없는 글은 카테고리 이모지로 대신해요
  if (images.length === 0) {
    return (
      <div
        className="grid aspect-square place-items-center rounded-[2rem] bg-gradient-to-br from-flesh-soft to-surface-2 text-[8rem] ring-1 ring-line"
        aria-hidden="true"
      >
        {categoryEmoji(category)}
      </div>
    );
  }

  const go = (next: number) => setIndex((next + images.length) % images.length);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-surface-2 ring-1 ring-line">
        <Image
          src={productImageUrl(images[index])}
          alt={`${title} 사진 ${index + 1}`}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
          preload={index === 0}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="이전 사진"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-lg text-white backdrop-blur hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="다음 사진"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-lg text-white backdrop-blur hover:bg-black/60"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((path, i) => (
            <button
              key={path}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`사진 ${i + 1} 보기`}
              aria-current={i === index}
              className={`relative size-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === index ? "ring-goguma" : "ring-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={productImageUrl(path)} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
