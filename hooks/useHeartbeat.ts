"use client";

import { useEffect, useRef } from "react";

/**
 * Hook gửi tín hiệu "nhịp đập" để cập nhật trạng thái online.
 * @param intervalMs - Khoảng thời gian giữa mỗi lần gửi (mặc định 30s)
 */
export function useHeartbeat(intervalMs: number = 30000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sendHeartbeat = async () => {
      // Chỉ gửi heartbeat nếu tab đang được mở (tránh gửi lén lút khi ẩn tab quá lâu)
      if (document.visibilityState !== "visible") return;

      try {
        await fetch("/api/users/heartbeat", {
          method: "POST",
          // Sử dụng keepalive để request vẫn hoàn thành nếu user đóng tab bất ngờ
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        // Im lặng khi lỗi để không làm phiền console của user
      }
    };

    // Gửi ngay lần đầu khi hook mounted
    sendHeartbeat();

    // Thiết lập vòng lặp
    intervalRef.current = setInterval(sendHeartbeat, intervalMs);

    // Dọn dẹp khi component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs]);
}
