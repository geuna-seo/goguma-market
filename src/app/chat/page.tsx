// 내 채팅 목록 (/chat) — 로그인한 사람만
import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyChatRooms } from "@/lib/chat-data";
import { categoryEmoji, productImageUrl, timeAgo } from "@/lib/products";

export const metadata: Metadata = { title: "채팅" };

export default function ChatListPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">채팅 💬</h1>
      <p className="mt-1 text-muted">이웃과 나눈 대화를 모아 봤어요.</p>
      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <ChatRoomList />
        </Suspense>
      </div>
    </>
  );
}

async function ChatRoomList() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rooms = await getMyChatRooms();

  if (rooms.length === 0) {
    return (
      <div className="rounded-3xl bg-surface px-6 py-16 text-center ring-1 ring-line">
        <p className="text-5xl">💬</p>
        <p className="mt-4 font-bold">아직 대화가 없어요</p>
        <p className="mt-1 text-sm text-muted">마음에 드는 물건을 찾으면 판매자에게 채팅해 보세요.</p>
        <Link href="/products" className="mt-6 inline-block rounded-2xl bg-goguma px-6 py-3 font-bold text-on-goguma">
          물건 구경하기
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
      {rooms.map((room) => {
        const iAmSeller = room.seller_id === user.id;
        // 상대방: 내가 판매자면 구매자, 내가 구매자면 판매자
        const other = (iAmSeller ? room.buyer : room.seller)?.nickname ?? "알 수 없음";
        const cover = room.product?.images[0];

        return (
          <li key={room.id}>
            <Link href={`/chat/${room.id}`} className="flex items-center gap-3 p-4 transition hover:bg-surface-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-flesh text-lg font-bold text-[#1d1720]">
                {other.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="truncate font-bold">{other}</span>
                  <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                    {iAmSeller ? "구매 희망" : "판매자"}
                  </span>
                  {room.last_message_at && (
                    <span className="ml-auto shrink-0 text-xs text-muted">{timeAgo(room.last_message_at)}</span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted">{room.last_message ?? "아직 메시지가 없어요"}</p>
                <p className="mt-0.5 truncate text-xs text-muted/80">🍠 {room.product?.title ?? "삭제된 물건"}</p>
              </div>
              <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 text-xl">
                {cover ? (
                  <Image src={productImageUrl(cover)} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <span aria-hidden="true">{categoryEmoji("")}</span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-3xl bg-surface-2" />
      ))}
    </div>
  );
}
