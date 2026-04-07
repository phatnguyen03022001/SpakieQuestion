import { NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadImageToCloudinary(buffer);

  return NextResponse.json({ url: imageUrl });
}
