import type { Metadata } from "next";
import { HanghoErrorPage } from "@/components/HanghoErrorPage";

export const metadata: Metadata = {
  title: "403 — Không có quyền truy cập | Hangho.com",
  description: "Bạn không có quyền xem nội dung này.",
};

export default function ForbiddenPage() {
  return (
    <HanghoErrorPage
      code="403"
      title="Bạn không có quyền truy cập"
      description="Tài khoản hiện tại không được phép xem nội dung này. Hãy đăng nhập bằng tài khoản phù hợp hoặc quay lại trang chủ."
    />
  );
}
