import { adminDb } from "@/lib/backend/server";
import { normalizeShopSlug } from "@/lib/backend/userShopSlug";

/** Khớp quy tắc đăng ký slug (3–30 ký tự a-z, số, gạch ngang). */
const SLUG_PATTERN = /^[a-z0-9-]{3,30}$/;

/**
 * Có ít nhất một bản ghi shop (chính thức hoặc dùng thử) trên RTDB.
 * Dùng trước khi render `/[shop]` để URL rác trả 404 thay vì vào shell POS.
 */
export async function rtdbShopSlugExists(rawSlug: string): Promise<boolean> {
  const slug = normalizeShopSlug(String(rawSlug || ""));
  if (!slug || !SLUG_PATTERN.test(slug)) return false;

  const db = adminDb();
  const [pro, trial] = await Promise.all([
    db.ref(`shops/${slug}`).get(),
    db.ref(`trialShops/${slug}`).get(),
  ]);
  return pro.exists() || trial.exists();
}
