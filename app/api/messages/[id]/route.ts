import { NextRequest, NextResponse } from "next/server";
import { connectDB, pusherServer } from "@/lib/server";
import Message from "@/models/Message";
import User from "@/models/User";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { z } from "zod";
import { getParticipantsFromRoomId } from "@/lib/utils";

// Schema validate params (chỉ cần id)
const paramsSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid message id format",
  }),
});

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  // 1. Xác thực người dùng
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Validate params.id
  const { id: rawId } = await params;
  const parseResult = paramsSchema.safeParse({ id: rawId });
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
  }
  const { id } = parseResult.data;

  // 3. Tìm tin nhắn
  const message = await Message.findById(id);
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // 4. Kiểm tra quyền: chủ tin nhắn hoặc admin
  const isOwner = message.userId.toString() === userId;
  const isAdmin = user.isAdmin;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5. Soft delete
  message.deleted = true;
  message.deletedAt = new Date();
  await message.save();

  // 6. Thông báo realtime trong phòng chat
  await pusherServer.trigger(`chat-${message.roomId}`, "message-deleted", {
    messageId: message._id.toString(),
  });

  // 7. Kiểm tra xem tin nhắn vừa xóa có phải là tin nhắn mới nhất của phòng không
  const lastMessage = await Message.findOne({ roomId: message.roomId }).sort({ createdAt: -1 }).limit(1);

  if (lastMessage && lastMessage._id.toString() === id) {
    // Tìm tin nhắn cũ hơn gần nhất (nếu có) để làm lastMessage mới
    const newLastMessage = await Message.findOne({
      roomId: message.roomId,
      _id: { $ne: id },
    })
      .sort({ createdAt: -1 })
      .limit(1);

    // Lấy danh sách participants của phòng
    const participants = getParticipantsFromRoomId(message.roomId);
    if (participants.length > 0) {
      // Chuẩn bị dữ liệu gửi đi (có thể lấy thêm thông tin user nếu cần)
      const updatePayload = {
        roomId: message.roomId,
        lastMessage: newLastMessage
          ? {
              _id: newLastMessage._id,
              text: newLastMessage.text,
              imageUrl: newLastMessage.imageUrl,
              createdAt: newLastMessage.createdAt,
              userId: newLastMessage.userId,
            }
          : null, // Không còn tin nhắn nào trong phòng
        // otherUser sẽ được client tự xử lý dựa trên roomId và currentUserId
      };

      // Trigger cập nhật danh sách phòng cho từng participant
      await Promise.all(participants.map((pid) => pusherServer.trigger(`user-${pid}`, "rooms-updated", updatePayload)));
    }
  }

  return NextResponse.json({ success: true });
}
