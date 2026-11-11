"use server";
// 판매글 Server Actions: 등록(create) · 수정(update) · 삭제(delete)
// 읽기(read)는 src/lib/product-data.ts 에서 해요.
//
// ⚠️ Server Action 은 우리 화면을 거치지 않고 POST 요청으로 직접 호출될 수도 있어요.
//    그래서 "로그인했는지", "입력값이 올바른지"를 여기서 꼭 다시 확인해요.
//    "내 글인지"는 DB의 RLS 정책이 한 번 더 막아줘요 (supabase/migrations/002_market_products.sql).
//
// 📸 사진 파일은 브라우저가 Storage 에 직접 올려요 (src/lib/upload-image.ts).
//    여기서는 폼에 담겨 온 "사진 경로"만 검사해서 판매글에 저장하고,
//    글에서 빠진 사진은 Storage 에서 지워요.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORIES,
  DESCRIPTION_MAX,
  IMAGE_BUCKET,
  IMAGES_MAX,
  PRICE_MAX,
  TITLE_MAX,
  isOwnImagePath,
  isProductStatus,
} from "@/lib/products";

export type ProductFormState = {
  error?: string;
  // 에러가 나도 입력한 내용이 지워지지 않게 다시 돌려줌
  values?: Record<string, string>;
};

// 폼 입력값을 꺼내서 검사하고, DB에 넣을 모양으로 바꿔요.
function parseProductForm(formData: FormData, userId: string) {
  const values = {
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    // "12,000" 처럼 쉼표를 넣어도 괜찮게 쉼표·공백은 지워요
    price: String(formData.get("price") ?? "").replace(/[,\s]/g, ""),
    description: String(formData.get("description") ?? "").trim(),
    status: String(formData.get("status") ?? "selling"),
  };
  // 같은 name 이 여러 개면 getAll 로 배열을 받아요 (사진 경로들, 순서 그대로)
  const images = formData.getAll("images").map(String);

  let error: string | undefined;
  const price = Number(values.price);

  if (images.length > IMAGES_MAX) {
    error = `사진은 최대 ${IMAGES_MAX}장까지 올릴 수 있어요.`;
  } else if (!images.every((path) => isOwnImagePath(path, userId))) {
    error = "사진 정보가 올바르지 않아요. 사진을 다시 올려 주세요.";
  } else if (values.title.length < 2 || values.title.length > TITLE_MAX) {
    error = `제목은 2~${TITLE_MAX}자로 적어 주세요.`;
  } else if (!(CATEGORIES as readonly string[]).includes(values.category)) {
    error = "카테고리를 골라 주세요.";
  } else if (values.price === "" || !Number.isInteger(price) || price < 0) {
    error = "가격은 0 이상의 숫자로 적어 주세요. (나눔은 0원)";
  } else if (price > PRICE_MAX) {
    error = "가격은 1억원까지만 적을 수 있어요.";
  } else if (values.description.length > DESCRIPTION_MAX) {
    error = `설명은 ${DESCRIPTION_MAX.toLocaleString()}자까지 쓸 수 있어요.`;
  } else if (!isProductStatus(values.status)) {
    error = "판매 상태를 다시 골라 주세요.";
  }

  return {
    error,
    values,
    data: {
      title: values.title,
      category: values.category,
      price,
      description: values.description,
      images,
    },
  };
}

// 로그인한 사용자의 Supabase 클라이언트와 회원 id. 로그인 안 했으면 로그인 화면으로 보내요.
async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Storage 에서 사진 파일 지우기. 실패해도 글 저장은 이미 끝났으니 에러를 내지 않고 넘어가요.
async function removeImageFiles(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  if (error) console.error("사진 파일 삭제 실패:", error.message);
}

// ─────────────── 등록 (Create) ───────────────
export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { supabase, userId } = await requireUser();
  const { error, values, data } = parseProductForm(formData, userId);
  if (error) return { error, values };

  // seller_id 는 DB 기본값(auth.uid())이 채워줘요. 그래서 남의 이름으로 글을 쓸 수 없어요.
  const { data: created, error: dbError } = await supabase
    .from("market_products")
    .insert(data)
    .select("id")
    .single();

  if (dbError || !created) {
    // 42501 = 권한 없음. 우리 DB에서는 "동네 인증을 안 해서 RLS 정책에 막힌 경우"예요.
    if (dbError?.code === "42501") {
      return { error: "동네 인증을 먼저 해 주세요. (헤더의 📍 버튼)", values };
    }
    return { error: "글을 올리지 못했어요. 잠시 후 다시 시도해 주세요.", values };
  }

  // revalidatePath: 이 주소들의 화면을 새 데이터로 다시 그리도록 Next 에 알려줘요.
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/products/${created.id}`);
}

// ─────────────── 수정 (Update) ───────────────
// id 는 화면에서 .bind(null, id) 로 미리 넣어줘요. (폼 숨김칸보다 깔끔해요)
export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { supabase, userId } = await requireUser();
  const { error, values, data } = parseProductForm(formData, userId);
  if (error) return { error, values };

  // 수정 전 사진 목록 (빠진 사진을 찾아서 지우려고)
  const { data: before } = await supabase
    .from("market_products")
    .select("images")
    .eq("id", id)
    .eq("seller_id", userId)
    .maybeSingle();
  if (!before) return { error: "내가 쓴 글만 수정할 수 있어요.", values };

  // RLS 때문에 내 글이 아니면 아무 행도 바뀌지 않아요 → 바뀐 행이 없으면 에러로 처리
  const { data: updated, error: dbError } = await supabase
    .from("market_products")
    .update({ ...data, status: values.status })
    .eq("id", id)
    .select("id");

  if (dbError) {
    return { error: "수정하지 못했어요. 잠시 후 다시 시도해 주세요.", values };
  }
  if (!updated || updated.length === 0) {
    return { error: "내가 쓴 글만 수정할 수 있어요.", values };
  }

  // 글은 잘 저장됐으니, 이번에 빠진 사진 파일을 정리해요
  const removed = (before.images as string[]).filter((p) => !data.images.includes(p));
  await removeImageFiles(supabase, removed);

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/");
  redirect(`/products/${id}`);
}

// ─────────────── 삭제 (Delete) ───────────────
export async function deleteProduct(id: string) {
  const { supabase } = await requireUser();

  // update 와 마찬가지로 RLS 가 "내 글만" 지울 수 있게 막아줘요.
  // .select("images"): 지운 행의 사진 목록을 돌려받아서 파일도 같이 지워요.
  const { data: deleted, error } = await supabase
    .from("market_products")
    .delete()
    .eq("id", id)
    .select("images");
  if (error) throw new Error("삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");

  await removeImageFiles(supabase, (deleted ?? []).flatMap((row) => row.images as string[]));

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}
