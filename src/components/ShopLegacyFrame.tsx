"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AccountBar from "@/components/AccountBar";
import TrialModeBanner from "@/components/TrialModeBanner";

type ShopLegacyFrameProps = {
  shop: string;
};

export default function ShopLegacyFrame({ shop }: ShopLegacyFrameProps) {
  const [accountMount, setAccountMount] = useState<HTMLElement | null>(null);
  const src = useMemo(() => `/legacy/index.html?shop=${encodeURIComponent(shop)}`, [shop]);

  useEffect(() => {
    setAccountMount(null);
  }, [shop]);

  const onFrameLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = e.currentTarget.contentDocument;
    if (!doc) return;
    const slot = doc.getElementById("next-account-slot");
    setAccountMount(slot);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TrialModeBanner shopSlug={shop} />
      <iframe
        src={src}
        title={`Legacy Sales App - ${shop}`}
        onLoad={onFrameLoad}
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          border: "none",
          display: "block",
        }}
      />
      {accountMount
        ? createPortal(<AccountBar shop={shop} docked />, accountMount)
        : null}
    </div>
  );
}
