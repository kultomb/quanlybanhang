/**
 * Presence / online — đồng bộ giữa client (heartbeat) và admin (đọc lastSeen RTDB).
 * ONLINE_WINDOW ≈ 2×HEARTBEAT giúp offline chuyển đỏ nhanh sau khi ngắt heartbeat, vẫn chịu được trễ mạng nhẹ.
 */
export const PRESENCE_HEARTBEAT_MS = 5_000;

/** Không có lastSeen mới trong khoảng này → Offline (đỏ). */
export const PRESENCE_ONLINE_MS = 12_000;

/** Trang admin: đọc lại presence — càng nhỏ càng sát thời gian thực (tải RTDB theo UID). */
export const ADMIN_PRESENCE_POLL_MS = 1_500;
