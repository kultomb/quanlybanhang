import type { ActionCodeSettings } from "firebase/auth";

import { getPasswordResetContinueOrigin } from "@/lib/site-brand";

/**
 * ActionCodeSettings cho `sendPasswordResetEmail` (chuẩn Firebase Auth custom continue URL).
 *
 * - `url`: `https://hangho.com/reset-password` (từ `NEXT_PUBLIC_APP_URL` + path). Sau khi user bấm link trong mail,
 *   Firebase xử lý rồi **chuyển về** URL này kèm `mode`, `oobCode` (và tham số khác) — trang `/reset-password` đã có sẵn.
 * - `handleCodeInApp: true`: khuyến nghị theo tài liệu Firebase cho luồng có continue URL (web/app).
 * - **Authorized domains:** `hangho.com`, `www.hangho.com` trong Authentication → Settings.
 * - **Vercel:** `NEXT_PUBLIC_APP_URL=https://hangho.com` (HTTPS, không dùng localhost trong mail production).
 *
 * **Lưu ý:** Chuỗi `href` trong HTML email đôi khi vẫn là `*.firebaseapp.com/__/auth/...` + `continueUrl=…`;
 * domain đẹp nằm ở tham số continue và trang đích. Muốn link hiển thị trực tiếp `hangho.com` trong mail,
 * cần **Firebase Hosting** (cùng project) gắn custom domain — xem tài liệu “custom auth domain / action URL”.
 *
 * **Templates:** Authentication → Password reset — chỉnh tiêu đề/nội dung Hangho (mẫu trong comment cuối file).
 */
export function buildPasswordResetActionCodeSettings(): ActionCodeSettings | undefined {
  const origin = getPasswordResetContinueOrigin();
  if (!origin) return undefined;
  return {
    url: `${origin}/reset-password`,
    handleCodeInApp: true,
  };
}

/*
 * --- Mẫu dán Firebase Console → Authentication → Templates → Password reset ---
 * Kiểm tra ô nhập: thường là %LINK% hoặc tương đương trong form hiện tại.
 *
 * Subject: Đặt lại mật khẩu — Hangho (hangho.com)
 *
 * Body:
 * Xin chào,
 *
 * Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Hangho trên hangho.com.
 *
 * Bấm liên kết sau để đặt mật khẩu mới (liên kết có thời hạn):
 * %LINK%
 *
 * Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email — mật khẩu hiện tại vẫn giữ nguyên.
 *
 * Trân trọng,
 * Đội ngũ Hangho · hangho.com
 */
