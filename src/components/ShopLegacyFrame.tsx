"use client";

import { useMemo } from "react";

type ShopLegacyFrameProps = {
  shop: string;
};

export default function ShopLegacyFrame({ shop }: ShopLegacyFrameProps) {
  const src = useMemo(() => `/legacy/index.html?shop=${encodeURIComponent(shop)}`, [shop]);
  return (
    <iframe
      src={src}
      title={`Legacy Sales App - ${shop}`}
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}
