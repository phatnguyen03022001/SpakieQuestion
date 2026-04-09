import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import User from "@/models/User";
import { getPrivateRoomId } from "@/lib/utils";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { z } from "zod";

// Schema validate body
const startRoomSchema = z.object({
  targetUserId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid targetUserId format",
  }),
});

export async function POST(req: NextRequest) {
  await connectDB();

  // 1. Xác thực người dùng
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = startRoomSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
  }
  const { targetUserId } = parseResult.data;

  // 3. Không cho phép tự chat với chính mình
  if (targetUserId === userId) {
    return NextResponse.json({ error: "Cannot start chat with yourself" }, { status: 400 });
  }

  // 4. Kiểm tra current user và target user tồn tại
  const currentUser = await User.findById(userId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 5. Chỉ cho phép chat nếu cả hai có cùng cấp độ admin
  //    - Nếu currentUser là admin và targetUser không phải admin -> chặn
  //    - Nếu currentUser không phải admin và targetUser là admin -> chặn
  if (currentUser.isAdmin !== targetUser.isAdmin) {
    // Giả vờ không tìm thấy user để ẩn sự tồn tại của admin
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 6. Tạo roomId
  const roomId = getPrivateRoomId(userId, targetUserId);

  return NextResponse.json({ roomId, targetUser });
}
