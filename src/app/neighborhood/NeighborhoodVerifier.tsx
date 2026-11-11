"use client";
// 동네 인증 버튼: 브라우저에게 현재 위치를 물어보고 → 서버(Server Action)로 보내요.
// navigator.geolocation 은 브라우저에만 있어서 Client Component 로 만들었어요.
// (위치 권한은 https 주소나 localhost 에서만 물어볼 수 있어요)

import { useState, useTransition } from "react";
import Link from "next/link";
import { verifyNeighborhood } from "./actions";

type Props = {
  current: { region: string; neighborhood: string } | null;
};

// 브라우저 위치 API 를 Promise 로 감싸서 await 로 쓸 수 있게 해요
function getPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, // 가능하면 GPS 로 정확하게
      timeout: 15000,
      maximumAge: 0, // 예전 위치 말고 지금 위치
    }),
  );
}

const GEO_ERRORS: Record<number, string> = {
  1: "위치 권한이 꺼져 있어요. 브라우저 주소창의 자물쇠 아이콘에서 위치 권한을 허용해 주세요.",
  2: "현재 위치를 알 수 없어요. 잠시 후 다시 시도해 주세요.",
  3: "위치를 찾는 데 시간이 너무 오래 걸렸어요. 다시 시도해 주세요.",
};

export function NeighborhoodVerifier({ current }: Props) {
  const [pending, startTransition] = useTransition();
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string>();
  const [verified, setVerified] = useState(current);
  const [justVerified, setJustVerified] = useState(false);

  async function handleVerify() {
    setError(undefined);
    if (!("geolocation" in navigator)) {
      setError("이 브라우저는 위치 기능을 지원하지 않아요.");
      return;
    }

    setFinding(true);
    let pos: GeolocationPosition;
    try {
      pos = await getPosition();
    } catch (e) {
      setFinding(false);
      setError(GEO_ERRORS[(e as GeolocationPositionError).code] ?? "위치를 가져오지 못했어요.");
      return;
    }
    setFinding(false);

    const { latitude, longitude, accuracy } = pos.coords;
    startTransition(async () => {
      const result = await verifyNeighborhood(latitude, longitude, accuracy);
      if (result.area) {
        setVerified(result.area);
        setJustVerified(true);
      } else {
        setError(result.error);
      }
    });
  }

  const busy = finding || pending;

  return (
    <div className="rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
      {verified ? (
        <div className="text-center">
          <p className="text-5xl">📍</p>
          <p className="mt-4 text-sm font-semibold text-muted">{verified.region}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">{verified.neighborhood}</p>
          <span className="mt-3 inline-block rounded-full bg-flesh-soft px-3 py-1 text-xs font-bold text-goguma-deep">
            {justVerified ? "🎉 동네 인증 완료!" : "✓ 인증된 동네"}
          </span>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-5xl">🗺️</p>
          <p className="mt-4 text-xl font-extrabold">아직 동네 인증을 안 했어요</p>
          <p className="mt-1 text-sm text-muted">지금 있는 곳의 위치로 우리 동네를 확인해요.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleVerify}
        disabled={busy}
        className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-goguma font-bold text-on-goguma shadow-lg shadow-goguma/25 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
      >
        {busy && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {finding ? "위치 찾는 중…" : pending ? "동네 확인 중…" : verified ? "현재 위치로 다시 인증하기" : "현재 위치로 동네 인증하기"}
      </button>

      {verified && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/products?area=mine"
            className="grid h-12 place-items-center rounded-2xl bg-surface-2 text-sm font-bold transition hover:opacity-80"
          >
            우리 동네 물건 보기
          </Link>
          <Link
            href="/products/new"
            className="grid h-12 place-items-center rounded-2xl bg-surface-2 text-sm font-bold transition hover:opacity-80"
          >
            내 물건 팔기
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        정확한 위치는 저장하지 않고, 동 이름만 저장해요.
        <br />
        이사했다면 새 동네에서 다시 인증하면 돼요.
      </p>
    </div>
  );
}
