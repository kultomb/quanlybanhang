import { readFile } from "node:fs/promises";
import path from "node:path";

const LEGACY_ROOT = path.resolve(process.cwd(), "..");
const DEFAULT_RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://dangnnhap-8687d-default-rtdb.asia-southeast1.firebasedatabase.app";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await context.params;
  const requested = segments?.length ? segments.join("/") : "index.html";
  const fileName = requested.split("/").pop() || "index.html";

  if (!ALLOWED_FILES.has(fileName)) {
    return new Response("Not found", { status: 404 });
  }

  if (fileName === "firebase-config.js") {
    const defaultConfigJs =
      `;(function(){var c=window.FIREBASE_CONFIG||{};window.FIREBASE_CONFIG={url:(c.url&&String(c.url).trim())?String(c.url).trim():'${DEFAULT_RTDB_URL}',key:(c.key||'')};})();`;
    return new Response(defaultConfigJs, {
      headers: { "content-type": "application/javascript; charset=utf-8" },
    });
  }

  const absolutePath = path.join(LEGACY_ROOT, fileName);
  try {
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
