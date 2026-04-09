import { NextRequest, NextResponse } from "next/server";
import { connectDB, pusherServer } from "@/lib/server";
import User from "@/models/User";
import Message from "@/models/Message";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { getParticipantsFromRoomId } from "@/lib/utils";

/* =========================
   GET MESSAGES
========================= */
export async function GET(req: NextRequest) {
  await connectDB();

  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await User.findById(userId).lean();
  if (!viewer) {
    return NextResponse.json({ error: "User không tồn tại" }, { status: 404 });
  }

  const roomId = req.nextUrl.searchParams.get("roomId");
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "10", 10), 50);

  if (!roomId) {
    return NextResponse.json({ error: "Thiếu roomId" }, { status: 400 });
  }

  const participants = getParticipantsFromRoomId(roomId);
  const isOwnerRoom = roomId === `room-${viewer._id}`;
  const isPrivateRoom = participants.includes(viewer._id.toString());

  if (!viewer.isAdmin && !isOwnerRoom && !isPrivateRoom) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const queryFilter: Record<string, unknown> = { roomId };

  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    queryFilter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const messages = await Message.find(queryFilter).sort({ createdAt: -1 }).limit(limit).lean().exec();

  const processed = messages.map((m: any) => {
    const obj = { ...m };

    if (obj.deleted) {
      if (viewer.isAdmin) obj.isDeleted = true;
      else {
        obj.text = "[Tin nhắn đã bị gỡ]";
        obj.imageUrl = null;
        obj.isDeleted = true;
      }
    }
    // Không còn ẩn admin → giữ nguyên username, userId
    return obj;
  });

  const hasMore = messages.length === limit;
  const nextCursor = messages.length ? messages[messages.length - 1]._id.toString() : null;

  return NextResponse.json({
    messages: processed.reverse(),
    hasMore,
    nextCursor,
  });
}

/* =========================
   POST MESSAGE
========================= */
export async function POST(req: NextRequest) {
  await connectDB();

  const cookieStore = await cookies();
  const userIdFromCookie = cookieStore.get("auth_session")?.value;

  if (!userIdFromCookie) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const user = await User.findById(userIdFromCookie).lean();
  if (!user) {
    return NextResponse.json({ error: "User không tồn tại" }, { status: 404 });
  }

  const { text, roomId, imageUrl, imageMode } = await req.json();

  if (!text && !imageUrl) {
    return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });
  }

  if (!user.isAdmin && text?.trim().length > 160) {
    return NextResponse.json({ error: "Tin nhắn tối đa 160 ký tự" }, { status: 400 });
  }

  const finalRoomId = roomId || `room-${user._id}`;

  const participants = getParticipantsFromRoomId(finalRoomId);
  const isOwnerRoom = finalRoomId === `room-${user._id}`;
  const isPrivateRoom = participants.includes(user._id.toString());

  if (!user.isAdmin && !isOwnerRoom && !isPrivateRoom) {
    return NextResponse.json({ error: "Không có quyền gửi vào phòng này" }, { status: 403 });
  }

  // Kiểm tra: admin không được gửi tin vào phòng có user thường
  if (user.isAdmin) {
    const hasNonAdmin = participants.some(async (pid) => {
      const p = await User.findById(pid).lean();
      return p && !p.isAdmin;
    });
    // Vì hasNonAdmin là Promise, cần await. Cách đúng:
    const nonAdminExists = await Promise.all(
      participants.map(async (pid) => {
        const p = await User.findById(pid).lean();
        return p && !p.isAdmin;
      }),
    ).then((results) => results.some(Boolean));

    if (nonAdminExists) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const msg = await Message.create({
    roomId: finalRoomId,
    userId: user._id,
    username: user.username,
    isAdmin: user.isAdmin || false,
    text: text || "",
    imageUrl,
    imageMode: imageMode === "once" ? "once" : "normal",
  });

  const msgObj = msg.toObject();

  // Realtime: gửi tin nhắn đến phòng chat
  await pusherServer.trigger(`chat-${finalRoomId}`, "new-message", msgObj);

  // Cập nhật danh sách phòng cho từng participant
  const otherUserForUpdate = { _id: user._id, username: user.username };

  const userUpdates = participants.map((pid: string) =>
    pusherServer.trigger(`user-${pid}`, "rooms-updated", {
      roomId: finalRoomId,
      lastMessage: msgObj,
      otherUser: otherUserForUpdate,
    }),
  );

  // Admin dashboard: chỉ trigger nếu phòng không có admin nào
  const adminParticipants = await User.find({
    _id: { $in: participants },
    isAdmin: true,
  })
    .select("_id")
    .lean();
  const hasAdminInRoom = adminParticipants.length > 0;

  const adminUpdate = hasAdminInRoom
    ? Promise.resolve()
    : pusherServer.trigger("admin-global", "rooms-updated", {
        roomId: finalRoomId,
        lastMessage: msgObj,
        participants,
      });

  await Promise.all([...userUpdates, adminUpdate]);

  return NextResponse.json(msg, { status: 201 });
}
