"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Clock, ShieldAlert, Loader2, AlertTriangle, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnceImageModalProps {
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
  isAdminMode?: boolean;
}

export default function OnceImageModal({ messageId, isOpen, onClose, isAdminMode = false }: OnceImageModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && messageId) {
      const fetchOnceImage = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/messages/${messageId}/once-viewed`, {
            method: "POST",
          });

          if (!res.ok) throw new Error("Packet has been consumed or invalid");

          const data = await res.json();
          setImageUrl(data.imageUrl);

          if (!isAdminMode) {
            startCountdown();
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchOnceImage();
    }

    return () => cleanUp();
  }, [isOpen, messageId, isAdminMode]);

  const startCountdown = () => {
    setTimeLeft(5);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);

    timerRef.current = setTimeout(() => {
      handleAutoClose();
    }, 5000);
  };

  const cleanUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleAutoClose = () => {
    cleanUp();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-500"
      onContextMenu={(e) => e.preventDefault()}>
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
        {/* TOP CONTROLS */}
        <div className="absolute top-10 left-0 w-full px-8 flex justify-between items-center z-50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
              Protocol: One_Time_Stream
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/50 text-foreground active:scale-90 transition-all">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* STATUS INDICATOR */}
        <div className="mb-8 flex flex-col items-center gap-4 z-40">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">
                Decrypting Package...
              </span>
            </div>
          )}

          {!loading && !isAdminMode && timeLeft !== null && (
            <div
              className={cn(
                "flex items-center gap-3 px-6 py-2.5 rounded-2xl border-2 transition-all duration-300",
                timeLeft <= 2
                  ? "bg-destructive text-destructive-foreground border-destructive shadow-[0_0_20px_rgba(var(--destructive),0.3)]"
                  : "bg-foreground text-background border-foreground",
              )}>
              <Clock className={cn("w-4 h-4", timeLeft <= 2 && "animate-bounce")} />
              <span className="text-sm font-black tracking-[0.1em] tabular-nums uppercase">
                Auto-Destruct: {timeLeft}s
              </span>
            </div>
          )}

          {isAdminMode && !loading && (
            <div className="flex flex-col items-center gap-1.5 bg-muted/40 border border-border/50 px-5 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2 text-primary">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Administrator Bypass Active</span>
              </div>
              <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter text-center">
                System view: Media consumption is disabled
              </span>
            </div>
          )}
        </div>

        {/* MEDIA CONTAINER */}
        <div className="relative w-full aspect-square md:aspect-auto flex items-center justify-center overflow-hidden rounded-[3rem] bg-card border border-border/50 shadow-2xl group">
          {error ? (
            <div className="flex flex-col items-center gap-6 p-12 text-center max-w-sm">
              <div className="w-20 h-20 rounded-[2.5rem] bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-foreground uppercase tracking-widest leading-tight">
                  Data Expired or Invalid
                </p>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl h-12 px-8 border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted">
                Return to Node
              </Button>
            </div>
          ) : (
            imageUrl && (
              <div className="relative w-full h-full flex items-center justify-center p-2">
                <Image
                  src={imageUrl}
                  alt="Encrypted Stream"
                  width={1400}
                  height={1400}
                  className={cn(
                    "object-contain max-h-[60vh] md:max-h-[70vh] select-none transition-all duration-1000 ease-in-out pointer-events-none",
                    timeLeft === 0 ? "scale-150 blur-3xl opacity-0" : "scale-100 blur-0 opacity-100",
                  )}
                  unoptimized
                  draggable={false}
                />
                {/* Lớp phủ Grid bảo vệ */}
                <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_150%)]" />
                <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.03]" />
              </div>
            )
          )}
        </div>

        {/* SECURITY INFO FOOTER */}
        {!isAdminMode && !error && !loading && (
          <div className="mt-12 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <div className="flex items-center gap-3 text-muted-foreground/30">
              <EyeOff className="w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Quantum Privacy Shield Active</p>
            </div>
            <div className="h-1 w-1 rounded-full bg-primary animate-ping" />
          </div>
        )}
      </div>
    </div>
  );
}
