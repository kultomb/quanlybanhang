"use client";

import { usePathname } from "next/navigation";
import TrialModeBanner from "@/components/TrialModeBanner";

/** Segment đầu không phải slug cửa hàng — không gắn banner (một nguồn duy nhất, tránh chồng nhiều layout). */
const RESERVED_FIRST_SEGMENTS = new Set(
  [
    "admin",
    "login",
    "register",
    "upgrade",
    "payment-required",
    "account",
    "account-embed",
    "trial",
    "reset-password",
    "forbidden",
    "admin-unauthorized",
    "api",
    "legacy",
    "app",
    "src",
    "_next",
  ].map((s) => s.toLowerCase()),
);

function shopSlugFromPathname(pathname: string): string | null {
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const parts = trimmed.split("/").filter(Boolean);
  const raw = parts[0];
  if (!raw) return null;
  try {
    const seg = decodeURIComponent(raw);
    if (RESERVED_FIRST_SEGMENTS.has(seg.toLowerCase())) return null;
    return seg;
  } catch {
    return null;
  }
}

/**
 * Một <TrialModeBanner /> cho toàn app — không render trong từng /[shop] layout (tránh spam khi cache/back).
 */
export default function TrialBannerOutlet() {
  const pathname = usePathname() || "/";
  const shop = shopSlugFromPathname(pathname);
  if (!shop) return null;
  return <TrialModeBanner shopSlug={shop} />;
}
