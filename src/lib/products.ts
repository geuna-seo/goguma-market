// 판매글(상품)에 관련된 타입·상수·포맷 함수
// 서버와 브라우저(폼) 양쪽에서 같이 쓰기 때문에 여기에는 DB 접근 코드를 넣지 않아요.
// (DB에서 읽는 함수는 src/lib/product-data.ts 에 있어요)

export const CATEGORIES = [
  "디지털기기",
  "가구/인테리어",
  "생활/주방",
  "의류/잡화",
  "뷰티/미용",
  "취미/게임/음반",
  "도서",
  "스포츠/레저",
  "유아동",
  "반려동물용품",
  "기타",
] as const;

// 사진이 없는 글의 카드에 대신 보여줄 이모지
const CATEGORY_EMOJI: Record<string, string> = {
  디지털기기: "📱",
  "가구/인테리어": "🛋️",
  "생활/주방": "🍳",
  "의류/잡화": "👕",
  "뷰티/미용": "💄",
  "취미/게임/음반": "🎮",
  도서: "📚",
  "스포츠/레저": "⚽",
  유아동: "🧸",
  반려동물용품: "🐾",
  기타: "📦",
};

export function categoryEmoji(category: string) {
  return CATEGORY_EMOJI[category] ?? "🍠";
}

// 판매 상태: DB에는 영어 값, 화면에는 한국어 이름
export const STATUS_LABELS = {
  selling: "판매중",
  reserved: "예약중",
  sold: "거래완료",
} as const;

export type ProductStatus = keyof typeof STATUS_LABELS;

export const TITLE_MAX = 40;
export const DESCRIPTION_MAX = 2000;
export const PRICE_MAX = 100_000_000; // 1억원

// ───── 사진 ─────
// 사진 파일은 Supabase Storage 의 이 버킷에 "회원id/랜덤이름.webp" 경로로 저장해요.
export const IMAGE_BUCKET = "market-product-images";
export const IMAGES_MAX = 10;

// 저장된 경로 → 브라우저에서 볼 수 있는 공개 주소
export function productImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

// "내 폴더에 있고, 우리가 만든 이름 모양(랜덤id.webp)인 파일"인지 확인
// → 남의 사진 경로를 몰래 끼워 넣지 못하게 서버에서 검사할 때 써요.
const IMAGE_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export function isOwnImagePath(path: string, userId: string) {
  const [folder, name, ...rest] = path.split("/");
  return folder === userId && rest.length === 0 && IMAGE_NAME_RE.test(name ?? "");
}

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  status: ProductStatus;
  // 사진 경로 목록. 첫 번째가 대표 사진 (없으면 빈 배열)
  images: string[];
  // 글을 쓸 때 판매자가 인증한 동네 (동네 인증 전에 쓴 글은 null)
  region: string | null;
  neighborhood: string | null;
  created_at: string;
  updated_at: string;
  // market_profiles 를 함께 가져온 값 (판매자 닉네임)
  seller: { nickname: string } | null;
};

// 상세 화면 아래 "비슷한 물건" 추천에 쓰는 타입
//   reason: 왜 추천됐는지 ("같은 카테고리" 또는 "비슷한 가격대")
export type SimilarProduct = Product & { reason: "category" | "price" };

// 가격 차이를 사람이 읽기 쉬운 말로: 지금 보는 물건(base)과 비교해서 다른 물건(other)이 얼마나 싼지/비싼지
export function priceCompare(base: number, other: number) {
  const diff = other - base;
  if (diff === 0) return { text: base === 0 ? "똑같이 나눔" : "같은 가격", tone: "same" as const };
  const amount = Math.abs(diff).toLocaleString("ko-KR");
  return diff < 0
    ? { text: `${amount}원 더 저렴해요`, tone: "cheaper" as const }
    : { text: `${amount}원 더 비싸요`, tone: "pricier" as const };
}

export function isProductStatus(value: string): value is ProductStatus {
  return value in STATUS_LABELS;
}

// 0원은 "나눔", 나머지는 "12,000원"
export function formatPrice(price: number) {
  return price === 0 ? "나눔 🧡" : `${price.toLocaleString("ko-KR")}원`;
}

// "방금 전", "3분 전", "2일 전" …
export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "방금 전";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}
