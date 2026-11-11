// 브라우저에서 사진을 줄여서 Supabase Storage 에 바로 올리는 함수들
//
// 💡 왜 서버(Server Action)를 거치지 않고 브라우저에서 바로 올리나요?
//   - Server Action 으로 보낼 수 있는 크기는 기본 1MB, Vercel 도 요청 하나에 4.5MB 까지예요.
//     휴대폰 사진은 한 장에 3~10MB 라서 여러 장을 서버로 보내면 막혀요.
//   - 그래서 브라우저 → Storage 로 직접 올리고, 판매글에는 "파일 경로"만 저장해요.
//   - 아무나 올리지 못하게 Storage 정책(RLS)이 "내 폴더(회원id/...)"에만 올리도록 막아줘요.
import { createClient } from "@/lib/supabase/client";
import { IMAGE_BUCKET } from "@/lib/products";

const MAX_SIDE = 1600; // 긴 쪽을 최대 1600px 로 줄여요 (화면에 보기엔 충분해요)
const QUALITY = 0.85;

// 사진을 줄이고 WebP(가볍고 화질 좋은 이미지 형식)로 바꿔요. 라이브러리 없이 canvas 로 처리해요.
async function resizeToWebp(file: File): Promise<Blob> {
  // createImageBitmap: 파일을 그림으로 읽어요. 휴대폰 사진의 회전 정보(EXIF)도 반영돼요.
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("사진을 변환하지 못했어요."))),
      "image/webp",
      QUALITY,
    ),
  );
}

// 사진 한 장을 올리고, 저장된 경로("회원id/랜덤이름.webp")를 돌려줘요.
export async function uploadProductImage(file: File, userId: string): Promise<string> {
  let blob: Blob;
  try {
    blob = await resizeToWebp(file);
  } catch {
    throw new Error(`"${file.name}" 은(는) 열 수 없는 사진이에요. JPG·PNG 로 올려 주세요.`);
  }

  // crypto.randomUUID(): 겹치지 않는 랜덤 이름. 같은 이름 파일을 올려도 덮어쓰지 않아요.
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await createClient()
    .storage.from(IMAGE_BUCKET)
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });

  if (error) throw new Error("사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.");
  return path;
}

// 글에 붙이기 전에 빼 버린 사진은 저장소에서도 지워요 (실패해도 글쓰기에는 지장 없어요)
export async function removeUploadedImages(paths: string[]) {
  if (paths.length === 0) return;
  await createClient().storage.from(IMAGE_BUCKET).remove(paths);
}
