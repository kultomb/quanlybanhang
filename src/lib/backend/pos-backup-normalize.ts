/**
 * Gói backup POS (app.json / data.json trên RTDB): gộp chuỗi lồng `data` → `data` (double-wrap),
 * luôn ép các mảng nghiệp vụ (customers, products, …) để POS nhận schema ổn định.
 */

export const POS_ARRAY_KEYS = [
  "customers",
  "products",
  "suppliers",
  "categories",
  "orders",
  "sales",
  "debtPayments",
  "debtors",
  "repairs",
] as const;

export function asPosArray(v: unknown): unknown[] {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "object") return Object.values(v as Record<string, unknown>);
  return [];
}

export function emptyPosDataRecord(): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of POS_ARRAY_KEYS) o[k] = [];
  return o;
}

/** Payload mặc định khi tạo shop mới hoặc GET node trống. */
export function emptyPosAppJsonPayload(): {
  data: Record<string, unknown>;
  company: Record<string, unknown>;
  meta: Record<string, unknown>;
} {
  return {
    data: emptyPosDataRecord(),
    company: {},
    meta: { schemaVersion: 1 },
  };
}

/** root → data → data… (tối đa 4 tầng), mỗi tầng là object. */
export function collectBackupDataLayers(root: Record<string, unknown>): Record<string, unknown>[] {
  const layers: Record<string, unknown>[] = [];
  let cur: unknown = root;
  for (let i = 0; i < 4; i++) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) break;
    const rec = cur as Record<string, unknown>;
    layers.push(rec);
    const next = rec.data;
    if (next !== undefined && next !== null && typeof next === "object" && !Array.isArray(next)) {
      cur = next;
    } else {
      break;
    }
  }
  return layers;
}

/** Gộp field nghiệp vụ (bỏ company, meta, data); tầng sau ghi đè tầng trước nếu trùng khóa. */
export function mergedBusinessFromBackupLayers(layers: Record<string, unknown>[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer)) {
      if (k === "company" || k === "meta" || k === "data") continue;
      merged[k] = v;
    }
  }
  return merged;
}

function coercePosArraysOnRecord(merged: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...merged };
  for (const k of POS_ARRAY_KEYS) {
    data[k] = asPosArray(data[k]);
  }
  return data;
}

/**
 * Chuẩn hóa snapshot RTDB cho GET app / data — không ghi DB.
 * Xử lý: null, flat, một lớp { data }, và nhiều lớp { data: { data: { products }}}.
 */
export function normalizePosBackupJsonForGet(value: unknown): unknown {
  if (value === undefined || value === null) {
    return emptyPosAppJsonPayload();
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return emptyPosAppJsonPayload();
  }
  const root = value as Record<string, unknown>;

  const company =
    root.company && typeof root.company === "object" && !Array.isArray(root.company)
      ? { ...(root.company as Record<string, unknown>) }
      : {};
  const metaRoot =
    root.meta && typeof root.meta === "object" && !Array.isArray(root.meta)
      ? { ...(root.meta as Record<string, unknown>) }
      : {};

  const layers = collectBackupDataLayers(root);
  const merged = mergedBusinessFromBackupLayers(layers);
  const data = coercePosArraysOnRecord(merged);

  return {
    data,
    company,
    meta: Object.keys(metaRoot).length > 0 ? metaRoot : { schemaVersion: 1 },
  };
}
