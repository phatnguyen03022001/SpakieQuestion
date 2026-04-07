"use client";

import Image from "next/image";
import { Trash2, X, ImageIcon, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function MessageItem({ message, isMe, currentUser }: { message: any; isMe: boolean; currentUser: any }) {
  const [deleting, setDeleting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageOpened, setImageOpened] = useState(false); // đã bấm xem ảnh once chưa
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // thời gian còn lại (giây)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const canDelete = isMe;
  const isOnceImage = message.imageMode === "once" && message.imageUrl;
  const isDeletedForUser = message.deleted && !currentUser?.isAdmin;
  const hasBeenSeen = !message.deleted && message.seenBy && message.seenBy.length > 0;

  // Kiểm tra nếu user đã từng xem ảnh once này trước đó (trong DB)
  const alreadyViewed = message.onceViewedBy?.includes(currentUser._id);

  // Cleanup timer khi component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleViewImage = async () => {
    if (!message.imageUrl) return;
    if (alreadyViewed) return; // đã xem trước đó rồi, không cho xem lại
    if (imageOpened) return;

    setImageOpened(true);
    setShowFullImage(true);
    setTimeLeft(5);

    // Bắt đầu đếm ngược
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Sau 5s, đóng modal và gọi API đánh dấu đã xem
    timerRef.current = setTimeout(async () => {
      setShowFullImage(false);
      setTimeLeft(null);
      // Gọi API để lưu lại rằng user này đã xem ảnh once
      try {
        await fetch(`/api/messages/${message._id}/once-viewed`, {
          method: "POST",
        });
      } catch (err) {
        console.error("Failed to mark once-viewed:", err);
      }
    }, 5000);
  };

  const handleCloseModal = () => {
    // Nếu modal bị đóng sớm (bấm X), vẫn coi như đã xem? Tuỳ chọn: vẫn đánh dấu và dừng timer.
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowFullImage(false);
    setTimeLeft(null);
    if (!alreadyViewed && imageOpened) {
      // Nếu đã mở nhưng chưa kịp gửi API thì gửi ngay
      fetch(`/api/messages/${message._id}/once-viewed`, { method: "POST" }).catch(console.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn thu hồi tin nhắn này?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/messages/${message._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch (error) {
      console.error(error);
      alert("Thu hồi tin nhắn thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    // Tin nhắn đã bị thu hồi
    if (message.deleted) {
      if (currentUser.isAdmin) {
        return (
          <>
            {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
            {message.imageUrl && (
              <div className="mt-2 relative min-w-[200px] h-48 rounded-lg overflow-hidden border border-red-300 opacity-70">
                <Image
                  src={message.imageUrl}
                  alt="Deleted image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </div>
            )}
            <span className="text-xs text-red-400 ml-2">(đã thu hồi)</span>
          </>
        );
      } else {
        return <p className="text-sm italic text-gray-400">Tin nhắn đã bị thu hồi</p>;
      }
    }

    // Tin nhắn chưa bị thu hồi
    return (
      <>
        {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
        {message.imageUrl && (
          <>
            {/* Nếu là ảnh once và user đã xem trước đó (hoặc đã hết hạn) thì không hiển thị gì */}
            {!currentUser.isAdmin && isOnceImage && (alreadyViewed || (imageOpened && timeLeft === 0)) && (
              <div className="mt-2 text-xs text-gray-400 italic">Ảnh đã hết hạn (xem một lần)</div>
            )}
            {/* Hiển thị nút xem ảnh nếu chưa xem (đối với once) hoặc ảnh normal, hoặc admin */}
            {(currentUser.isAdmin || !isOnceImage || (!alreadyViewed && !imageOpened)) && (
              <button
                onClick={handleViewImage}
                className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs font-medium">Xem ảnh</span>
              </button>
            )}
            {/* Nếu đang trong quá trình xem (đã mở modal nhưng chưa hết giờ) thì không hiển thị nút nữa */}
            {isOnceImage && !currentUser.isAdmin && imageOpened && timeLeft !== null && timeLeft > 0 && (
              <div className="mt-2 text-xs text-blue-500">Đang xem ảnh (còn {timeLeft}s)</div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <>
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4 group relative`}>
        <div
          className={`max-w-[70%] p-3 rounded-2xl ${isMe ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"}`}>
          {renderContent()}
          <div className="text-[10px] opacity-50 mt-1 flex items-center gap-1">
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isMe && !message.deleted && (
              <span className={hasBeenSeen ? "text-green-500" : "text-gray-400"}>{hasBeenSeen ? "✓✓" : "✓"}</span>
            )}
          </div>
        </div>

        {canDelete && !message.deleted && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Modal xem ảnh toàn màn hình */}
      {showFullImage && message.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={message.imageUrl} alt="Fullscreen" className="max-w-full max-h-full object-contain" />
            {/* Hiển thị đồng hồ đếm ngược nếu là ảnh once và không phải admin */}
            {!currentUser.isAdmin && isOnceImage && timeLeft !== null && timeLeft > 0 && (
              <div className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeLeft}s</span>
              </div>
            )}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
