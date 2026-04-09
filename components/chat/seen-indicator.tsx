"use client";

import { useMemo } from "react";
import { CheckCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeenIndicatorProps {
  seenBy?: string[];
  isMe: boolean;
  roomId: string;
  currentUserId: string;
}

export default function SeenIndicator({ seenBy = [], isMe, roomId, currentUserId }: SeenIndicatorProps) {
  const displaySeen = useMemo(() => {
    // Chỉ hiển thị trạng thái xác nhận cho các gói tin (tin nhắn) do chính mình gửi đi
    if (!isMe) return null;

    const participants = roomId.split("-");
    const otherUserId = participants.find((id) => id !== currentUserId);
    const hasOtherUserSeen = seenBy.includes(otherUserId || "");

    if (hasOtherUserSeen) {
      return (
        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-500">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Delivered & Read</span>
          <div className="relative flex items-center justify-center">
            {/* Double check với stroke dày để tạo cảm giác chắc chắn */}
            <CheckCheck className="w-3.5 h-3.5 text-primary stroke-[3px]" />
            {/* Hiệu ứng xung nhịp nhẹ (Pulse) thay vì chỉ đứng yên */}
            <div className="absolute inset-0 bg-primary/20 blur-[6px] rounded-full animate-pulse" />
          </div>
        </div>
      );
    }

    // Trạng thái chờ xác nhận từ phía Node nhận (Chưa xem)
    return (
      <div className="flex items-center gap-1.5 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Sent</span>
        <Check className="w-3 h-3 stroke-[3px]" />
      </div>
    );
  }, [seenBy, isMe, roomId, currentUserId]);

  if (!displaySeen) return null;

  return <div className="flex justify-end px-1 mt-0.5 select-none pointer-events-none">{displaySeen}</div>;
}
