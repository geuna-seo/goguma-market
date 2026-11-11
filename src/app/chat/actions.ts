"use server";
// 채팅 Server Actions: 채팅 시작하기, 메시지 보내기
// "방 참여자만" 같은 규칙은 DB의 RLS 가 한 번 더 지켜줘요. (supabase/migrations/005_market_chat.sql)

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/chat-data";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

// ─────────────── 채팅하기 (방 찾기 또는 만들기) ───────────────
// 상세 화면의 "채팅하기" 버튼에서 불러요. 이미 방이 있으면 그 방으로, 없으면 새로 만들어요.
export async function startChat(productId: string) {
  const { supabase, userId } = await requireUser();

  const { data: product } = await supabase
    .from("market_products")
    .select("id, seller_id")
    .eq("id", productId)
    .maybeSingle();
  if (!product) redirect("/products");
  // 내 물건이면 채팅 목록으로 (내 물건에 나와 채팅할 수는 없어요)
  if (product.seller_id === userId) redirect("/chat");

  const findRoom = () =>
    supabase
      .from("market_chat_rooms")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_id", userId)
      .maybeSingle();

  let { data: room } = await findRoom();

  if (!room) {
    const { data: created, error } = await supabase
      .from("market_chat_rooms")
      .insert({ product_id: productId, seller_id: product.seller_id })
      .select("id")
      .single();

    // 23505 = 중복. 버튼을 두 번 빠르게 눌러서 방이 동시에 만들어진 경우예요 → 이미 생긴 방을 다시 찾아요
    if (error?.code === "23505") ({ data: room } = await findRoom());
    else if (error || !created) throw new Error("채팅방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    else room = created;
  }

  if (!room) throw new Error("채팅방을 찾지 못했어요.");
  redirect(`/chat/${room.id}`);
}

// ─────────────── 메시지 보내기 ───────────────
export type SendResult = { message: ChatMessage; error?: never } | { error: string; message?: never };

export async function sendMessage(roomId: string, body: string): Promise<SendResult> {
  const { supabase } = await requireUser();

  const text = String(body ?? "").trim();
  if (text.length === 0) return { error: "메시지를 입력해 주세요." };
  if (text.length > 1000) return { error: "메시지는 1,000자까지 보낼 수 있어요." };

  // sender_id 는 DB 기본값(auth.uid())이 채워요. 방 참여자가 아니면 RLS 가 막아요.
  const { data, error } = await supabase
    .from("market_chat_messages")
    .insert({ room_id: roomId, body: text })
    .select("id, room_id, sender_id, body, created_at")
    .single();

  if (error || !data) return { error: "메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요." };

  // 채팅 목록의 "마지막 메시지"가 바뀌었으니 목록 화면을 새로 그리게 해요
  revalidatePath("/chat");
  return { message: data };
}
