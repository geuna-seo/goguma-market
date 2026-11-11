// 동네 인증 (/neighborhood) — 로그인한 사람만
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { NeighborhoodVerifier } from "./NeighborhoodVerifier";

export const metadata: Metadata = { title: "동네 인증" };

export default function NeighborhoodPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-10">
        <h1 className="text-3xl font-extrabold tracking-tight">동네 인증 📍</h1>
        <p className="mt-1 text-muted">가까운 이웃끼리 믿고 거래하려면 동네 인증이 필요해요.</p>

        <div className="mt-8">
          {/* 로그인 정보(쿠키)를 읽으니까 Suspense 로 감싸요 */}
          <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-surface-2" />}>
            <VerifierSection />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function VerifierSection() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const current =
    user.region && user.neighborhood ? { region: user.region, neighborhood: user.neighborhood } : null;
  return <NeighborhoodVerifier current={current} />;
}
