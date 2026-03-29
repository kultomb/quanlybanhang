import { HanghoErrorPage } from "@/components/HanghoErrorPage";

export default function ShopNotFound() {
  return (
    <HanghoErrorPage
      code="404"
      title="Không tìm thấy cửa hàng"
      description="Địa chỉ này không khớp với cửa hàng nào trên hệ thống. Kiểm tra lại tên shop hoặc đường dẫn."
    />
  );
}
