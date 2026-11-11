"use client";
// 삭제 버튼: 실수로 지우지 않도록 브라우저 확인창(confirm)을 한 번 띄워요.
// confirm 은 브라우저에서만 쓸 수 있어서 Client Component 로 만들었어요.

import { useTransition } from "react";
import { deleteProduct } from "../actions";

export function DeleteButton({ id }: { id: string }) {
  // useTransition: Server Action 이 끝날 때까지 pending(진행 중) 상태를 알려줘요
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("이 판매글을 삭제할까요? 삭제하면 되돌릴 수 없어요.")) return;
    startTransition(() => deleteProduct(id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="h-13 rounded-2xl bg-danger-soft px-6 font-bold text-danger transition hover:opacity-80 disabled:opacity-60"
    >
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}
