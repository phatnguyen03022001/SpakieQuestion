"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "@/components/mode/mode-toggle";
import LogoutButton from "@/components/auth/logout-button";
import { User, ShieldCheck, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Branding: Tinh gọn và hiện đại */}
        <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center bg-foreground rounded-xl transition-transform group-hover:-rotate-3 duration-300">
            <span className="text-xl font-bold text-background select-none">S</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-lg font-bold tracking-tight text-foreground leading-none">
              Spackie<span className="text-primary">.</span>
            </span>
            <span className="text-[10px] font-medium text-muted-foreground/60 tracking-wider leading-none mt-1">
              Identity OS
            </span>
          </div>
        </Link>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-3 md:gap-6">
          {user ? (
            <div className="flex items-center gap-3 md:gap-5 animate-in fade-in slide-in-from-right-2 duration-500">
              {/* User Identity: Card-style cho Profile */}
              <div className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="hidden flex-col items-end text-right md:flex">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground tracking-tight">{user.username}</span>
                    {user.isAdmin && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    {user.isAdmin ? "Administrator" : "User"}
                  </span>
                </div>

                {/* Avatar: Bo tròn Soft-square (giống icon iOS) */}
                <div className="h-9 w-9 bg-muted rounded-xl border border-border/50 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/50 group-hover">
                  <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>

              <div className="h-6 w-[1px] bg-border/60 mx-1 hidden md:block" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="[&_button]:rounded-xl [&_button]:bg-transparent [&_button]:border-none">
                  <ModeToggle />
                </div>
                <LogoutButton
                  showText={false}
                  className="h-9 w-9 rounded-xl border-none bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Link href="/login">
                <button className="h-10 px-5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all">
                  Sign In
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
