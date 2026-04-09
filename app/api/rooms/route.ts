import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import Message from "@/models/Message";
import { cookies } from "next/headers";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Escape userId để tránh lỗi regex
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const roomIdPattern = `(^|-)${escapedUserId}(-|$)`;

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);
  const skip = (page - 1) * limit;

  const rooms = await Message.aggregate([
    { $match: { roomId: { $regex: roomIdPattern, $options: "" } } },
    { $group: { _id: "$roomId", lastMessageAt: { $max: "$createdAt" } } },
    { $sort: { lastMessageAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { roomId: "$_id", _id: 0, lastMessageAt: 1 } },
  ]);

  const totalCountResult = await Message.aggregate([
    { $match: { roomId: { $regex: roomIdPattern, $options: "" } } },
    { $group: { _id: "$roomId" } },
    { $count: "total" },
  ]);
  const totalRooms = totalCountResult[0]?.total || 0;
  const hasMore = skip + rooms.length < totalRooms;

  const result = [];
  for (const room of rooms) {
    const { roomId, lastMessageAt } = room;
    const parts = roomId.split("-");
    // Tìm userId còn lại (khác userId hiện tại và khác "room")
    const otherUserId = parts.find((id: string) => id !== userId && id !== "room");

    // Nếu không tìm thấy otherUserId (ví dụ room chỉ có mình user) thì bỏ qua
    if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
      continue;
    }

    const otherUser = await User.findById(otherUserId).select("username isAdmin");

    // Nếu không tìm thấy user hoặc user đó là admin → bỏ qua (không hiển thị phòng này)
    if (!otherUser || otherUser.isAdmin) {
      continue;
    }

    const unreadCount = await Message.countDocuments({
      roomId: room.roomId,
      seenBy: { $ne: userId },
      userId: { $ne: userId },
    });

    // Chỉ thêm phòng nếu otherUser là user thường (non-admin)
    result.push({
      roomId,
      otherUser: { _id: otherUserId, username: otherUser.username },
      lastMessageAt,
      unreadCount,
    });
  }

  return NextResponse.json({ rooms: result, hasMore, nextPage: page + 1 });
}
