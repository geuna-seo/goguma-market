// 판매글을 DB에서 읽어오는 함수 (서버 전용)
import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products";

// select 에 "seller:market_profiles(nickname)" 처럼 쓰면
// seller_id 외래키를 따라가서 판매자 닉네임까지 한 번에 가져와요 (SQL 의 JOIN 과 비슷).
const PRODUCT_COLUMNS =
  "id, seller_id, title, description, category, price, status, created_at, updated_at, seller:market_profiles(nickname)";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 최신 글부터 목록 가져오기
export async function getProducts(): Promise<Product[]> {
  // 요청마다 새로 읽어야 하는 데이터라서 미리 렌더링하지 않도록 표시해요 (src/lib/auth.ts 참고)
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`판매글 목록을 불러오지 못했어요: ${error.message}`);
  return (data ?? []) as unknown as Product[];
}

// 글 하나 가져오기. 없으면 null
// 상세 페이지에서 제목(metadata)과 본문이 같은 글을 읽으므로 cache 로 한 번만 조회해요.
export const getProduct = cache(async (id: string): Promise<Product | null> => {
  // 주소창에 아무 값이나 넣을 수 있으니, uuid 모양이 아니면 DB에 묻지 않고 바로 "없음"
  if (!UUID_RE.test(id)) return null;

  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`판매글을 불러오지 못했어요: ${error.message}`);
  return data as unknown as Product | null;
});
