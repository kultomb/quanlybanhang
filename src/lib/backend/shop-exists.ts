import { adminDb } from "@/lib/backend/server";
import { normalizeShopSlug } from "@/lib/backend/userShopSlug";

/** Khớp quy tắc đăng ký slug (3–30 ký tự a-z, số, gạch ngang). */
const SLUG_PATTERN = /^[a-z0-9-]{3,30}$/;

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function readShopExists(slug: string): Promise<boolean> {
  const db = adminDb();
  const [pro, trial] = await Promise.all([
    db.ref(`shops/${slug}`).get(),
    db.ref(`trialShops/${slug}`).get(),
  ]);
  return pro.exists() || trial.exists();
}

/**
 * Có ít nhất một bản ghi shop (chính thức hoặc dùng thử) trên RTDB.
 * Dùng trước khi render `/[shop]` để URL rác trả 404 thay vì vào shell POS.
 *
 * - Retry ngắn sau đăng ký (RTDB có thể chưa đọc được ngay).
 * - Lỗi Admin SDK / mạng: trả `true` để không 500 toàn trang (client vẫn bảo vệ).
 */
export async function rtdbShopSlugExists(rawSlug: string): Promise<boolean> {
  const slug = normalizeShopSlug(String(rawSlug || ""));
  if (!slug || !SLUG_PATTERN.test(slug)) return false;

  try {
    let ok = await readShopExists(slug);
    if (!ok) {
      await delay(280);
      ok = await readShopExists(slug);
    }
    return ok;
  } catch (e) {
    console.error("[rtdbShopSlugExists]", slug, e);
    return true;
  }
}
