import { NextRequest, NextResponse } from "next/server";
import { connectDB, pusherServer } from "@/lib/server"; // 👈 thêm pusherServer
import User from "@/models/User";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionCookie.value;

    await connectDB();

    const user = await User.findByIdAndUpdate(userId, { lastActive: new Date() }, { new: true, runValidators: false });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Gửi sự kiện realtime cho admin
    await pusherServer.trigger("admin-global", "user-online", {
      userId: user._id.toString(),
      username: user.username,
      lastActive: user.lastActive,
    });

    return NextResponse.json({ success: true, lastActive: user.lastActive });
  } catch (error) {
    console.error("Heartbeat API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
