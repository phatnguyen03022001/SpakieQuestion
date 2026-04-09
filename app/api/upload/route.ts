import { NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/server";
import { cookies } from "next/headers";
import User from "@/models/User";
import { connectDB } from "@/lib/server";

export async function POST(req: NextRequest) {
  // Xác thực người dùng
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadImageToCloudinary(buffer);

  return NextResponse.json({ url: imageUrl });
}
