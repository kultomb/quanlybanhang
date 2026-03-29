import { HanghoErrorPage } from "@/components/HanghoErrorPage";

export default function NotFound() {
  return (
    <HanghoErrorPage
      code="404"
      title="Không tìm thấy trang"
      description="Đường dẫn không đúng hoặc nội dung đã được chuyển đi. Vui lòng kiểm tra lại URL hoặc quay về trang chủ."
    />
  );
}
