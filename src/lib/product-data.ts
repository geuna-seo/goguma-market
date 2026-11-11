// 판매글을 DB에서 읽어오는 함수 (서버 전용)
import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Product, SimilarProduct } from "@/lib/products";

// select 에 "seller:market_profiles(nickname)" 처럼 쓰면
// seller_id 외래키를 따라가서 판매자 닉네임까지 한 번에 가져와요 (SQL 의 JOIN 과 비슷).
const PRODUCT_COLUMNS =
  "id, seller_id, title, description, category, price, status, images, region, neighborhood, created_at, updated_at, seller:market_profiles(nickname)";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 최신 글부터 목록 가져오기. area 를 주면 그 동네 글만 가져와요.
export async function getProducts(area?: { region: string; neighborhood: string }): Promise<Product[]> {
  // 요청마다 새로 읽어야 하는 데이터라서 미리 렌더링하지 않도록 표시해요 (src/lib/auth.ts 참고)
  await connection();

  const supabase = await createClient();
  let query = supabase
    .from("market_products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  // 같은 이름의 동이 다른 구에도 있을 수 있어서(예: 신사동) region 까지 같이 비교해요
  if (area) query = query.eq("region", area.region).eq("neighborhood", area.neighborhood);

  const { data, error } = await query;
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

// ───── 비슷한 물건 추천 ─────
// 기준
//   1) 판매중(selling)인 글만, 지금 보는 글은 빼고
//   2) 같은 카테고리 → 먼저 보여줘요
//   3) 다른 카테고리라도 가격대가 비슷하면(1/3배 ~ 3배) 이어서 보여줘요
//   같은 그룹 안에서는 가격이 가까운 순서예요.
//
// 💡 지금은 글이 적어서 최신 100개를 가져와 JavaScript 로 순위를 매겨요.
//    글이 아주 많아지면 이 계산을 DB 함수(SQL)로 옮기는 게 좋아요.
const SIMILAR_LIMIT = 4;
const PRICE_RANGE = Math.log(3); // 가격 비율이 3배 이내면 "비슷한 가격대"

// 두 가격이 얼마나 먼지: 비율(로그)로 비교해요. 1만원↔2만원 과 10만원↔20만원 을 같은 거리로 보려고요.
// +1000 은 0원(나눔)끼리도 계산할 수 있게 더한 값이에요.
function priceDistance(a: number, b: number) {
  return Math.abs(Math.log((a + 1000) / (b + 1000)));
}

export async function getSimilarProducts(base: Product): Promise<SimilarProduct[]> {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_products")
    .select(PRODUCT_COLUMNS)
    .eq("status", "selling")
    .neq("id", base.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`추천 물건을 불러오지 못했어요: ${error.message}`);
  const candidates = (data ?? []) as unknown as Product[];

  const byCloserPrice = (a: Product, b: Product) =>
    priceDistance(a.price, base.price) - priceDistance(b.price, base.price);

  const sameCategory = candidates
    .filter((p) => p.category === base.category)
    .sort(byCloserPrice)
    .map((p) => ({ ...p, reason: "category" as const }));

  const similarPrice = candidates
    .filter((p) => p.category !== base.category && priceDistance(p.price, base.price) <= PRICE_RANGE)
    .sort(byCloserPrice)
    .map((p) => ({ ...p, reason: "price" as const }));

  return [...sameCategory, ...similarPrice].slice(0, SIMILAR_LIMIT);
}
