import { NextResponse } from "next/server";
import { connectDB } from "@/lib/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ✅ Schema validate đăng ký
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(10, "Username must be at most 10 characters")
      .regex(/^(?=.*\d)[a-zA-Z0-9]+$/, "Username must contain at least one number"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(10, "Password must be at most 10 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  await connectDB();

  // 1. Parse JSON
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Validate
  const parseResult = registerSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
  }

  // normalize username
  const username = parseResult.data.username.toLowerCase();
  const password = parseResult.data.password;

  // 3. Check tồn tại
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return NextResponse.json({ error: "Username already exists" }, { status: 400 });
  }

  // 4. Hash + create
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashedPassword,
    isAdmin: false,
  });

  return NextResponse.json({
    user: {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
    },
  });
}
