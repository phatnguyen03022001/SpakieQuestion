# Thiết kế hệ thống - Shadcn/UI Design System

## 1. Triết lý thiết kế: "Shadcn/UI Design System"

Hệ thống sử dụng thiết kế theo phong cách shadcn/ui (ui.shadcn.com) với hệ thống component nhất quán, spacing có hệ thống, và bảng màu đa dạng nhưng vẫn đảm bảo tính tương phản cao.

**Nguyên tắc cốt lõi:**

- **Nhất quán (Consistency):** Sử dụng hệ thống design tokens và component library của shadcn/ui để đảm bảo trải nghiệm người dùng đồng nhất.
- **Tương phản cao (High Contrast):** Đảm bảo văn bản sắc nét, dễ đọc ở cả hai chế độ Light và Dark, đạt tiêu chuẩn WCAG AA.
- **Cấu trúc rõ ràng (Structural Clarity):** Sử dụng border, shadow, và spacing có hệ thống để phân cấp thông tin và tạo chiều sâu cho giao diện.
- **Tính tiếp cận (Accessibility):** Ưu tiên thiết kế có thể tiếp cận với đầy đủ các trạng thái focus, hover, active.

## 2. Chiến lược Mobile First & iOS Optimization

Để đảm bảo ứng dụng hoạt động mượt mà trên iPhone và vượt qua các giới hạn của Safari:

### 2.1. Giải pháp cho Safari Search Bar

Safari thường thay đổi kích thước viewport khi thanh địa chỉ hiện/ẩn. Chúng ta xử lý bằng:

- **Dynamic Units:** Sử dụng `height: 100dvh` thay vì `100vh` để container luôn khớp với không gian hiển thị thực tế.
- **Safe Area:** Sử dụng `env(safe-area-inset-bottom)` cho phần Chat Input để không bị che bởi thanh điều hướng hệ thống của iOS.

### 2.2. Ngăn chặn Auto-Zoom

- **Typography:** Toàn bộ input và textarea phải có `font-size` tối thiểu `16px`. Điều này ngăn Safari tự động phóng to màn hình khi người dùng chạm vào ô nhập liệu.

### 2.3. Touch & Gestures

- **Touch Targets:** Các nút chức năng (gửi, xóa, upload) có kích thước vùng chạm tối thiểu `44x44px`.
- **Bouncing Effect:** Vô hiệu hóa `overscroll-behavior` trên body để ngăn hiệu ứng "cuộn nẩy" toàn trang, giữ cảm giác chắc chắn như app Native.

## 3. Hệ màu (Color Palette) - Shadcn/UI Style

### Chủ đạo (Core) - Đảm bảo tương phản WCAG AA

| Mode  | Background              | Foreground                | Primary (Brand)                        | Secondary                    |
| ----- | ----------------------- | ------------------------- | -------------------------------------- | ---------------------------- |
| Light | `oklch(1 0 0)` (Trắng)  | `oklch(0.15 0 0)` (Đen)   | `oklch(0.6 0.2 250)` (Xanh dương)      | `oklch(0.97 0 0)` (Xám nhạt) |
| Dark  | `oklch(0.15 0 0)` (Đen) | `oklch(0.98 0 0)` (Trắng) | `oklch(0.7 0.2 250)` (Xanh dương sáng) | `oklch(0.25 0 0)` (Xám đậm)  |

### Trạng thái đặc thù (Semantic) - Shadcn/UI Style

Sử dụng màu chuẩn shadcn/ui để giữ tính rõ ràng cho hành động:

- **Success:** `oklch(0.62 0.19 149)` (Xanh lá - Online/Thành công)
- **Warning:** `oklch(0.8 0.18 75)` (Vàng cam - Cảnh báo)
- **Destructive:** `oklch(0.58 0.22 25)` (Đỏ - Xóa/Lỗi)
- **Muted:** `oklch(0.97 0 0)` (Light) / `oklch(0.25 0 0)` (Dark) - Cho text phụ
- **Accent:** `oklch(0.95 0.05 250)` (Light) / `oklch(0.3 0.05 250)` (Dark) - Cho hover states

### Border & Input
- **Border:** `oklch(0.92 0 0)` (Light) / `oklch(0.3 0 0)` (Dark)
- **Input:** `oklch(0.98 0 0)` (Light) / `oklch(0.2 0 0)` (Dark)
- **Ring:** Màu primary với opacity 50% cho focus states

## 4. Thành phần giao diện (UI Components) - Shadcn/UI Style

### Chat Bubbles
- **Tin nhắn gửi đi:** Bo góc medium (0.5rem), background primary, text primary-foreground, shadow-sm.
- **Tin nhắn nhận về:** Bo góc medium (0.5rem), background secondary, text secondary-foreground, shadow-sm.
- **Feedback:** Hiệu ứng `hover:scale-[1.02]` và `active:scale-[0.98]` với transition-all.

### Cards & Containers
- **Card:** Background card, border border, rounded-lg (0.5rem), shadow-sm.
- **Header:** Background background/95 với backdrop-blur, border-b border-border.
- **Input Fields:** Rounded-md (0.375rem), border border-input, focus:ring-2 focus:ring-ring.

### Buttons
- **Primary:** bg-primary text-primary-foreground hover:bg-primary/90
- **Secondary:** bg-secondary text-secondary-foreground hover:bg-secondary/80
- **Outline:** border border-input bg-background hover:bg-accent hover:text-accent-foreground
- **Ghost:** hover:bg-accent hover:text-accent-foreground
- **Destructive:** bg-destructive text-destructive-foreground hover:bg-destructive/90

### Hình ảnh "Once" (Xem một lần)
- **Chưa mở:** Card với blur effect, border border, và icon Eye-off.
- **Đang mở:** Modal fullscreen với backdrop-blur-md, nền background/95.

## 5. Spacing & Typography System

### Border Radius
- `--radius-sm`: 0.25rem (4px)
- `--radius-md`: 0.375rem (6px)
- `--radius-lg`: 0.5rem (8px)
- `--radius-xl`: 0.75rem (12px)

### Spacing Scale (Tailwind)
- Sử dụng spacing scale của Tailwind: 0.25rem (4px) increments
- Container padding: 1rem (16px) trên mobile, 1.5rem (24px) trên desktop

### Typography
- **Font Family:** Inter hoặc system font stack
- **Font Sizes:** Sử dụng scale: xs (0.75rem), sm (0.875rem), base (1rem), lg (1.125rem), xl (1.25rem)
- **Font Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## 6. Trải nghiệm người dùng (UX Patterns)

- **Trạng thái kết nối:** Badge với màu success cho online, outline cho offline.
- **Chuyển cảnh:** Sử dụng CSS transitions với duration-200 cho các state changes.
- **Loading:** Sử dụng Skeleton components của shadcn/ui với animation pulse.
- **Empty States:** Card với icon và text descriptive, background muted.

## 7. Lưu ý cho Nhà phát triển

- **CSS Variables:** Luôn sử dụng biến đã định nghĩa trong `globals.css`. Không hard-code mã màu.
- **Component Library:** Sử dụng components từ `/components/ui` thay vì tự tạo styles từ đầu.
- **Dark Mode:** Luôn test cả hai chế độ Light và Dark, đảm bảo tương phản đạt chuẩn.
- **Layout:** Sử dụng flexbox và grid system của Tailwind để responsive design.
- **Performance:** Tối ưu hóa ảnh qua Cloudinary trước khi hiển thị trên mobile để tiết kiệm băng thông.

---

*Tài liệu này định nghĩa các nguyên tắc thiết kế và hướng dẫn triển khai cho hệ thống chat với phong cách Shadcn/UI Design System.*