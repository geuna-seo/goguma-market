"use client";
// 채팅방의 메시지 목록 + 입력칸
//
// 💡 실시간(Realtime)은 이렇게 동작해요
//   1. 처음 메시지들은 서버가 읽어서 props(initialMessages)로 넘겨줘요.
//   2. 브라우저가 Supabase Realtime 에 "이 방(room_id)에 새 메시지가 생기면 알려줘"라고 구독해요.
//   3. 누군가 메시지를 보내면(DB에 insert) → Supabase 가 구독한 브라우저로 바로 보내줘요.
//   RLS 가 적용돼서, 이 방의 참여자에게만 메시지가 전달돼요.

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/chat-data";
import { sendMessage } from "../actions";

type Props = {
  roomId: string;
  myId: string;
  otherNickname: string;
  initialMessages: ChatMessage[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export function ChatRoom({ roomId, myId, otherNickname, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 같은 메시지가 두 번 들어오지 않게 (내가 보낸 메시지는 "보내기 결과"와 "실시간 알림" 둘 다로 와요)
  const addMessage = (m: ChatMessage) =>
    setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));

  // 실시간 구독: 화면에 들어오면 구독하고, 나가면 구독을 끊어요(cleanup)
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    // 개발 모드에서는 React 가 실수를 찾으려고 effect 를 "실행 → 정리 → 다시 실행" 해요.
    // 아래 구독은 await 뒤에 만들어져서, 정리(cleanup)가 먼저 끝나 버릴 수 있어요.
    // 그래서 "이미 정리됐는지" 표시해 두고, 정리됐으면 구독을 만들지 않아요.
    let cancelled = false;

    (async () => {
      // 로그인 토큰을 Realtime 에도 알려줘야 RLS 를 통과해서 메시지를 받을 수 있어요
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase
        .channel(`market-chat:${roomId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "market_chat_messages", filter: `room_id=eq.${roomId}` },
          (payload) => addMessage(payload.new as ChatMessage),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const body = text.trim();
    if (!body || pending) return;
    setError(undefined);
    startTransition(async () => {
      const result = await sendMessage(roomId, body);
      if (result.message) {
        addMessage(result.message);
        setText("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {otherNickname}님에게 첫 메시지를 보내 보세요 👋
          </p>
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === myId;
          const prev = messages[i - 1];
          // 날짜가 바뀌면 날짜 구분선을 보여줘요
          const newDay = !prev || formatDay(prev.created_at) !== formatDay(m.created_at);
          return (
            <div key={m.id}>
              {newDay && (
                <p className="py-3 text-center text-xs font-semibold text-muted">{formatDay(m.created_at)}</p>
              )}
              <div className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                <p
                  className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed ${
                    mine ? "rounded-br-md bg-goguma text-on-goguma" : "rounded-bl-md bg-surface-2"
                  }`}
                >
                  {m.body}
                </p>
                <span className="shrink-0 pb-0.5 text-[11px] text-muted">{formatTime(m.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력칸: Enter 로 보내기, Shift+Enter 로 줄바꿈 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-line p-3"
      >
        {error && (
          <p role="alert" className="mb-2 rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // 한글 입력 중(조합 중)에 Enter 를 누르면 마지막 글자가 두 번 보내지는 문제를 막아요
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="메시지 보내기"
            aria-label="메시지"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-surface-2 px-4 py-2.5 text-[15px] outline-none ring-goguma focus:ring-2"
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="h-11 shrink-0 rounded-2xl bg-goguma px-4 font-bold text-on-goguma transition disabled:opacity-50"
          >
            {pending ? "…" : "보내기"}
          </button>
        </div>
      </form>
    </>
  );
}
