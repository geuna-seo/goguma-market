// /products 아래 모든 화면(목록·상세·글쓰기·수정)의 공통 틀: 위에 헤더, 아래에 내용
import { Header } from "@/components/Header";

export default function ProductsLayout({ children }: LayoutProps<"/products">) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6">{children}</main>
    </>
  );
}
