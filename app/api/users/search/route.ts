import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  await connectDB();

  const keyword = req.nextUrl.searchParams.get("q") || "";

  // escape regex
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const users = await User.find({
    $or: [{ username: { $regex: `^${escaped}$`, $options: "i" } }, { _id: keyword.length === 24 ? keyword : null }],
    isAdmin: false,
  })
    .limit(10)
    .select("username _id");

  return NextResponse.json(users);
}
