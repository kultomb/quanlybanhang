"use client";

import { useMemo, useRef, useState } from "react";

type ShopLegacyFrameProps = {
  shop: string;
};

export default function ShopLegacyFrame({ shop }: ShopLegacyFrameProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [blankDetected, setBlankDetected] = useState(false);
  const src = useMemo(() => `/legacy/index.html?shop=${encodeURIComponent(shop)}`, [shop]);

  function validateFrameContent() {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      const doc = frame.contentWindow?.document;
      const body = doc?.body;
      const text = (body?.innerText || "").trim();
      const hasAppContainer = !!doc?.getElementById("appContainer");
      if (!hasAppContainer && text.length < 10) {
        setBlankDetected(true);
      }
    } catch {
      // If the frame cannot be inspected, keep the current state.
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <iframe
        ref={frameRef}
        src={src}
        title={`Legacy Sales App - ${shop}`}
        onLoad={() => {
          setLoading(false);
          window.setTimeout(validateFrameContent, 800);
        }}
        style={{ width: "100%", height: "100%", border: "none" }}
      />

      {loading ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#f8fafc",
            color: "#334155",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Đang tải giao diện bán hàng...
        </div>
      ) : null}

      {blankDetected ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(248,250,252,0.96)",
            color: "#0f172a",
            padding: 20,
            textAlign: "center",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>Phát hiện giao diện trống</div>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#059669",
              color: "white",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Mở trực tiếp trang legacy để kiểm tra
          </a>
        </div>
      ) : null}
    </div>
  );
}
