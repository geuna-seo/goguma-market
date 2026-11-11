// notFound() 를 부르면 보이는 화면 (없는 글이거나 이미 삭제된 글)
import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-6xl">🥔</p>
      <h1 className="mt-4 text-2xl font-extrabold">판매글을 찾을 수 없어요</h1>
      <p className="mt-2 text-muted">삭제됐거나 주소가 잘못된 글이에요.</p>
      <Link
        href="/products"
        className="mt-8 inline-block rounded-2xl bg-goguma px-6 py-3 font-bold text-on-goguma"
      >
        목록으로 가기
      </Link>
    </div>
  );
}
