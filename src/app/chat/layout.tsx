// /chat 아래 화면(채팅 목록·채팅방)의 공통 틀
import { Header } from "@/components/Header";

export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-6 sm:px-6">{children}</main>
    </>
  );
}
