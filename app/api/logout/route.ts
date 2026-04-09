import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Xóa tất cả các cookie liên quan đến session
  cookieStore.delete("auth_session");

  // Nếu có thêm cookie nào khác (vd: refresh_token), cũng xóa tại đây
  // cookieStore.delete("refresh_token");

  return NextResponse.json({ success: true });
}
