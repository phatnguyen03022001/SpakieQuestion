import { NextRequest, NextResponse } from "next/server";
import { connectDB, pusherServer } from "@/lib/server";
import Message from "@/models/Message";
import User from "@/models/User";
import { cookies } from "next/headers";
import { isUserInRoom } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId } = body;
  if (!roomId || typeof roomId !== "string") {
    return NextResponse.json({ error: "Thiếu hoặc sai roomId" }, { status: 400 });
  }

  // Kiểm tra user có phải participant không (dùng helper)
  if (!isUserInRoom(roomId, userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Kiểm tra xem user có phải admin không
  const user = await User.findById(userId).select("isAdmin").lean();
  const isAdmin = user?.isAdmin || false;

  // Cập nhật seenBy cho tin nhắn của người khác
  const result = await Message.updateMany(
    {
      roomId,
      seenBy: { $ne: userId },
      userId: { $ne: userId },
    },
    { $addToSet: { seenBy: userId } },
  );

  // Chỉ trigger Pusher nếu có ít nhất một tin nhắn được cập nhật VÀ user không phải admin
  // Nếu user không phải admin, sau khi seen thành công, trigger event cập nhật unread
  if (result.modifiedCount > 0 && !isAdmin) {
    await pusherServer.trigger(`chat-${roomId}`, "messages-seen", { roomId, userId });

    // ✅ Gửi thêm event riêng cho user này để cập nhật unreadCount = 0
    await pusherServer.trigger(`user-${userId}`, "unread-updated", {
      roomId,
      unreadCount: 0,
    });
  }

  return NextResponse.json({ modified: result.modifiedCount });
}
