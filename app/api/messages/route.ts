// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { text, user, imageUrl } = body;

    const newMessage = await Message.create({ text, user, imageUrl });

    // Bắn tin qua Pusher
    await pusherServer.trigger("chat-channel", "new-message", newMessage);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi gửi tin nhắn" }, { status: 500 });
  }
}

export async function GET() {
  await connectToDatabase();
  const messages = await Message.find().sort({ createdAt: 1 });
  return NextResponse.json(messages);
}
