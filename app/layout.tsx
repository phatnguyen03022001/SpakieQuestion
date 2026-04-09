import type { Metadata, Viewport } from "next"; // Thêm Viewport
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spackie System",
  description: "Secure Intelligence Chat System",
  // Hỗ trợ web app mode trên mobile
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Spackie",
  },
};

// Tối ưu hóa viewport cho thiết bị di động
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Quan trọng để xử lý tai thỏ/bottom bar di động
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} 
        min-h-screen bg-background text-foreground antialiased 
        selection:bg-primary/30 selection:text-primary 
        overflow-x-hidden`} // Ngăn chặn scroll ngang ngoài ý muốn trên mobile
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Thường Spackie sẽ đẹp nhất ở Dark Mode mặc định
          enableSystem
          disableTransitionOnChange>
          <AuthProvider>
            <main className="relative flex flex-col min-h-screen">{children}</main>

            <Toaster
              position="top-center" // Mobile nên để top-center để không bị bàn phím che
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
