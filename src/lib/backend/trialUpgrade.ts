import admin from "firebase-admin";
import type { Database } from "firebase-admin/database";
import { getBackupTreePathForShopKey, getShopPaths } from "@/lib/backend/shop-paths";

/**
 * Shop thử từng nằm dưới backups/ — chuyển một lần sang trial_backups/ (idempotent).
 */
export async function liftLegacyTrialBackupToTrialBackups(db: Database, shopKey: string) {
  const trialRoot = getBackupTreePathForShopKey(shopKey, true);
  const legacyRoot = getBackupTreePathForShopKey(shopKey, false);
  if ((await db.ref(trialRoot).get()).exists()) return;
  const legacy = await db.ref(legacyRoot).get();
  if (!legacy.exists()) return;
  await db.ref(trialRoot).set(legacy.val());
  await db.ref(legacyRoot).remove();
}

/**
 * Copy toàn bộ cây POS (app.json, snapshots/…) từ trial_backups → backups, tạo shops/{toSlug}, trialShops/{fromSlug} → stub upgradedTo (không xóa — tránh 404 URL cũ).
 * Đọc kho trial (getShopPaths(from, true).backup) trước; nếu không có (dữ liệu cũ) fallback kho pro cùng slug.
 */
export async function migrateTrialShopToProduction(
  db: Database,
  params: {
    uid: string;
    fromSlug: string;
    toSlug: string;
    ownerEmail: string;
  },
) {
  const { uid, fromSlug, toSlug, ownerEmail } = params;
  const trialRoot = getShopPaths(fromSlug, true).backup;
  const legacyRoot = getShopPaths(fromSlug, false).backup;
  const destRoot = getShopPaths(toSlug, false).backup;

  let tree = await db.ref(trialRoot).get();
  if (!tree.exists()) {
    tree = await db.ref(legacyRoot).get();
  }
  if (tree.exists()) {
    await db.ref(destRoot).set(tree.val());
  }

  await db.ref(trialRoot).remove().catch(() => undefined);
  await db.ref(legacyRoot).remove().catch(() => undefined);

  /**
   * Giữ bản ghi trialShops/{fromSlug} (stub) thay vì xóa hẳn — để /[fromSlug] không 404 sau khi nâng cấp.
   * Người đăng nhập vào link cũ vẫn được redirectIfShopUrlMismatch → slug chính thức.
   */
  await db.ref(getShopPaths(fromSlug, true).shop).set({
    slug: fromSlug,
    ownerUid: uid,
    upgradedTo: toSlug,
    upgradedAt: admin.database.ServerValue.TIMESTAMP,
  });
  await db.ref(getShopPaths(toSlug, false).shop).set({
    slug: toSlug,
    ownerUid: uid,
    ownerEmail: String(ownerEmail || "").trim(),
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
}
