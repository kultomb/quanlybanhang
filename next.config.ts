import type { NextConfig } from "next";

/**
 * Cookie `ha_session_token` / iframe Bearer dùng cùng origin — nếu user lần lượt mở `hangho.com` và `www.hangho.com`
 * thì coi như hai site → 401 tải dữ liệu dù đã đăng nhập. Redirect theo `NEXT_PUBLIC_APP_URL` (production).
 */
async function hostAliasRedirects() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  if (!raw || /localhost|127\.0\.0\.1/i.test(raw)) return [];

  let canonical: URL;
  try {
    canonical = new URL(raw);
  } catch {
    return [];
  }

  const host = canonical.hostname.toLowerCase();
  const base = `${canonical.protocol}//${host}`;
  const segments = host.split(".");

  if (segments[0] === "www" && segments.length >= 3) {
    const apex = segments.slice(1).join(".");
    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: apex }],
        destination: `${base}/:path*`,
        permanent: true,
      },
    ];
  }

  return [
    {
      source: "/:path*",
      has: [{ type: "host" as const, value: `www.${host}` }],
      destination: `${base}/:path*`,
      permanent: true,
    },
  ];
}

const nextConfig: NextConfig = {
  async redirects() {
    return hostAliasRedirects();
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
