// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Không làm gì liên quan đến database
  // Có thể giữ lại logic xác thực đơn giản nếu cần, nhưng không bắt buộc
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
