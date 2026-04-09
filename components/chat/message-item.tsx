"use client";

import Image from "next/image";
import { Trash2, X, ImageIcon, Clock, Check, CheckCheck, ShieldAlert, EyeOff, Loader2, Info, Lock } from "lucide-react";
import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------------- Types ---------------- */
interface User {
  _id: string;
  username: string;
  isAdmin: boolean;
}

interface Message {
  _id: string;
  userId: string;
  text?: string;
  imageUrl?: string | null;
  imageMode?: "normal" | "once";
  onceViewedBy?: string[];
  deleted?: boolean;
  seenBy?: string[];
  createdAt: string;
}

interface Props {
  message: Message;
  isMe: boolean;
  currentUser: User;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

function MessageItem({ message, isMe, currentUser, setMessages }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageOpened, setImageOpened] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isOnceImage = message.imageMode === "once" && !!message.imageUrl;
  const hasBeenSeen = !message.deleted && (message.seenBy?.length ?? 0) > 0;

  // Admin không xóa, chỉ chủ sở hữu xóa
  const canDelete = isMe && !currentUser.isAdmin;
  const canViewDirectly = isMe || currentUser.isAdmin;
  const alreadyViewed = !canViewDirectly && (message.onceViewedBy?.includes(currentUser._id) ?? false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* ---------------- Handlers ---------------- */
  const handleViewOnceImage = async () => {
    if (!message.imageUrl || alreadyViewed || imageOpened) return;
    setImageOpened(true);
    setShowFullImage(true);

    if (currentUser.isAdmin) return;

    setTimeLeft(5);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);

    timerRef.current = setTimeout(async () => {
      setShowFullImage(false);
      setTimeLeft(null);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === message._id ? { ...m, onceViewedBy: [...(m.onceViewedBy || []), currentUser._id] } : m,
        ),
      );
      await fetch(`/api/messages/${message._id}/once-viewed`, { method: "POST" }).catch();
    }, 5000);
  };

  const handleCloseModal = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowFullImage(false);
    setTimeLeft(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/messages/${message._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, deleted: true } : m)));
    } catch {
      console.error("Failed to revoke message");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- Sub-components ---------------- */
  const RenderContent = () => {
    if (message.deleted) {
      if (currentUser.isAdmin) {
        return (
          <div className="space-y-2 border-l-2 border-destructive/50 pl-3 py-1 bg-destructive/5 rounded-sm">
            <div className="flex items-center gap-2 text-[10px] font-medium text-destructive uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" /> Log: Revoked
            </div>
            {message.text && <p className="text-sm text-muted-foreground italic leading-relaxed">{message.text}</p>}
            {message.imageUrl && (
              <div className="relative w-24 h-16 rounded-md border border-destructive/20 grayscale opacity-40 overflow-hidden">
                <Image src={message.imageUrl} alt="Deleted" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 text-muted-foreground/60 py-0.5 select-none">
          <EyeOff className="w-3.5 h-3.5" />
          <p className="text-xs font-medium tracking-wide">Tin nhắn đã thu hồi</p>
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        {message.text && (
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap tracking-normal">{message.text}</p>
        )}

        {message.imageUrl && (
          <div className="pt-0.5">
            {!isOnceImage || canViewDirectly ? (
              /* ĐIỀU CHỈNH: Giới hạn kích thước ảnh preview */
              <div
                className={cn(
                  "relative overflow-hidden cursor-pointer group/img transition-all hover:ring-2 hover:ring-primary/20",
                  "rounded-lg border border-border bg-muted",
                  "w-full max-w-[200px] aspect-[4/3] sm:max-w-[240px]", // Ảnh nhỏ gọn lại ở đây
                )}
                onClick={() => setShowFullImage(true)}>
                <Image
                  src={message.imageUrl}
                  alt="Chat media"
                  fill // Dùng fill để ảnh lấp đầy khung cố định
                  className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                  unoptimized
                />

                {isOnceImage && (
                  <div className="absolute top-1.5 left-1.5 bg-background/90 backdrop-blur-sm text-[8px] font-bold px-1.5 py-0.5 rounded border border-border uppercase">
                    Xem một lần
                  </div>
                )}

                {/* Overlay kính lúp khi hover cho cảm giác chuyên nghiệp */}
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="mt-1">
                {alreadyViewed ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Ảnh đã hết hạn</span>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleViewOnceImage}
                    className="h-10 w-full max-w-[200px] rounded-lg gap-2 border border-primary/10 transition-all hover:bg-primary/5 active:scale-95">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">Xem ảnh bảo mật</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={cn("flex group relative w-full mb-3 items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
        <div
          className={cn(
            "relative p-3.5 px-4 transition-shadow max-w-[85%] sm:max-w-[70%]",
            isMe
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-none shadow-sm"
              : "bg-muted text-foreground rounded-2xl rounded-bl-none border border-border shadow-sm",
            message.deleted && "bg-transparent border-dashed border-border/50 shadow-none",
          )}>
          <RenderContent />

          <div className={cn("mt-1.5 flex items-center gap-1.5 opacity-60", isMe ? "justify-end" : "justify-start")}>
            <span className="text-[10px] font-medium tracking-tight">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {isMe && !message.deleted && (
              <div className="flex items-center">
                {hasBeenSeen ? (
                  <CheckCheck className="w-3 h-3 stroke-[2.5px]" />
                ) : (
                  <Check className="w-3 h-3 stroke-[2.5px]" />
                )}
              </div>
            )}
          </div>
        </div>

        {canDelete && !message.deleted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {showFullImage && message.imageUrl && (
        <div
          className="fixed inset-0 z-100 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
          onClick={handleCloseModal}>
          <div className="p-4 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseModal}
              className="h-10 w-10 rounded-full hover:bg-muted">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div
            className="flex-1 flex flex-col items-center justify-center p-4 gap-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="relative max-w-4xl w-full bg-card rounded-xl overflow-hidden shadow-2xl border border-border">
              <Image
                src={message.imageUrl}
                alt="Fullscreen"
                width={1200}
                height={1200}
                className={cn(
                  "object-contain max-h-[70vh] w-full transition-all duration-500",
                  timeLeft === 0 ? "blur-2xl opacity-0 scale-105" : "blur-0 opacity-100 scale-100",
                )}
                unoptimized
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              {!canViewDirectly && isOnceImage && timeLeft !== null && (
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm font-semibold text-xs transition-colors",
                    timeLeft <= 2
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-muted text-foreground",
                  )}>
                  <Clock className={cn("w-3.5 h-3.5", timeLeft <= 2 && "animate-pulse")} />
                  Ảnh tự xóa sau: {timeLeft}s
                </div>
              )}

              {currentUser.isAdmin && (
                <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full border border-border shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Chế độ giám sát (Admin)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(MessageItem);
