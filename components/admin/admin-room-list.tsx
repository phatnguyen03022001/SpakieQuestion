"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Search, MessageSquareOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Participant {
  _id: string;
  username: string;
  isAdmin: boolean;
}

interface Room {
  roomId: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  updatedAt: string;
}

export function AdminRoomList({
  onSelectRoom,
  selectedRoomId,
}: {
  onSelectRoom: (roomId: string, participants: Participant[]) => void;
  selectedRoomId?: string;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchRooms = useCallback(async (pageToLoad: number, isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/admin/rooms?page=${pageToLoad}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch admin rooms");
      const data = await res.json();
      const fetchedRooms = data.rooms || [];

      setRooms((prev) => (isLoadMore ? [...prev, ...fetchedRooms] : fetchedRooms));
      setHasMore(data.hasMore || false);
      setPage(pageToLoad);
    } catch (error) {
      console.error("Fetch rooms error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms(1, false);
  }, [fetchRooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.participants.some((p) => p.username.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [rooms, searchQuery]);

  if (loading && page === 1) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Search Bar - Cố định ở trên */}
      <div className="p-4 border-b shrink-0 bg-background/50 backdrop-blur-sm">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-foreground transition-colors" />
          <Input
            placeholder="Tìm tên người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-border transition-all"
          />
        </div>
      </div>

      {/* Danh sách phòng - Đảm bảo có thể cuộn độc lập */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30">
            <MessageSquareOff className="h-8 w-8 mb-2 stroke-[1px]" />
            <p className="text-xs italic">Không tìm thấy hội thoại</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredRooms.map((room) => {
              const isActive = selectedRoomId === room.roomId;
              const otherUsers = room.participants
                .filter((p) => !p.isAdmin)
                .map((p) => p.username)
                .join(" + ");

              // Nếu phòng chỉ có toàn admin (hiếm), thì hiển thị admin đầu tiên
              const displayNames = otherUsers || room.participants[0]?.username;
              const lastUpdate = room.updatedAt ? new Date(room.updatedAt) : null;

              return (
                <button
                  key={room.roomId}
                  onClick={() => onSelectRoom(room.roomId, room.participants)}
                  className={cn(
                    "w-full text-left p-4 transition-all relative border-b border-border/40 last:border-0",
                    isActive ? "bg-muted shadow-[inset_3px_0_0_0_oklch(var(--primary))] " : "hover:bg-muted/30",
                  )}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0 rounded-lg border border-border/40">
                      <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground/70">
                        {displayNames?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={cn(
                            "text-sm font-semibold truncate",
                            isActive ? "text-foreground" : "text-foreground/80",
                          )}>
                          {displayNames}
                        </span>
                        {lastUpdate && !isNaN(lastUpdate.getTime()) && (
                          <span className="text-[10px] text-muted-foreground/60 font-medium">
                            {formatDistanceToNow(lastUpdate, { addSuffix: false, locale: vi })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground/40 whitespace-nowrap">
                          #{room.roomId.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Pagination - Hiển thị ngay cuối danh sách cuộn */}
            {hasMore && (
              <div className="p-4 border-t border-border/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchRooms(page + 1, true)}
                  disabled={loadingMore}
                  className="w-full text-[11px] h-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all uppercase tracking-widest font-bold">
                  {loadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : "Tải thêm"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
