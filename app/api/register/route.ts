import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await connectDB();

  const { username, password, confirmPassword } = await req.json();

  if (!username || !password || !confirmPassword)
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  if (password !== confirmPassword) return NextResponse.json({ error: "Password mismatch" }, { status: 400 });

  const exist = await User.findOne({ username });
  if (exist) return NextResponse.json({ error: "User tồn tại" }, { status: 400 });

  const user = await User.create({
    username,
    password,
    isAdmin: username === "admin",
  });

  const { password: _, ...safeUser } = user.toObject();

  return NextResponse.json({ user: safeUser }, { status: 201 });
}
