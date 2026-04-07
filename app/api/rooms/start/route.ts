import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import User from "@/models/User";
import { getPrivateRoomId } from "@/lib/utils";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const roomId = getPrivateRoomId(userId, targetUserId);
  return NextResponse.json({ roomId, targetUser });
}
