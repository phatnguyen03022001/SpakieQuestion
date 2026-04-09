"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getPusherClient } from "@/lib/client";
import { MessageSquare, Loader2, User as UserIcon, Radio, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHeartbeat } from "../../hooks/useHeartbeat";

interface User {
  _id: string;
  username: string;
  isAdmin: boolean;
}

interface Room {
  roomId: string;
  otherUser: User;
  lastMessage?: {
    content: string;
    createdAt: string;
    userId: string;
  };
  unreadCount?: number;
}

export function ConversationList({
  currentUserId,
  onSelectRoom,
  selectedRoomId,
}: {
  currentUserId: string;
  onSelectRoom: (roomId: string, otherUser: any) => void;
  selectedRoomId?: string;
}) {
  useHeartbeat();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const isFetchingRef = useRef(false);

  const fetchRooms = useCallback(async (pageToLoad: number, isLoadMore = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/rooms?page=${pageToLoad}&limit=20`);
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      const validRooms = (data.rooms || []).filter((r: Room) => !r.otherUser?.isAdmin);

      setRooms((prev) => (isLoadMore ? [...prev, ...validRooms] : validRooms));
      setHasMore(data.hasMore || false);
      setPage(pageToLoad);
    } catch (err) {
      console.error("Fetch rooms error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchRooms(1, false);

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`user-${currentUserId}`);

    const handleRoomsUpdate = (data: any) => {
      if (!data.lastMessage) {
        setRooms((prevRooms) => prevRooms.filter((r) => r.roomId !== data.roomId));
        return;
      }
      if (data.otherUser?.isAdmin) return;

      setRooms((prevRooms) => {
        const roomIndex = prevRooms.findIndex((r) => r.roomId === data.roomId);
        const updatedRooms = [...prevRooms];

        // Xác định xem tin nhắn mới có phải của người dùng hiện tại không
        const isOwnMessage = data.lastMessage?.userId === currentUserId;

        if (roomIndex !== -1) {
          const targetRoom = { ...updatedRooms[roomIndex] };
          targetRoom.lastMessage = data.lastMessage;
          // Cập nhật unreadCount: nếu tin nhắn của người khác -> tăng, của mình -> reset về 0
          if (!isOwnMessage) {
            targetRoom.unreadCount = (targetRoom.unreadCount || 0) + 1;
          } else {
            targetRoom.unreadCount = 0;
          }
          updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(targetRoom);
        } else {
          if (data.otherUser) {
            const newRoom: Room = {
              roomId: data.roomId,
              otherUser: data.otherUser,
              lastMessage: data.lastMessage,
              unreadCount: isOwnMessage ? 0 : 1,
            };
            updatedRooms.unshift(newRoom);
          } else {
            // Fallback: fetch lại toàn bộ danh sách
            fetchRooms(1, false);
          }
        }
        return updatedRooms;
      });
    };

    const handleUnreadUpdate = (data: { roomId: string; unreadCount: number }) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => (room.roomId === data.roomId ? { ...room, unreadCount: data.unreadCount } : room)),
      );
    };

    channel.bind("rooms-updated", handleRoomsUpdate);
    channel.bind("unread-updated", handleUnreadUpdate);

    return () => {
      channel.unbind("rooms-updated", handleRoomsUpdate);
      channel.unbind("unread-updated", handleUnreadUpdate);
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId, fetchRooms]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchRooms(page + 1, true);
  };

  if (loading && page === 1) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-18 w-full animate-pulse bg-muted/40 rounded-2xl border border-border/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* 1. HEADER - Minimalist Terminal Style */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-border/5">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary/50" />
          <h2 className="text-[10px] font-black uppercase text-muted-foreground">Active Signals</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
          <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 mt-4">
        <div className="space-y-1 pb-4">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <MessageSquare className="w-6 h-6 mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest italic">No_Frequencies</p>
            </div>
          ) : (
            rooms.map((room) => {
              const isActive = selectedRoomId === room.roomId;
              const unread = room.unreadCount ?? 0;
              const lastTime = room.lastMessage?.createdAt
                ? new Date(room.lastMessage.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <button
                  key={room.roomId}
                  onClick={() => onSelectRoom(room.roomId, room.otherUser)}
                  className={cn(
                    "w-full text-left relative group p-3 rounded-2xl flex items-center gap-3 transition-all duration-300 border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-transparent hover:bg-muted/30 hover:border-border/10 active:scale-[0.98]",
                  )}>
                  {/* AVATAR - Flat design */}
                  <div
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border transition-all duration-500",
                      isActive
                        ? "bg-primary-foreground/10 border-primary-foreground/20"
                        : "bg-muted/50 border-border/40 group-hover:border-primary/20",
                    )}>
                    <UserIcon
                      className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground/60")}
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <p
                          className={cn(
                            "text-xs font-black truncate tracking-tight uppercase",
                            isActive ? "text-primary-foreground" : "text-foreground",
                          )}>
                          {room.otherUser?.username}
                        </p>

                        {unread > 0 && (
                          <span
                            className={cn(
                              "text-[8px] font-black px-1.5 py-0.5 rounded-md border",
                              isActive
                                ? "bg-primary-foreground text-primary border-primary-foreground"
                                : "bg-primary text-primary-foreground border-primary",
                            )}>
                            {unread}
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-[8px] font-bold opacity-40 tabular-nums shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground",
                        )}>
                        {lastTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          "text-[10px] font-medium truncate flex-1 opacity-60 italic tracking-tight",
                          isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}>
                        {room.lastMessage?.content || "Waiting for signal..."}
                      </p>
                    </div>
                  </div>

                  {/* INDICATOR - Minimalist line */}
                  {isActive && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary-foreground rounded-full" />
                  )}
                </button>
              );
            })
          )}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-4 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 hover:text-primary transition-colors flex items-center justify-center gap-2">
              {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : "--- SCAN_OLDER_LOGS ---"}
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
