import type { ConfirmDialogOptions } from "./types";

type ShowFn = (options: ConfirmDialogOptions) => Promise<boolean>;

let showImpl: ShowFn | null = null;

/** Gọi từ ConfirmDialogProvider — không dùng trực tiếp trong app. */
export function registerConfirmDialogShow(fn: ShowFn | null) {
  showImpl = fn;
}

/**
 * Hiện hộp thoại xác nhận (Promise&lt;boolean&gt;: true = Đồng ý, false = Hủy/đóng).
 * Cần có &lt;ConfirmDialogProvider /&gt; trong cây React (vd. root layout).
 *
 * @example
 * const ok = await confirmDialog.show();
 * if (ok) { ... }
 *
 * @example
 * const ok = await confirmDialog.show({
 *   title: "Xóa mục?",
 *   message: "Thao tác không hoàn tác.",
 *   variant: "danger",
 * });
 */
export const confirmDialog = {
  show(options?: ConfirmDialogOptions): Promise<boolean> {
    if (!showImpl) {
      if (typeof window !== "undefined") {
        console.warn(
          "[confirmDialog] ConfirmDialogProvider chưa gắn — trả về false.",
        );
      }
      return Promise.resolve(false);
    }
    return showImpl(options ?? {});
  },
};
