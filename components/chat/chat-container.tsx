"use client";

import { useEffect, useRef } from "react";
import MessageItem from "./message-item";
import ChatInput from "./chat-input";
import { Loader2, ArrowUp } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";

interface ChatContainerProps {
  user: { _id: string; username: string; isAdmin: boolean };
  roomId: string;
  readOnly?: boolean;
}

export default function ChatContainer({ user, roomId, readOnly = false }: ChatContainerProps) {
  const { messages, loading, loadingMore, hasMore, loadMoreOlder } = useChat(user, roomId);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  const checkIfAtBottom = () => {
    if (!scrollViewportRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  const scrollToBottom = () => {
    if (!scrollViewportRef.current) return;
    scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
  };

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    const handleScroll = () => {
      isUserAtBottomRef.current = checkIfAtBottom();
    };
    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (prevMessagesLengthRef.current === 0 && messages.length > 0) {
      scrollToBottom();
    } else if (messages.length > prevMessagesLengthRef.current && isUserAtBottomRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, loading]);

  // Đánh dấu đã đọc: chỉ gọi nếu user là participant (có id trong roomId) và không phải readOnly
  useEffect(() => {
    if (!roomId || readOnly) return;
    const isParticipant = roomId.includes(user._id);
    if (!isParticipant) return;

    fetch("/api/messages/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });
  }, [roomId, user._id, readOnly]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    loadMoreOlder();
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div ref={scrollViewportRef} className="flex-1 overflow-auto w-full">
        <div className="p-4 flex flex-col gap-y-4">
          {hasMore && (
            <div className="flex justify-center py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-1 text-xs">
                {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUp className="w-3 h-3" />}
                {loadingMore ? "Đang tải..." : "Xem tin nhắn cũ"}
              </Button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem key={msg._id} message={msg} isMe={msg.userId === user._id} currentUser={user} />
            ))
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="shrink-0 border-t bg-white">
          <ChatInput roomId={roomId} />
        </div>
      )}
    </div>
  );
}
