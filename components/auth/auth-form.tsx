"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, User, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AuthForm({ isRegister = false }) {
  const { login, register, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(!isRegister);
  const [formData, setFormData] = useState({ username: "", password: "", confirmPassword: "" });

  const isPasswordMatch = useMemo(() => isLogin || formData.password === formData.confirmPassword, [formData, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      return toast.error("Vui lòng nhập đầy đủ thông tin");
    }

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
        toast.success("Đăng nhập thành công");
      } else {
        await register(formData.username, formData.password, formData.confirmPassword);
        toast.success("Tạo tài khoản thành công");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Thao tác thất bại");
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Tên đăng nhập</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              placeholder="username"
              className="pl-10 h-11 bg-muted/20 border-border/50 focus:bg-background transition-all"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              className="pl-10 h-11 bg-muted/20 border-border/50 focus:bg-background transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        {!isLogin && (
          <div className="space-y-2 animate-in fade-in zoom-in-95">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              type="password"
              className={cn(
                "h-11 bg-muted/20 border-border/50 focus:bg-background transition-all",
                !isPasswordMatch && formData.confirmPassword && "border-destructive ring-destructive/20",
              )}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
        )}

        <Button type="submit" disabled={authLoading || !isPasswordMatch} className="w-full h-11 mt-2 shadow-sm">
          {authLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
          <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full h-11 text-xs font-semibold hover:bg-muted"
        onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Bạn chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
      </Button>
    </div>
  );
}
