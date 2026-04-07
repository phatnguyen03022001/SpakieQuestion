import { NextRequest, NextResponse } from "next/server";
import { connectDB, pusherServer } from "@/lib/server";
import Message from "@/models/Message";
import User from "@/models/User";
import { cookies } from "next/headers";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params; // 👈 Quan trọng: await params
  const message = await Message.findById(id);
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  // Chỉ chủ tin nhắn mới được xóa (admin không xóa)
  if (message.userId.toString() !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  message.deleted = true;
  message.deletedAt = new Date();
  await message.save();

  // Thông báo realtime cho cả phòng
  await pusherServer.trigger(`chat-${message.roomId}`, "message-deleted", {
    messageId: message._id.toString(),
  });

  return NextResponse.json({ success: true });
}
