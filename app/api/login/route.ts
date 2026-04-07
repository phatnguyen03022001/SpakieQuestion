import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import User from "@/models/User";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  await connectDB();

  const { username, password } = await req.json();

  const user = await User.findOne({ username });
  if (!user) return NextResponse.json({ error: "Sai tài khoản" }, { status: 401 });

  // So sánh text thuần theo ý muốn của bạn
  if (password !== user.password) {
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
  }

  const { password: _, ...safeUser } = user.toObject();

  // Tạo response và đính kèm Cookie
  const response = NextResponse.json({ user: safeUser });

  const cookieStore = await cookies();
  cookieStore.set("auth_session", user._id.toString(), {
    httpOnly: true, // Bảo mật: Client JS không đọc được
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // Hết hạn sau 7 ngày
    path: "/",
  });

  return response;
}
