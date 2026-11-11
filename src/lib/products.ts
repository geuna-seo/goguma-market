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

// 사진 기능이 생기기 전까지 카드에 대신 보여줄 이모지
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

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  // market_profiles 를 함께 가져온 값 (판매자 닉네임)
  seller: { nickname: string } | null;
};

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
