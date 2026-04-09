import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import Message from "@/models/Message";
import { cookies } from "next/headers";
import User from "../../../../../models/User";
import { getParticipantsFromRoomId } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;
  const message = await Message.findById(id);

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const roomParticipants = getParticipantsFromRoomId(message.roomId);
  const isParticipant = roomParticipants.includes(userId);
  const isSender = message.userId.toString() === userId;
  const isAdmin = user.isAdmin;

  if (!isSender && !isAdmin && !isParticipant) {
    return NextResponse.json({ error: "Forbidden: You are not in this conversation" }, { status: 403 });
  }

  // Nếu là admin, kiểm tra xem trong phòng có user thường không
  if (isAdmin) {
    const participantsInfo = await User.find({ _id: { $in: roomParticipants } })
      .select("isAdmin")
      .lean();
    const hasNonAdmin = participantsInfo.some((p) => !p.isAdmin);
    if (hasNonAdmin) {
      // Admin không được phép xem ảnh once trong phòng có user thường
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // NORMAL IMAGE
  if (message.imageMode !== "once") {
    return NextResponse.json({
      success: true,
      imageUrl: message.imageUrl,
    });
  }

  // ONCE IMAGE
  if (isSender) {
    return NextResponse.json({ error: "Sender cannot mark once-viewed" }, { status: 403 });
  }

  // Admin (chỉ ở phòng toàn admin) xem không bị consume
  if (isAdmin) {
    return NextResponse.json({
      success: true,
      imageUrl: message.imageUrl,
    });
  }

  if (message.onceViewedBy?.includes(userId)) {
    return NextResponse.json({ error: "Bạn đã xem ảnh này rồi" }, { status: 403 });
  }

  await Message.updateOne({ _id: id }, { $addToSet: { onceViewedBy: userId } });

  return NextResponse.json({
    success: true,
    imageUrl: message.imageUrl,
  });
}
