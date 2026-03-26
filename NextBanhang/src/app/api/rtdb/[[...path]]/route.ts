import { cookies } from "next/headers";

const COOKIE_NAME = "ha_session_token";
const RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://dangnnhap-8687d-default-rtdb.asia-southeast1.firebasedatabase.app";

function buildTargetUrl(pathname: string, search: string, token: string) {
  const cleanPath = pathname.replace(/^\/+/, "");
  const endsWithJson = cleanPath.endsWith(".json");
  const base = `${RTDB_URL}/${endsWithJson ? cleanPath : `${cleanPath}.json`}`;
  const query = new URLSearchParams(search);
  query.set("auth", token);
  return `${base}?${query.toString()}`;
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value || "";
  if (!token) return new Response("Unauthorized", { status: 401 });

  const { path } = await context.params;
  const fullPath = (path || []).join("/");
  if (!fullPath.startsWith("backups/")) {
    return new Response("Forbidden path", { status: 403 });
  }

  const reqUrl = new URL(request.url);
  const target = buildTargetUrl(fullPath, reqUrl.search, token);

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();
  const res = await fetch(target, {
    method,
    body,
    headers: {
      "content-type": request.headers.get("content-type") || "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type":
        res.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}
