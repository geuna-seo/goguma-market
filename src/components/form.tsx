// 로그인/회원가입 폼에서 같이 쓰는 작은 UI 조각들
"use client";

import { useState } from "react";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Field({ label, hint, id, type, ...props }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          className="h-13 w-full rounded-2xl bg-surface px-4 text-[15px] ring-1 ring-line outline-none transition placeholder:text-muted/70 focus:ring-2 focus:ring-goguma"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:text-ink"
          >
            {show ? "숨기기" : "보기"}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-goguma font-bold text-on-goguma shadow-lg shadow-goguma/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
    >
      {pending && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
      {message}
    </p>
  );
}
