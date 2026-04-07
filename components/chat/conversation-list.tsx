"use client";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export function ConversationList({
  userId,
  onSelectRoom,
}: {
  userId: string;
  onSelectRoom: (roomId: string, otherUser: any) => void;
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-2 text-sm">Đang tải...</div>;
  if (error) return <div className="p-2 text-sm text-red-500">Không thể tải danh sách trò chuyện</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 font-bold border-b">Tin nhắn</div>
      <div className="flex-1 overflow-auto">
        {rooms.length === 0 && <div className="p-2 text-gray-400 text-sm">Chưa có cuộc trò chuyện</div>}
        {rooms.map((room: any) => (
          <div
            key={room.roomId}
            onClick={() => onSelectRoom(room.roomId, room.otherUser)}
            className="p-2 hover:bg-gray-100 cursor-pointer border-b flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{room.otherUser?.username || "Unknown"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
