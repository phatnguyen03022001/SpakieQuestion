import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import Message from "@/models/Message";
import User from "@/models/User";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const adminId = cookieStore.get("auth_session")?.value;
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(adminId);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Phân trang
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    // Lấy tất cả roomId duy nhất (dùng distinct + index)
    const allRoomIds = await Message.distinct("roomId");
    // Sắp xếp để phân trang nhất quán
    allRoomIds.sort();
    const totalRooms = allRoomIds.length;
    const paginatedRoomIds = allRoomIds.slice(skip, skip + limit);
    const hasMore = skip + paginatedRoomIds.length < totalRooms;

    if (paginatedRoomIds.length === 0) {
      return NextResponse.json({ rooms: [], hasMore, nextPage: page + 1 });
    }

    // Parse participants từ mỗi roomId (dựa trên cấu trúc "userId1-userId2" hoặc "room-userId")
    const roomData = paginatedRoomIds.map((roomId) => {
      const parts = roomId.split("-");
      const userIds = parts.filter(
        (
          part: string | Uint8Array<ArrayBufferLike> | mongoose.mongo.BSON.ObjectId | mongoose.mongo.BSON.ObjectIdLike,
        ) => part !== "room" && part !== "" && mongoose.Types.ObjectId.isValid(part),
      );
      return { roomId, userIds };
    });

    const allUserIds = roomData.flatMap((room) => room.userIds);
    const uniqueUserIds = [...new Set(allUserIds)];

    const usersMap = new Map();
    if (uniqueUserIds.length > 0) {
      const users = await User.find({ _id: { $in: uniqueUserIds } }).select("username");
      users.forEach((user) => usersMap.set(user._id.toString(), { _id: user._id, username: user.username }));
    }

    const result = roomData
      .map((room) => ({
        roomId: room.roomId,
        participants: room.userIds.map((id: any) => usersMap.get(id)).filter(Boolean),
      }))
      .filter((room) => room.participants.length > 0);

    return NextResponse.json({ rooms: result, hasMore, nextPage: page + 1 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
