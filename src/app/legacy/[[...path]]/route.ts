import { readFile } from "node:fs/promises";
import path from "node:path";
import { adminAuth } from "@/lib/backend/server";
import { normalizeShopSlug, resolveUserShopSlugWithHeal } from "@/lib/backend/userShopSlug";

const LEGACY_ROOT = path.resolve(process.cwd(), "public", "legacy");
const DEFAULT_RTDB_URL = "/api/rtdb";
const DEFAULT_BACKUP_KEY = process.env.NEXT_PUBLIC_DEFAULT_BACKUP_KEY || "shop_autokey";
const SHOP_COOKIE_NAME = "ha_shop_slug";
const SESSION_COOKIE_NAME = "ha_session_token";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const ALLOWED_FILES = new Set([
  "index.html",
  "styles.css",
  "app.js",
  "firebase-config.js",
]);

function getContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return CONTENT_TYPES[ext] || "text/plain; charset=utf-8";
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("=") || "");
  }
  return "";
}

async function resolveShopSlugFromSession(request: Request) {
  const token = String(getCookieValue(request, SESSION_COOKIE_NAME) || "").trim();
  if (!token) return "";
  const decoded = await adminAuth().verifyIdToken(token).catch(() => null);
  if (!decoded?.uid) return "";
  return resolveUserShopSlugWithHeal(decoded.uid);
}

/** Chỉ dùng khi chưa có session/cookie — lấy ?shop= từ trang embed (Referer). */
function shopSlugFromLegacyReferer(request: Request) {
  const ref = request.headers.get("referer") || "";
  try {
    const u = new URL(ref);
    return normalizeShopSlug(u.searchParams.get("shop") || "");
  } catch {
    return "";
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const url = new URL(request.url);
  const { path: segments } = await context.params;
  const requested = segments?.length ? segments.join("/") : "index.html";
  const fileName = requested.split("/").pop() || "index.html";

  if (!ALLOWED_FILES.has(fileName)) {
    return new Response("Not found", { status: 404 });
  }

  if (fileName === "firebase-config.js") {
    const cookieShop = normalizeShopSlug(getCookieValue(request, SHOP_COOKIE_NAME));
    const sessionShop = await resolveShopSlugFromSession(request);
    const refShop = shopSlugFromLegacyReferer(request);
    const slug = sessionShop || cookieShop || refShop;
    const key = slug ? `shop_${slug}` : DEFAULT_BACKUP_KEY;
    const body = `window.FIREBASE_CONFIG=${JSON.stringify({ url: DEFAULT_RTDB_URL, key })};`;
    return new Response(body, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const absolutePath = path.join(LEGACY_ROOT, fileName);
  try {
    if (fileName === "index.html") {
      const raw = await readFile(absolutePath, "utf-8");
      const urlShop = normalizeShopSlug(url.searchParams.get("shop") || "");
      const cookieShop = normalizeShopSlug(getCookieValue(request, SHOP_COOKIE_NAME));
      const sessionShop = await resolveShopSlugFromSession(request);
      const requestedKey = String(url.searchParams.get("key") || "").trim();
      let backupKey = DEFAULT_BACKUP_KEY;
      if (sessionShop) backupKey = `shop_${sessionShop}`;
      else if (cookieShop) backupKey = `shop_${cookieShop}`;
      else if (requestedKey) backupKey = requestedKey;
      else if (urlShop) backupKey = `shop_${urlShop}`;
      const injectedConfig =
        `<script>window.FIREBASE_CONFIG = { url: '${DEFAULT_RTDB_URL}', key: '${backupKey}' };</script>`;
      let content = raw.replace(
        "<script>window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || { url: '', key: '' };</script>",
        injectedConfig,
      );
      if (content === raw) {
        content = raw.replace("</head>", `${injectedConfig}\n</head>`);
      }
      return new Response(content, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    const fileContent = await readFile(absolutePath);
    return new Response(fileContent, {
      headers: {
        "content-type": getContentType(fileName),
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
