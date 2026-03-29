/**
 * Presence / online — đồng bộ giữa client (heartbeat) và admin (đọc lastSeen RTDB).
 * ONLINE_WINDOW nên ≥ ~2 × HEARTBEAT để tránh nhấp nháy khi trễ mạng.
 */
export const PRESENCE_HEARTBEAT_MS = 15_000;

/** lastSeen trong khoảng này → coi là online (theo thời gian thực, cập nhật vài giây trên UI admin). */
export const PRESENCE_ONLINE_MS = 45_000;

/** Trang admin: gộp presence theo danh sách UID hiện có (ms). */
export const ADMIN_PRESENCE_POLL_MS = 4_000;
