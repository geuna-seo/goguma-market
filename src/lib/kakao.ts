// 카카오 로컬 API: 위도·경도 → 행정동 이름 (서버 전용)
// 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide#coord-to-district
//
// 💡 왜 서버에서 부르나요?
//   REST API 키는 비밀 값이라 브라우저에 보내면 안 돼요. 그래서 NEXT_PUBLIC_ 이 안 붙은
//   환경변수(KAKAO_REST_API_KEY)에 두고, 서버(Server Action)에서만 써요.
import "server-only";

export type Area = {
  region: string; // "서울특별시 강남구"
  neighborhood: string; // "역삼1동"
};

type RegionDocument = {
  region_type: "H" | "B"; // H = 행정동, B = 법정동
  region_1depth_name: string; // 시·도
  region_2depth_name: string; // 시·군·구
  region_3depth_name: string; // 읍·면·동
};

export class KakaoError extends Error {}

export async function coordToArea(lat: number, lng: number): Promise<Area | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new KakaoError("KAKAO_REST_API_KEY 환경변수가 없어요.");

  // 카카오는 x = 경도(longitude), y = 위도(latitude) 순서예요. 헷갈리기 쉬워요!
  const url = new URL("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json");
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store", // 위치마다 결과가 다르니 저장(캐시)하지 않아요
  });
  if (!res.ok) throw new KakaoError(`카카오 API 응답 오류 (${res.status})`);

  const { documents } = (await res.json()) as { documents: RegionDocument[] };
  // 행정동(H)을 써요. 주민센터 기준의 동 이름이라 "우리 동네" 느낌에 더 가까워요.
  const doc = documents.find((d) => d.region_type === "H");
  if (!doc || !doc.region_3depth_name) return null;

  return {
    region: [doc.region_1depth_name, doc.region_2depth_name].filter(Boolean).join(" "),
    neighborhood: doc.region_3depth_name,
  };
}
