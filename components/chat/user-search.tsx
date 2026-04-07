"use client";
import { useState } from "react";
import { Search, UserPlus } from "lucide-react";

interface UserSearchProps {
  onStartChat: (roomId: string, targetUser: any) => void;
  currentUserId: string;
}

export function UserSearch({ onStartChat, currentUserId }: UserSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${keyword}`);
      const data = await res.json();
      // Lọc bỏ chính user đang đăng nhập
      const filtered = data.filter((u: any) => u._id !== currentUserId);
      setResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (targetUser: any) => {
    const res = await fetch("/api/rooms/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetUser._id }),
    });
    const data = await res.json();
    onStartChat(data.roomId, data.targetUser);
  };

  return (
    <div className="p-2 border-b">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc ID..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border rounded"
        />
        <button onClick={search} className="p-1 bg-blue-500 text-white rounded">
          <Search className="w-4 h-4" />
        </button>
      </div>
      {loading && <p className="text-xs text-gray-400 mt-1">Đang tìm...</p>}
      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map((u: any) => (
            <div key={u._id} className="flex justify-between items-center text-sm">
              <span>{u.username}</span>
              <button onClick={() => startChat(u)} className="text-blue-500">
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {!loading && keyword && results.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">Không tìm thấy người dùng</p>
      )}
    </div>
  );
}
