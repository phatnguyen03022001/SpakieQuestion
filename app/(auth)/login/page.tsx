"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldCheck, Lock, Fingerprint } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace(user.isAdmin ? "/admin-secret-route" : "/");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="h-dvh w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-black tracking-[0.3em] text-foreground uppercase">Verifying Session...</p>
      </div>
    );
  }

  return (
    <main className="h-dvh w-full flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* --- HIGH CONTRAST BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Lớp lưới sắc nét hơn, sử dụng trực tiếp màu border */}
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.6]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Hiệu ứng mờ dần (Vignette) để tập trung vào trung tâm */}
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_85%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-stretch">
        {/* Header Section: Chữ lớn, tương phản mạnh */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            {/* Vòng tròn trang trí quanh Icon */}
            <div className="absolute inset-0 rounded-full border border-primary/20 scale-150 animate-[ping_3s_infinite]" />
            <div className="relative w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.05)]">
              <Fingerprint className="text-background w-8 h-8 stroke-[1.5px]" />
            </div>
          </div>

          <h1 className="text-4xl font-black tracking-tighter text-foreground italic uppercase">
            Spackie<span className="text-primary not-italic">.</span>
          </h1>
          <div className="mt-2 h-px w-12 bg-primary mx-auto" />
          <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-[0.4em]">
            Encrypted Gateway
          </p>
        </div>

        {/* Auth Card: Border dày và đổ bóng sắc nét */}
        <div className="bg-card border-2 border-foreground p-8 md:p-10 rounded-none shadow-[12px_12px_0px_0px_var(--primary)] relative transition-all">
          <AuthForm />

          {/* Một nhãn nhỏ trang trí ở góc */}
          <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1 uppercase tracking-tighter">
            Secure v2
          </div>
        </div>

        {/* Footer: Badge dạng Terminal */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 py-2 px-6 border border-foreground/10 bg-muted/50 rounded-none">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">
              End-to-End Encryption : Active
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[8px] text-muted-foreground/50 font-mono">STATUS: 200 OK</span>
            <span className="text-[8px] text-muted-foreground/50 font-mono">NODE: SG-01</span>
          </div>
        </div>
      </div>
    </main>
  );
}
