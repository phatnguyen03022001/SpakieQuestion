import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import User from "@/models/User";
import mongoose from "mongoose"; // Thêm dòng này

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const adminId = req.nextUrl.searchParams.get("adminId");

    // Kiểm tra adminId có tồn tại và có đúng định dạng ObjectId không
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(adminId);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Lấy danh sách user, sắp xếp người mới nhất lên đầu
    const users = await User.find({ isAdmin: false }).select("-password").sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
