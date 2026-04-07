import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import Message from "@/models/Message";
import User from "@/models/User";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const adminId = cookieStore.get("auth_session")?.value;
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await User.findById(adminId);
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Lấy tất cả roomId có trong hệ thống
  const rooms = await Message.aggregate([{ $group: { _id: "$roomId" } }, { $project: { roomId: "$_id", _id: 0 } }]);

  const result = [];
  for (const { roomId } of rooms) {
    const parts = roomId.split("-");
    const userIds = parts.filter((id: string) => id !== "room" && mongoose.Types.ObjectId.isValid(id));
    const users = await User.find({ _id: { $in: userIds } }).select("username");
    result.push({
      roomId,
      participants: users.map((u) => ({ _id: u._id, username: u.username })),
    });
  }

  return NextResponse.json(result);
}
