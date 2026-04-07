import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import Message from "@/models/Message";
import { cookies } from "next/headers";
import User from "../../../models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Lấy tất cả roomId có chứa userId (cả gửi và nhận)
  const rooms = await Message.aggregate([
    { $match: { roomId: { $regex: userId } } }, // 👈 sửa ở đây
    { $group: { _id: "$roomId" } },
    { $project: { roomId: "$_id", _id: 0 } },
  ]);
  const roomIds = rooms.map((r) => r.roomId);

  const result = [];
  for (const roomId of roomIds) {
    const parts = roomId.split("-");
    const otherUserId = parts.find((id: string) => id !== userId && id !== "room");
    if (otherUserId && mongoose.Types.ObjectId.isValid(otherUserId)) {
      const otherUser = await User.findById(otherUserId).select("username");
      result.push({
        roomId,
        otherUser: { _id: otherUserId, username: otherUser?.username || "Unknown" },
      });
    }
  }
  return NextResponse.json(result);
}
