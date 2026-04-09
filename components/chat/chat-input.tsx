"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, Loader2, Eye } from "lucide-react";
import Image from "next/image";
import { compressImage, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const uploadImageViaApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload thất bại");
  const data = await res.json();
  return data.url;
};

export default function ChatInput({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"normal" | "once">("normal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = useMemo(() => !user?.isAdmin, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    let fileToPreview = selectedFile;
    if (selectedFile.size > 1 * 1024 * 1024) fileToPreview = await compressImage(selectedFile);
    setFile(fileToPreview);
    setPreview(URL.createObjectURL(fileToPreview));
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || (!text.trim() && !file) || uploading) return;
    setUploading(true);
    try {
      let imageUrl = null;
      if (file) imageUrl = await uploadImageViaApi(file);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), roomId, imageUrl, imageMode: file ? imageMode : "normal" }),
      });
      if (res.ok) {
        setText("");
        removeFile();
        setImageMode("normal");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (user?.isAdmin) return null; // Admin đã có thông báo Read-only từ Container

  return (
    <div className="w-full">
      <div className="relative bg-background border border-border/60 rounded-3xl transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
        {/* 1. Preview Ảnh (Dạng dính liền vào input để không bị lệch) */}
        {preview && (
          <div className="p-3 border-b border-border/40 flex items-center gap-4 bg-muted/20 rounded-t-3xl animate-in fade-in slide-in-from-bottom-2">
            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border">
              <Image src={preview} alt="preview" fill className="object-cover" />
              <button
                onClick={removeFile}
                className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={imageMode === "once" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setImageMode("normal")}
                className="h-7 text-[10px] uppercase font-bold rounded-lg gap-1.5">
                Mặc định
              </Button>
              <Button
                type="button"
                variant={imageMode === "once" ? "default" : "outline"}
                size="sm"
                onClick={() => setImageMode("once")}
                className="h-7 text-[10px] uppercase font-bold rounded-lg gap-1.5">
                <Eye className="w-3 h-3" />
                5s
              </Button>
            </div>
          </div>
        )}

        {/* 2. Form Nhập liệu */}
        <form onSubmit={send} className="flex items-center gap-2 p-2">
          <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 shrink-0 rounded-2xl text-muted-foreground hover:bg-muted">
            <Paperclip className="w-5 h-5" />
          </Button>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={file ? "Thêm ghi chú..." : "Nhập tin nhắn..."}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 py-2 text-[15px] placeholder:text-muted-foreground/40"
          />

          <Button
            type="submit"
            disabled={uploading || (!text.trim() && !file)}
            className={cn(
              "h-10 w-10 shrink-0 rounded-2xl transition-all",
              text.trim() || file ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground opacity-50",
            )}>
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
