// 채팅방 (/chat/방id) — 그 방의 판매자·구매자만
import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getChatMessages, getChatRoom } from "@/lib/chat-data";
import { categoryEmoji, formatPrice, productImageUrl } from "@/lib/products";
import { StatusBadge } from "../../products/ProductCard";
import { ChatRoom } from "./ChatRoom";

export const metadata: Metadata = { title: "채팅" };

export default function ChatRoomPage({ params }: PageProps<"/chat/[roomId]">) {
  return (
    <>
      <Link href="/chat" className="text-sm font-semibold text-muted hover:text-ink">
        ← 채팅 목록
      </Link>
      <Suspense fallback={<div className="mt-4 h-[60dvh] animate-pulse rounded-3xl bg-surface-2" />}>
        <RoomContent params={params} />
      </Suspense>
    </>
  );
}

async function RoomContent({ params }: Pick<PageProps<"/chat/[roomId]">, "params">) {
  const { roomId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 내가 참여한 방이 아니면 RLS 때문에 null → "없는 방"으로 보여줘요
  const [room, messages] = await Promise.all([getChatRoom(roomId), getChatMessages(roomId)]);
  if (!room) notFound();

  const iAmSeller = room.seller_id === user.id;
  const other = (iAmSeller ? room.buyer : room.seller)?.nickname ?? "알 수 없음";
  const product = room.product;
  const cover = product?.images[0];

  return (
    <div className="mt-4 flex h-[calc(100dvh-10rem)] min-h-[28rem] flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
      {/* 위: 상대방 + 물건 정보 */}
      <div className="border-b border-line p-4">
        <p className="font-bold">
          {other} <span className="text-xs font-semibold text-muted">· {iAmSeller ? "구매 희망자" : "판매자"}</span>
        </p>
        {product ? (
          <Link href={`/products/${product.id}`} className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-2 p-2 transition hover:opacity-85">
            <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-xl">
              {cover ? (
                <Image src={productImageUrl(cover)} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <span aria-hidden="true">{categoryEmoji("")}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{product.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-extrabold text-goguma">
                <StatusBadge status={product.status} />
                {formatPrice(product.price)}
              </p>
            </div>
          </Link>
        ) : (
          <p className="mt-2 text-sm text-muted">삭제된 물건이에요.</p>
        )}
      </div>

      {/* 아래: 메시지 + 입력칸 (실시간이라 Client Component) */}
      <ChatRoom roomId={room.id} myId={user.id} otherNickname={other} initialMessages={messages} />
    </div>
  );
}
