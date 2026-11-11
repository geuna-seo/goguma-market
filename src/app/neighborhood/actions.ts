"use server";
// 동네 인증 Server Action
// 브라우저가 알아낸 위치(위도·경도)를 받아서 → 카카오로 동 이름을 찾고 → 내 프로필에 저장해요.
//
// ⚠️ 한계: 웹에서는 위치 값을 브라우저가 보내 주기 때문에, 서버가 "진짜 그 자리에 있는지"까지는
//    완벽히 확인할 수 없어요. (당근마켓 앱도 휴대폰 GPS 를 믿는 방식이에요)
//    대신 정확도가 너무 낮은 위치는 받지 않고, 인증 시각은 DB 트리거가 직접 기록해요.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { coordToArea, type Area } from "@/lib/kakao";

export type VerifyResult = { area: Area; error?: never } | { error: string; area?: never };

// 정확도가 이보다 나쁘면(오차가 크면) 인증하지 않아요. 컴퓨터는 와이파이로 위치를 추정해서 오차가 커요.
const MAX_ACCURACY_M = 5000;

// 대략 대한민국 범위 (위도 33~39, 경도 124~132)
function isInKorea(lat: number, lng: number) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

export async function verifyNeighborhood(
  lat: number,
  lng: number,
  accuracy: number,
): Promise<VerifyResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const userId = data.claims.sub;

  // 1) 받은 값 검사 (Server Action 은 누구나 직접 호출할 수 있으니 꼭 확인해요)
  if (![lat, lng, accuracy].every(Number.isFinite)) {
    return { error: "위치 정보가 올바르지 않아요. 다시 시도해 주세요." };
  }
  if (!isInKorea(lat, lng)) {
    return { error: "대한민국 안에서만 동네 인증을 할 수 있어요." };
  }
  if (accuracy > MAX_ACCURACY_M) {
    return {
      error: `위치 오차가 너무 커요 (약 ${(accuracy / 1000).toFixed(1)}km). 휴대폰에서 GPS 를 켜고 다시 시도해 주세요.`,
    };
  }

  // 2) 좌표 → 동 이름
  let area: Area | null;
  try {
    area = await coordToArea(lat, lng);
  } catch (e) {
    console.error("카카오 동네 조회 실패:", e);
    return { error: "동네 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  if (!area) return { error: "이 위치의 동네를 찾지 못했어요. 조금 이동해서 다시 시도해 주세요." };

  // 3) 내 프로필에 저장 (인증 시각은 DB 트리거가 기록해요)
  const { data: saved, error } = await supabase
    .from("market_profiles")
    .update({ region: area.region, neighborhood: area.neighborhood })
    .eq("id", userId)
    .select("id");

  if (error || !saved || saved.length === 0) {
    return { error: "동네를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  // 헤더·목록 등 동네가 보이는 모든 화면을 새로 그리게 해요
  revalidatePath("/", "layout");
  return { area };
}
