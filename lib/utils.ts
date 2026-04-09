import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function getPrivateRoomId(userA: string, userB: string): string {
  const ids = [userA, userB].sort();
  return `room-${ids[0]}-${ids[1]}`;
}

/**
 * Kiểm tra một chuỗi có phải ObjectId hợp lệ của MongoDB hay không.
 * ObjectId là chuỗi 24 ký tự hex (0-9, a-f, A-F).
 */
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 1600;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              reject(new Error("Canvas empty"));
            }
          },
          "image/jpeg",
          0.85,
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Lấy danh sách userId từ roomId.
 * Hỗ trợ các định dạng:
 * - "userId1-userId2" (phòng 2 người)
 * - "room-userId" (phòng support)
 * - "group-xxx" (phòng nhóm – có thể mở rộng)
 *
 * @param roomId - ID của phòng chat
 * @returns Mảng các userId (string)
 */
export function getParticipantsFromRoomId(roomId: string): string[] {
  const parts = roomId.split("-");
  // Loại bỏ token đặc biệt và chỉ giữ các phần là ObjectId hợp lệ
  return parts.filter((part) => part !== "room" && part !== "group" && part !== "" && isValidObjectId(part));
}

/**
 * Kiểm tra user có nằm trong phòng không
 */
export function isUserInRoom(roomId: string, userId: string): boolean {
  return getParticipantsFromRoomId(roomId).includes(userId);
}
