import Link from "next/link";

// 고구마 모양 로고 (SVG)
export function GogumaMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M8 26c-3-6 1-15 9-18 7-3 15-1 17 5 2 7-3 14-10 17-7 2-13 2-16-4z"
        fill="var(--goguma)"
      />
      <path
        d="M13 24c-2-4 1-10 6-12 5-2 10-1 11 3 1 5-2 9-7 11-4 2-8 1-10-2z"
        fill="var(--flesh)"
      />
      <path
        d="M33 9c1-3 3-4 5-4-1 2-2 4-5 5"
        stroke="var(--goguma)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <GogumaMark className="size-8 transition-transform group-hover:-rotate-12" />
      <span className="text-xl font-extrabold tracking-tight">
        고구마<span className="text-goguma">마켓</span>
      </span>
    </Link>
  );
}
