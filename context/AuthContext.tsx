"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, password: string, confirmPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string, isAdmin = false) => {
    const endpoint = isAdmin ? "/api/admin/login" : "/api/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { user } = await res.json();
    setUser(user);
    router.push(user.isAdmin ? "/admin-secret-route" : "/");
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const register = async (username: string, password: string, confirmPassword: string) => {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, confirmPassword }),
    });
    if (!res.ok) throw new Error(await res.text());
    // Sau khi đăng ký, tự động đăng nhập
    await login(username, password, false);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
