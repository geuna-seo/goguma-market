"use client";
// 판매글 쓰기·수정에 같이 쓰는 폼
// 어떤 Server Action 을 부를지는 props(action)로 받아서, 한 폼을 두 화면에서 재사용해요.

import { useActionState } from "react";
import Link from "next/link";
import type { ProductFormState } from "./actions";
import { CATEGORIES, DESCRIPTION_MAX, STATUS_LABELS, TITLE_MAX } from "@/lib/products";
import { ErrorBox, Field, Select, SubmitButton, TextArea } from "@/components/form";

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  // 수정할 때 처음 채워둘 값
  initialValues?: Record<string, string>;
  submitLabel: string;
  cancelHref: string;
  // 수정 화면에서만 판매 상태(판매중/예약중/거래완료)를 고를 수 있어요
  showStatus?: boolean;
};

export function ProductForm({ action, initialValues = {}, submitLabel, cancelHref, showStatus }: Props) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, {});
  // 에러로 돌아왔으면 방금 입력한 값, 아니면 처음 값
  const v = state.values ?? initialValues;
  // 💡 select 에 key 를 주는 이유:
  //   Server Action 이 끝나면 React 가 폼을 "처음 값"으로 되돌려요(reset).
  //   input 은 바뀐 defaultValue 로 돌아가지만, select 는 처음 그려질 때 값으로만 돌아가요.
  //   key 가 바뀌면 select 를 새로 그리니까, 방금 고른 값이 그대로 남아요.

  return (
    <form action={formAction} className="space-y-5">
      <ErrorBox message={state.error} />

      <Field
        id="title"
        name="title"
        label="제목"
        placeholder="예) 아이패드 미니 6세대 64GB"
        maxLength={TITLE_MAX}
        defaultValue={v.title}
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          key={`category-${v.category}`}
          id="category"
          name="category"
          label="카테고리"
          placeholder="카테고리 선택"
          options={CATEGORY_OPTIONS}
          defaultValue={v.category ?? ""}
          required
        />
        <Field
          id="price"
          name="price"
          label="가격 (원)"
          placeholder="숫자만 입력"
          inputMode="numeric"
          hint="나눔이면 0을 적어 주세요."
          defaultValue={v.price}
          required
        />
      </div>

      {showStatus && (
        <Select
          key={`status-${v.status}`}
          id="status"
          name="status"
          label="판매 상태"
          options={STATUS_OPTIONS}
          defaultValue={v.status ?? "selling"}
        />
      )}

      <TextArea
        id="description"
        name="description"
        label="자세한 설명"
        placeholder={"브랜드, 모델명, 구매 시기, 사용감 등을 적어 주세요.\n직거래 희망 장소도 적어 두면 좋아요."}
        maxLength={DESCRIPTION_MAX}
        hint={`${DESCRIPTION_MAX.toLocaleString()}자까지 쓸 수 있어요.`}
        defaultValue={v.description}
      />

      <div className="flex gap-3 pt-2">
        <Link
          href={cancelHref}
          className="grid h-13 shrink-0 place-items-center rounded-2xl bg-surface px-6 font-bold ring-1 ring-line transition hover:bg-surface-2"
        >
          취소
        </Link>
        <SubmitButton pending={pending}>{pending ? "저장 중…" : submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
