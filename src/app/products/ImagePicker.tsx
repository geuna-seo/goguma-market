"use client";
// 판매글 폼의 사진 칸: 여러 장 고르기 · 미리보기 · 빼기 · 대표 사진 바꾸기
//
// 사진은 고르는 즉시 Storage 에 올라가고, 폼에는 숨김칸(<input type="hidden" name="images">)으로
// "경로"만 담겨요. 글을 저장할 때 Server Action 이 이 경로들을 판매글에 저장해요.

import { useRef, useState } from "react";
import Image from "next/image";
import { IMAGES_MAX, productImageUrl } from "@/lib/products";
import { removeUploadedImages, uploadProductImage } from "@/lib/upload-image";

type Item = {
  path: string;
  // 이번에 새로 올린 사진인지 (빼면 저장소에서 바로 지워도 되는 사진)
  isNew: boolean;
};

type Props = {
  userId: string;
  initialPaths?: string[];
  // 올리는 중에는 "저장" 버튼을 막으려고 부모(ProductForm)에게 알려줘요
  onUploadingChange: (uploading: boolean) => void;
};

export function ImagePicker({ userId, initialPaths = [], onUploadingChange }: Props) {
  const [items, setItems] = useState<Item[]>(() => initialPaths.map((path) => ({ path, isNew: false })));
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(0);

  const total = items.length + uploadingCount;
  const remaining = IMAGES_MAX - total;

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = ""; // 같은 파일을 다시 고를 수 있게 비워요
    if (files.length === 0) return;

    setError(undefined);
    const picked = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`사진은 최대 ${IMAGES_MAX}장까지예요. ${picked.length}장만 올릴게요.`);
    }
    if (picked.length === 0) return;

    setUploadingCount((n) => n + picked.length);
    pendingRef.current += picked.length;
    onUploadingChange(true);

    // 여러 장을 동시에 올려요. allSettled: 몇 장이 실패해도 나머지는 계속 진행해요.
    const results = await Promise.allSettled(picked.map((f) => uploadProductImage(f, userId)));

    const uploaded: Item[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") uploaded.push({ path: r.value, isNew: true });
      else setError(r.reason instanceof Error ? r.reason.message : "사진을 올리지 못했어요.");
    }
    setItems((prev) => [...prev, ...uploaded]);
    setUploadingCount((n) => n - picked.length);

    // 여러 번 나눠 골랐을 때를 대비해 "아직 올리는 중인 장수"를 ref 로 세요
    pendingRef.current -= picked.length;
    if (pendingRef.current === 0) onUploadingChange(false);
  }

  function remove(target: Item) {
    setItems((prev) => prev.filter((i) => i.path !== target.path));
    // 이번에 올린 사진은 아직 어떤 글에도 안 붙었으니 바로 지워요.
    // 원래 글에 있던 사진은 "수정 완료"를 눌렀을 때 서버가 지워요. (취소하면 그대로 남도록)
    if (target.isNew) void removeUploadedImages([target.path]);
  }

  function makeCover(target: Item) {
    setItems((prev) => [target, ...prev.filter((i) => i.path !== target.path)]);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">
        사진 <span className="font-normal text-muted">({items.length}/{IMAGES_MAX})</span>
      </p>

      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {/* 사진 고르기 버튼: label 을 누르면 안쪽의 숨겨진 file input 이 열려요 */}
        {remaining > 0 && (
          <label className="grid size-24 shrink-0 cursor-pointer place-items-center rounded-2xl bg-surface text-center ring-1 ring-line transition hover:bg-surface-2 focus-within:ring-2 focus-within:ring-goguma">
            <span>
              <span className="block text-2xl">📷</span>
              <span className="text-xs font-semibold text-muted">사진 추가</span>
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}

        {items.map((item, index) => (
          <div key={item.path} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-line">
            <Image src={productImageUrl(item.path)} alt={`사진 ${index + 1}`} fill sizes="96px" className="object-cover" />

            {index === 0 ? (
              <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-center text-[11px] font-bold text-bg">
                대표 사진
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(item)}
                className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[11px] font-bold text-white hover:bg-black/65"
              >
                대표로
              </button>
            )}

            <button
              type="button"
              onClick={() => remove(item)}
              aria-label={`사진 ${index + 1} 빼기`}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
            >
              ✕
            </button>

            {/* 폼으로 보낼 값: 순서대로 경로를 담아요 (첫 번째가 대표 사진) */}
            <input type="hidden" name="images" value={item.path} />
          </div>
        ))}

        {/* 올라가는 중인 사진 자리 */}
        {Array.from({ length: uploadingCount }, (_, i) => (
          <div key={`uploading-${i}`} className="grid size-24 shrink-0 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
            <span className="size-5 animate-spin rounded-full border-2 border-goguma border-t-transparent" />
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted">첫 번째 사진이 목록에 보이는 대표 사진이 돼요.</p>
      )}
    </div>
  );
}
