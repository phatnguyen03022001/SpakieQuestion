# 📁 Hệ thống Component & API Mapping – Hoàn chỉnh (cập nhật theo cây thư mục)

## 1. Component hiện có & API mapping

### 1.1. Authentication & Layout

| Component            | Đường dẫn                                 | API sử dụng                                                                           | Mô tả                                                      |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `auth-form.tsx`      | `components/auth/auth-form.tsx`           | `POST /api/register`<br>`POST /api/login`<br>`POST /api/admin/login`<br>`GET /api/me` | Đăng ký, đăng nhập user thường / admin, lấy thông tin user |
| `logout-button.tsx`  | `components/auth/logout-button.tsx`       | `POST /api/logout`                                                                    | Nút đăng xuất, gọi API logout, xóa cookie                  |
| `mode-toggle.tsx`    | `components/mode/mode-toggle.tsx`         | không                                                                                 | Chuyển theme dark/light                                    |
| `theme-provider.tsx` | `components/providers/theme-provider.tsx` | không                                                                                 | Provider theme toàn cục                                    |
| `header.tsx`         | `components/layout/header.tsx`            | không (dùng `useAuth`, `logout-button`, `mode-toggle`)                                | Thanh header chung, hiển thị tên user & logout             |

---

### 1.2. Chat (dành cho user thường)

| Component               | Đường dẫn                               | API sử dụng                                                                                                                                       | Mô tả                                                  |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `chat-container.tsx`    | `components/chat/chat-container.tsx`    | `GET /api/messages` (phân trang)<br>Pusher `chat-{roomId}` (new-message, message-deleted, messages-seen)<br>`POST /api/messages/seen` (khi focus) | Quản lý tin nhắn, load lịch sử, realtime, gửi seen     |
| `conversation-list.tsx` | `components/chat/conversation-list.tsx` | `GET /api/rooms`<br>Pusher `user-{userId}` (rooms-updated)                                                                                        | Hiển thị danh sách phòng, cập nhật khi có tin nhắn mới |
| `chat-input.tsx`        | `components/chat/chat-input.tsx`        | `POST /api/messages` (text/image)<br>`POST /api/upload` (upload ảnh)                                                                              | Gửi tin nhắn, upload ảnh, hỗ trợ ảnh once/normal       |
| `message-item.tsx`      | `components/chat/message-item.tsx`      | `DELETE /api/messages/{id}` (xóa tin nhắn – chỉ chủ sở hữu hoặc admin)<br>Mở modal `once-image-modal` khi click ảnh once                          | Hiển thị từng tin nhắn, nút xóa, xử lý ảnh once        |
| `once-image-modal.tsx`  | `components/chat/once-image-modal.tsx`  | `POST /api/messages/{id}/once-viewed` (lấy ảnh, consume nếu user thường)                                                                          | Modal xem ảnh "một lần", gọi API đúng, hiển thị ảnh    |
| `seen-indicator.tsx`    | `components/chat/seen-indicator.tsx`    | Không gọi API trực tiếp – nhận dữ liệu seenBy từ message                                                                                          | Hiển thị dấu hiệu "đã xem" (avatar, chữ, icon)         |
| `user-search.tsx`       | `components/chat/user-search.tsx`       | `GET /api/users/search?q=...`<br>`POST /api/rooms/start`                                                                                          | Tìm kiếm user (không admin), bắt đầu phòng chat mới    |

---

### 1.3. Admin components

| Component             | Đường dẫn                              | API sử dụng                         | Mô tả                                   |
| --------------------- | -------------------------------------- | ----------------------------------- | --------------------------------------- |
| `admin-room-list.tsx` | `components/admin/admin-room-list.tsx` | `GET /api/admin/rooms` (phân trang) | Hiển thị tất cả phòng, kèm participants |
| `admin-user-list.tsx` | `components/admin/admin-user-list.tsx` | `GET /api/users` (phân trang)       | Hiển thị tất cả user (trừ mật khẩu)     |

> **Lưu ý:** Cả hai component này chỉ được dùng trong trang admin và yêu cầu người dùng có `isAdmin=true`.

---

### 1.4. Hooks

| Hook              | Đường dẫn               | API / Pusher sử dụng                                                  | Mô tả                                                 |
| ----------------- | ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| `use-chat.tsx`    | `hooks/use-chat.tsx`    | `GET /api/rooms`<br>`GET /api/messages`<br>Pusher: `chat-*`, `user-*` | Quản lý state chat toàn cục (rooms, messages, online) |
| `useHeartbeat.ts` | `hooks/useHeartbeat.ts` | `POST /api/users/heartbeat`                                           | Cập nhật `lastActive` mỗi 30 giây                     |

> ✅ Đã tạo API `POST /api/users/heartbeat`.

---

### 1.5. UI cơ bản (shadcn)

| Component         | Đường dẫn                       |
| ----------------- | ------------------------------- |
| `button.tsx`      | `components/ui/button.tsx`      |
| `card.tsx`        | `components/ui/card.tsx`        |
| `input.tsx`       | `components/ui/input.tsx`       |
| `scroll-area.tsx` | `components/ui/scroll-area.tsx` |

---

## 2. Các trang (pages) – nhiệm vụ import

| Trang            | Đường dẫn                         | Import các component / hook                                                          | Nhiệm vụ chính                                                                 |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Đăng nhập        | `app/(auth)/login/page.tsx`       | `AuthForm` (từ `components/auth/auth-form.tsx`)                                      | Hiển thị form đăng nhập (user hoặc admin), xử lý redirect sau login            |
| Đăng ký          | `app/(auth)/register/page.tsx`    | `AuthForm`                                                                           | Hiển thị form đăng ký user thường, gọi API register                            |
| Trang chủ (user) | `app/page.tsx`                    | `ChatContainer`, `ConversationList`, `UserSearch`, `Header` (tùy chọn), `ModeToggle` | Giao diện chat chính: danh sách phòng + khung chat + tìm kiếm                  |
| Admin dashboard  | `app/admin-secret-route/page.tsx` | `AdminRoomList`, `AdminUserList`, `Header`, `ModeToggle`                             | Hiển thị danh sách rooms và users cho admin, bảo vệ route bằng middleware/auth |
| Not found        | `app/not-found.tsx`               | không (hoặc tự do)                                                                   | Hiển thị trang 404                                                             |
| Loading (global) | `app/loading.tsx`                 | không (Next.js tự động dùng khi Suspense)                                            | Hiển thị spinner trong quá trình load route                                    |
| Error (global)   | `app/error.tsx`                   | `Button` từ UI                                                                       | Bắt lỗi toàn cục, cho phép thử lại                                             |
| Layout chính     | `app/layout.tsx`                  | `ThemeProvider`, `AuthProvider`                                                      | Cung cấp theme, auth context cho toàn bộ app                                   |

---

## 3. Component – nhiệm vụ import chi tiết

### 3.1. `auth-form.tsx`
- Import: `useAuth` (từ `context/AuthContext`), `useState`, `useRouter`.
- Gọi API: `POST /api/login`, `POST /api/register`, `POST /api/admin/login` tuỳ theo mode.
- Redirect sau thành công.

### 3.2. `logout-button.tsx`
- Import: `useAuth` (gọi `logout` method).
- Gọi API `POST /api/logout`.

### 3.3. `header.tsx`
- Import: `useAuth` (lấy `user`), `LogoutButton`, `ModeToggle`.
- Hiển thị tên user, nút logout, nút chuyển theme.

### 3.4. `chat-container.tsx`
- Import: `useChat` (từ `hooks/use-chat`), `ChatInput`, `MessageItem`, `SeenIndicator`, `ScrollArea`, `OnceImageModal`.
- Sử dụng Pusher client (`getPusherClient`) để subscribe `chat-{roomId}`.
- Gọi `GET /api/messages` khi chọn room, gửi seen khi focus.

### 3.5. `conversation-list.tsx`
- Import: `useChat`, `ScrollArea`, `formatDistanceToNow`.
- Lắng nghe Pusher event `rooms-updated` qua `user-{userId}`.
- Gọi `GET /api/rooms` khi mount.

### 3.6. `chat-input.tsx`
- Import: `useState`, `useChat` (để lấy `currentRoomId`), `Button`, `Input`.
- Gọi `POST /api/upload` (nếu có file), sau đó gọi `POST /api/messages`.

### 3.7. `message-item.tsx`
- Import: `useAuth`, `useChat` (để refresh messages), `OnceImageModal`, `formatRelativeTime`.
- Hiển thị text, image, nút xoá (nếu có quyền).
- Khi click ảnh once → mở modal.

### 3.8. `once-image-modal.tsx`
- Import: `useState`, `Dialog`.
- Gọi `POST /api/messages/{id}/once-viewed` khi mở modal.

### 3.9. `user-search.tsx`
- Import: `useState`, `useDebounce`, `Button`, `Input`, `ScrollArea`.
- Gọi `GET /api/users/search`, `POST /api/rooms/start`.

### 3.10. `admin-room-list.tsx` & `admin-user-list.tsx`
- Import: `useEffect`, `useState`, `Button`.
- Gọi `GET /api/admin/rooms`, `GET /api/users` (phân trang).

---

## 4. Các API đã có component đầy đủ

| API                                   | Component tương ứng    | Trạng thái   |
| ------------------------------------- | ---------------------- | ------------ |
| `POST /api/users/heartbeat`           | `useHeartbeat.ts`      | ✅ Đã tạo API |
| `GET /api/admin/rooms`                | `admin-room-list.tsx`  | ✅ Đủ         |
| `GET /api/users` (admin)              | `admin-user-list.tsx`  | ✅ Đủ         |
| `POST /api/messages/{id}/once-viewed` | `once-image-modal.tsx` | ✅ Đủ         |
| `POST /api/logout`                    | `logout-button.tsx`    | ✅ Đủ         |

---

## 5. Các file đã được tạo thêm

1. `context/AuthContext.tsx` – quản lý user, login/logout/register.  
2. `app/api/users/heartbeat/route.ts` – API cập nhật lastActive.  
3. `app/loading.tsx` – loading spinner toàn cục.  
4. `app/error.tsx` – error boundary toàn cục.  

---

## 6. Mô tả tổng quan hệ thống

### 6.1. Kiến trúc tổng thể

- **Next.js App Router** – sử dụng React Server Components kết hợp Client Components cho các phần cần realtime.
- **Xác thực** – cookie `auth_session` chứa `userId`, middleware kiểm tra và cập nhật `lastActive`.
- **Phân quyền** – hai loại: `user` (thường) và `admin`. Admin **hoàn toàn ẩn** với user thường (không tìm thấy, không chat được, hiển thị như không tồn tại).
- **Chat realtime** – dùng Pusher, mỗi phòng có channel `chat-{roomId}`, mỗi user có channel `user-{userId}` riêng để nhận cập nhật danh sách phòng.
- **Database** – MongoDB, models `User` và `Message`. Tin nhắn hỗ trợ text, ảnh bình thường, ảnh “once” (chỉ xem một lần).
- **Storage** – ảnh upload lên Cloudinary.
- **UI** – Tailwind CSS + shadcn/ui.

### 6.2. Luồng chính

1. **Người dùng đăng ký / đăng nhập** → nhận cookie, redirect đến `/` (user) hoặc `/admin-secret-route` (admin).
2. **User thường**:
   - Xem danh sách phòng (chỉ phòng với user thường khác).
   - Tìm kiếm user thường khác, bắt đầu chat.
   - Gửi tin nhắn (text, ảnh normal/once), xóa tin nhắn của mình.
   - Xem ảnh once một lần (gọi API consume).
   - Đánh dấu đã xem tin nhắn (seen) khi focus.
3. **Admin**:
   - Truy cập `/admin-secret-route`, xem danh sách tất cả phòng và user.
   - Có thể đọc mọi tin nhắn (kể cả đã xóa và ảnh once) nhưng **không thể gửi tin** vào phòng có user thường.
   - Không xuất hiện trong tìm kiếm của user thường.
4. **Realtime**:
   - Tin nhắn mới → Pusher trigger `new-message` đến `chat-{roomId}`.
   - Cập nhật danh sách phòng → trigger `rooms-updated` đến `user-{userId}` của từng participant.
   - Admin dashboard có thể lắng nghe `admin-global` để cập nhật danh sách phòng.

### 6.3. Bảo mật & ẩn danh

- Admin không thể bị user thường tìm thấy (API search lọc `isAdmin: false`).
- Admin không thể tạo room với user thường (API `/rooms/start` chặn).
- Admin không thể gửi tin nhắn vào phòng có user thường.
- User thường không thấy admin trong danh sách phòng, không thấy tên admin (dưới bất kỳ hình thức nào).
- Admin vẫn có thể đọc mọi tin nhắn (kể cả đã xóa, ảnh once) mà user không hề biết.

### 6.4. Công nghệ sử dụng

- **Next.js 15+** (App Router)
- **MongoDB + Mongoose**
- **Pusher** (realtime)
- **Cloudinary** (upload ảnh)
- **Tailwind CSS + shadcn/ui**
- **bcryptjs** (hash mật khẩu)
- **Zod** (validation)

---

**Kết luận:** Hệ thống đã có đầy đủ API, components, pages, context, và các file hỗ trợ. Chỉ cần implement nội dung bên trong các component (nếu chưa có) là có thể chạy hoàn chỉnh.