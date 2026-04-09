"use client";

import { useState } from "react";
import { Search, Loader2, X, SendHorizontal, Fingerprint, Radar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserSearchProps {
  onStartChat: (roomId: string, targetUser: any) => void;
  currentUserId: string;
}

export function UserSearch({ onStartChat, currentUserId }: UserSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  const handleSearch = async () => {
    const query = keyword.trim();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      // Lọc bỏ chính mình và admin
      const filtered = data.filter((u: any) => u._id !== currentUserId && !u.isAdmin);
      setResults(filtered);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (targetUser: any) => {
    setStartingChatId(targetUser._id);
    try {
      const res = await fetch("/api/rooms/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUser._id }),
      });
      const data = await res.json();
      onStartChat(data.roomId, data.targetUser);
      setResults([]);
      setKeyword("");
    } catch (err) {
      console.error("Connection failed");
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-4">
      {/* Search Input Bar */}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          )}
        </div>

        <Input
          type="text"
          placeholder="Search by ID or Username..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            if (e.target.value === "") setResults([]);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-11 pl-10 pr-20 bg-muted/20 border-border/50 hover:bg-muted/40 focus:bg-background rounded-xl text-xs font-medium transition-all placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/30"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {keyword && (
            <button
              onClick={() => {
                setKeyword("");
                setResults([]);
              }}
              className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground/40 hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-px h-4 bg-border/50 mx-1" />
          <button
            onClick={handleSearch}
            disabled={!keyword.trim() || loading}
            className="text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-30 px-2 py-1">
            Scan
          </button>
        </div>
      </div>

      {/* Results Dropdown/List */}
      {results.length > 0 && (
        <div className="mt-1 overflow-hidden border border-border/50 rounded-2xl bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Detected Entities ({results.length})
            </span>
            <Radar className="w-3 h-3 text-primary/40 animate-pulse" />
          </div>

          <div className="max-h-80 overflow-y-auto overflow-x-hidden">
            {results.map((u) => (
              <button
                key={u._id}
                disabled={!!startingChatId}
                onClick={() => handleStartChat(u)}
                className="w-full group flex items-center justify-between p-4 hover:bg-primary/5 cursor-pointer transition-all border-b border-border/30 last:border-none text-left">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center group-hover:border-primary/50 transition-all">
                      <span className="text-xs font-black text-muted-foreground group-hover:text-primary">
                        {u.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-background rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                      {u.username}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/50 tabular-nums">
                      NODE_{u._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center shrink-0 ml-4">
                  {startingChatId === u._id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <SendHorizontal className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && keyword.trim() && results.length === 0 && (
        <div className="mt-1 p-8 text-center rounded-2xl bg-muted/10 border border-dashed border-border/50 animate-in fade-in duration-500">
          <div className="flex justify-center mb-3">
            <Fingerprint className="w-8 h-8 text-muted-foreground/10" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
            No signal detected in current sector
          </p>
        </div>
      )}
    </div>
  );
}
