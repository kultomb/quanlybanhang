/**
 * Chuẩn hóa đường dẫn RTDB cho shop thử vs chính thức — tránh hardcode rải rác.
 */

export type ShopTableRoot = "trialShops" | "shops";
export type BackupDbRoot = "trial_backups" | "backups";

export function getShopKey(slug: string): string {
  return `shop_${slug}`;
}

export function getShopTableRoot(isTrial: boolean): ShopTableRoot {
  return isTrial ? "trialShops" : "shops";
}

export function getBackupDbRoot(isTrial: boolean): BackupDbRoot {
  return isTrial ? "trial_backups" : "backups";
}

/**
 * @param slug — slug đầy đủ (vd. try-tenban hoặc tenban)
 * @param isTrial — true khi tài khoản / bản ghi thuộc giai đoạn dùng thử
 */
export function getShopPaths(slug: string, isTrial: boolean) {
  const shopKey = getShopKey(slug);
  const table = getShopTableRoot(isTrial);
  const backupRoot = getBackupDbRoot(isTrial);
  return {
    shop: `${table}/${slug}` as const,
    backup: `${backupRoot}/${shopKey}` as const,
    shopKey,
    shopTable: table,
    backupRoot,
  };
}

/** Khi đã có sẵn `shopKey` (vd. `shop_try-ten`), không cần tách slug. */
export function getBackupTreePathForShopKey(shopKey: string, isTrial: boolean): string {
  return `${getBackupDbRoot(isTrial)}/${shopKey}`;
}
