"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  showText?: boolean;
};

export default function LogoutButton({ className, showText = true }: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    window.location.href = "/";
  };

  if (isConfirming) {
    return (
      <div className={cn("flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200", className)}>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
          className="h-9 px-3 text-[11px] font-bold uppercase tracking-wider">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Xác nhận
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsConfirming(false)}
          className="h-9 w-9 rounded-md border border-border/50">
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setIsConfirming(true)}
      className={cn(
        "h-10 px-3 flex items-center gap-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all group",
        className,
      )}>
      <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {showText && <span className="text-sm font-medium">Đăng xuất</span>}
    </Button>
  );
}
