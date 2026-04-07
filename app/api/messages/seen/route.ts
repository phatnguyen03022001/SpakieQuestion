import { NextRequest, NextResponse } from "next/server";
import { connectDB, pusherServer } from "@/lib/server";
import Message from "@/models/Message";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await req.json();
  if (!roomId) {
    return NextResponse.json({ error: "Thiếu roomId" }, { status: 400 });
  }

  // Kiểm tra user có phải là participant của room không (roomId chứa userId)
  if (!roomId.includes(userId)) {
    return NextResponse.json({ error: "Forbidden: not a participant" }, { status: 403 });
  }

  // Cập nhật seenBy cho tất cả tin nhắn trong room chưa có userId này
  const result = await Message.updateMany({ roomId, seenBy: { $ne: userId } }, { $addToSet: { seenBy: userId } });

  // Trigger sự kiện realtime để cập nhật UI cho người gửi
  await pusherServer.trigger(`chat-${roomId}`, "messages-seen", { roomId, userId });

  return NextResponse.json({ modified: result.modifiedCount });
}
