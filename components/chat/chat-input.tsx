"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X, Loader2, Eye } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/lib/utils";

const uploadImageDirect = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  if (!res.ok) {
    const error = await res.json();
    console.error("Cloudinary upload error:", error);
    throw new Error(error.error?.message || "Upload ảnh thất bại");
  }
  const data = await res.json();
  return data.secure_url;
};

export default function ChatInput({ roomId }: { roomId: string }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"normal" | "once">("normal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File quá lớn (Tối đa 10MB)");
      return;
    }
    let fileToPreview = selectedFile;
    if (selectedFile.size > 1024 * 1024) {
      fileToPreview = await compressImage(selectedFile);
    }
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
    if ((!text.trim() && !file) || uploading) return;

    setUploading(true);
    try {
      let imageUrl = null;
      if (file) {
        let fileToUpload = file;
        if (file.size > 1024 * 1024) {
          fileToUpload = await compressImage(file);
        }
        imageUrl = await uploadImageDirect(fileToUpload);
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, roomId, imageUrl, imageMode }),
      });

      if (res.ok) {
        setText("");
        removeFile();
        setImageMode("normal");
      } else {
        const error = await res.json();
        alert(error.error || "Gửi tin nhắn thất bại");
      }
    } catch (error: any) {
      console.error("Lỗi gửi tin nhắn:", error);
      alert(error.message || "Gửi tin nhắn thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col border-t bg-white w-full">
      {preview && (
        <div className="p-2 px-4 flex gap-2 bg-slate-50 border-b">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500 shadow-sm">
            <Image src={preview} alt="preview" fill className="object-cover" />
            <button
              onClick={removeFile}
              className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg hover:bg-red-600 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Đang đính kèm</p>
            <p className="text-xs text-slate-600 truncate max-w-[150px]">{file?.name}</p>
          </div>
        </div>
      )}

      <form onSubmit={send} className="flex flex-col gap-2 p-4">
        <div className="flex gap-2 items-center">
          <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-slate-400 hover:text-blue-600">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={file ? "Thêm chú thích cho ảnh..." : "Nhập tin nhắn..."}
            className="flex-1 focus-visible:ring-blue-500"
            disabled={uploading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={uploading || (!text.trim() && !file)}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {/* Tuỳ chọn chế độ ảnh (chỉ hiển thị khi có file) */}
        {file && (
          <div className="flex gap-4 items-center justify-end text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                value="normal"
                checked={imageMode === "normal"}
                onChange={() => setImageMode("normal")}
                className="w-3 h-3"
              />
              <span className="text-slate-600">Gửi luôn</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                value="once"
                checked={imageMode === "once"}
                onChange={() => setImageMode("once")}
                className="w-3 h-3"
              />
              <Eye className="w-3 h-3 text-slate-500" />
              <span className="text-slate-600">Xem một lần (5s)</span>
            </label>
          </div>
        )}
      </form>
    </div>
  );
}
