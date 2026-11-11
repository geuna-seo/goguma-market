import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // next/image 로 바깥 주소의 사진을 보여주려면, 허용할 주소를 미리 적어야 해요.
  // 우리 Supabase Storage 의 판매글 사진 버킷만 허용해요. (.env.local 의 주소를 읽어요)
  images: {
    remotePatterns: [
      new URL(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/market-product-images/**`,
      ),
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
