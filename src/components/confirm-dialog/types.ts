export type ConfirmDialogVariant =
  | "danger"
  | "default"
  | "warning"
  | "info";

export type ConfirmDialogOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Ký tự emoji hoặc chuỗi rỗng để ẩn */
  icon?: string;
  variant?: ConfirmDialogVariant;
  /** Đóng và coi như Hủy khi bấm ra ngoài (mặc định: true) */
  closeOnBackdrop?: boolean;
  /** Đóng và coi như Hủy khi nhấn Escape (mặc định: true) */
  closeOnEscape?: boolean;
};

export type ResolvedConfirmDialogOptions = Required<
  Pick<
    ConfirmDialogOptions,
    | "title"
    | "message"
    | "confirmLabel"
    | "cancelLabel"
    | "icon"
    | "variant"
    | "closeOnBackdrop"
    | "closeOnEscape"
  >
>;
