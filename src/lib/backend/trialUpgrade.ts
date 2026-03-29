import admin from "firebase-admin";
import type { Database } from "firebase-admin/database";

/**
 * Shop thử từng nằm dưới backups/ — chuyển một lần sang trial_backups/ (idempotent).
 */
export async function liftLegacyTrialBackupToTrialBackups(db: Database, shopKey: string) {
  const trialRoot = `trial_backups/${shopKey}`;
  const legacyRoot = `backups/${shopKey}`;
  if ((await db.ref(trialRoot).get()).exists()) return;
  const legacy = await db.ref(legacyRoot).get();
  if (!legacy.exists()) return;
  await db.ref(trialRoot).set(legacy.val());
  await db.ref(legacyRoot).remove();
}

/**
 * Copy toàn bộ cây POS (app.json, snapshots/…) từ trial_backups → backups, tạo shops/{toSlug}, xóa trialShops/{fromSlug}.
 * Đọc trial_backups trước; nếu không có (dữ liệu cũ) fallback backups/{fromKey}.
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
  const fromKey = `shop_${fromSlug}`;
  const toKey = `shop_${toSlug}`;

  const trialRoot = `trial_backups/${fromKey}`;
  const legacyRoot = `backups/${fromKey}`;
  const destRoot = `backups/${toKey}`;

  let tree = await db.ref(trialRoot).get();
  if (!tree.exists()) {
    tree = await db.ref(legacyRoot).get();
  }
  if (tree.exists()) {
    await db.ref(destRoot).set(tree.val());
  }

  await db.ref(trialRoot).remove().catch(() => undefined);
  await db.ref(legacyRoot).remove().catch(() => undefined);

  await db.ref(`trialShops/${fromSlug}`).remove().catch(() => undefined);
  await db.ref(`shops/${toSlug}`).set({
    slug: toSlug,
    ownerUid: uid,
    ownerEmail: String(ownerEmail || "").trim(),
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
}
