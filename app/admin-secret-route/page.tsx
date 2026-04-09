"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/use-chat";
import { redirect } from "next/navigation";
import { AdminRoomList } from "@/components/admin/admin-room-list";
import { AdminUserList } from "@/components/admin/admin-user-list";
import ChatContainer from "@/components/chat/chat-container";
import { Loader2, MessageSquare, ChevronLeft, Monitor, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Header from "../../components/layout/header";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("monitoring");

  const { messages, loading: chatLoading, loadMoreOlder, hasMore, setMessages } = useChat(user, selectedRoomId);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      redirect("/login");
    }
  }, [user, authLoading]);

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-5 h-5 text-muted-foreground/50" />
      </div>
    );
  }

  const handleSelectRoom = (roomId: string, participants: any[]) => {
    setSelectedRoomId(roomId);
    const other = participants.find((p) => p._id !== user._id) || participants[0];
    setTargetUser(other);
    setIsMobileChatOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col min-h-0 container mx-auto px-4 py-4 md:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Header Area: Chỉ báo Tab & Title */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">Hệ thống quản trị</h1>
              <p className="text-xs text-muted-foreground">
                {activeTab === "monitoring"
                  ? "Giám sát luồng dữ liệu thời gian thực"
                  : "Quản lý danh sách định danh người dùng"}
              </p>
            </div>

            <TabsList className="grid grid-cols-2 w-full sm:w-[300px] h-9 bg-muted/50 p-1 border">
              <TabsTrigger
                value="monitoring"
                className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Monitor className="w-3.5 h-3.5" />
                Giám sát
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="w-3.5 h-3.5" />
                Người dùng
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Nội dung chính */}
          <div className="flex-1 min-h-0 border rounded-xl bg-card/30 overflow-hidden relative shadow-sm">
            {/* ================= MONITORING PANEL ================= */}
            <TabsContent value="monitoring" className="h-full m-0 outline-none">
              <div className="flex h-full divide-x divide-border/40">
                {/* Side List */}
                <aside
                  className={cn(
                    "flex flex-col bg-background/50",
                    "w-full lg:w-[380px]",
                    isMobileChatOpen ? "hidden lg:flex" : "flex",
                  )}>
                  <AdminRoomList onSelectRoom={handleSelectRoom} selectedRoomId={selectedRoomId} />
                </aside>

                {/* Chat Monitor */}
                <section
                  className={cn(
                    "flex-1 flex flex-col bg-background min-h-0",
                    !isMobileChatOpen ? "hidden lg:flex" : "flex",
                  )}>
                  {selectedRoomId ? (
                    <>
                      <div className="h-14 px-4 border-b flex items-center justify-between shrink-0 bg-muted/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileChatOpen(false)}
                            className="lg:hidden h-8 w-8">
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold truncate leading-none mb-1">
                              {targetUser?.username}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground truncate leading-none">
                              #{selectedRoomId.slice(-8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">
                          LIVE VIEW
                        </Badge>
                      </div>

                      <div className="flex-1 min-h-0">
                        <ChatContainer
                          roomId={selectedRoomId}
                          targetUser={targetUser}
                          currentUser={user}
                          messages={messages}
                          setMessages={setMessages as any}
                          loadMoreOlder={loadMoreOlder}
                          hasMore={hasMore}
                          loading={chatLoading}
                          readOnly
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30">
                      <MessageSquare className="w-12 h-12 mb-3 stroke-[1px]" />
                      <p className="text-xs font-medium uppercase tracking-widest">Chọn hội thoại để bắt đầu</p>
                    </div>
                  )}
                </section>
              </div>
            </TabsContent>

            {/* ================= USERS PANEL ================= */}
            <TabsContent value="users" className="h-full m-0 outline-none overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <AdminUserList />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
