// 없는 채팅방이거나, 내가 참여하지 않은 방일 때
import Link from "next/link";

export default function ChatRoomNotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl">🔒</p>
      <h1 className="mt-4 text-2xl font-extrabold">채팅방을 찾을 수 없어요</h1>
      <p className="mt-2 text-muted">없는 방이거나 내가 참여한 방이 아니에요.</p>
      <Link href="/chat" className="mt-8 inline-block rounded-2xl bg-goguma px-6 py-3 font-bold text-on-goguma">
        채팅 목록으로
      </Link>
    </div>
  );
}
