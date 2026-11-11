// 채팅 데이터를 읽는 함수 (서버 전용)
// 누가 어떤 방을 볼 수 있는지는 DB의 RLS 가 정해요. (supabase/migrations/005_market_chat.sql)
// → 여기서는 그냥 select 해도, 내가 참여한 방·메시지만 돌아와요.
import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/lib/products";

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ChatRoom = {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  product: { id: string; title: string; price: number; status: ProductStatus; images: string[] } | null;
  seller: { nickname: string } | null;
  buyer: { nickname: string } | null;
};

// 판매자·구매자 둘 다 market_profiles 를 가리켜서, 어느 외래키로 따라갈지 이름(!...)으로 정해 줘요.
const ROOM_COLUMNS = `
  id, product_id, seller_id, buyer_id, last_message, last_message_at, created_at,
  product:market_products(id, title, price, status, images),
  seller:market_profiles!market_chat_rooms_seller_id_fkey(nickname),
  buyer:market_profiles!market_chat_rooms_buyer_id_fkey(nickname)
`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 내 채팅 목록 (최근에 대화한 방부터)
export async function getMyChatRooms(): Promise<ChatRoom[]> {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_chat_rooms")
    .select(ROOM_COLUMNS)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`채팅 목록을 불러오지 못했어요: ${error.message}`);
  return (data ?? []) as unknown as ChatRoom[];
}

// 채팅방 하나 (내가 참여한 방이 아니면 RLS 때문에 null)
export async function getChatRoom(roomId: string): Promise<ChatRoom | null> {
  if (!UUID_RE.test(roomId)) return null;
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_chat_rooms")
    .select(ROOM_COLUMNS)
    .eq("id", roomId)
    .maybeSingle();

  if (error) throw new Error(`채팅방을 불러오지 못했어요: ${error.message}`);
  return data as unknown as ChatRoom | null;
}

// 채팅방의 메시지 (오래된 것부터, 최근 200개)
export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_chat_messages")
    .select("id, room_id, sender_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`메시지를 불러오지 못했어요: ${error.message}`);
  // 최근 200개를 가져온 뒤 화면에는 오래된 것 → 새것 순서로 보여줘요
  return (data ?? []).reverse();
}

// 이 물건에 대한 채팅방 수 (판매자가 상세 화면에서 볼 숫자)
export async function countChatRoomsForProduct(productId: string): Promise<number> {
  await connection();
  const supabase = await createClient();
  const { count } = await supabase
    .from("market_chat_rooms")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  return count ?? 0;
}
