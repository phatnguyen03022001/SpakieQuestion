"use client";

import { useState, useEffect, useRef } from "react";
import { pusherClient } from "@/lib/pusher";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";

interface Message {
  _id?: string;
  text: string;
  user: string;
  createdAt?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username] = useState(`User_${Math.floor(Math.random() * 1000)}`); // Giả lập user
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Load tin nhắn cũ từ MongoDB
  useEffect(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data));

    // 2. Lắng nghe Pusher real-time
    const channel = pusherClient.subscribe("chat-room");
    channel.bind("new-message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      pusherClient.unsubscribe("chat-room");
    };
  }, []);

  // Cuộn xuống cuối khi có tin mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempInput = input;
    setInput("");

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: tempInput, user: username }),
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-primary">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            Live Chat
          </CardTitle>
          <p className="text-xs text-muted-foreground">Logged in as: {username}</p>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea ref={scrollRef} className="h-full p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.user === username ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.user === username ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                    <p className="font-bold text-[10px] mb-1 opacity-70">{msg.user}</p>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSend} className="flex w-full items-center space-x-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
