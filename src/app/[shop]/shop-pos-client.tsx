"use client";

import RequireAuth from "@/components/RequireAuth";
import ShopLegacyFrame from "@/components/ShopLegacyFrame";

export default function ShopPosClient({ pathShopFromUrl }: { pathShopFromUrl: string }) {
  return (
    <RequireAuth
      pathShopFromUrl={pathShopFromUrl}
      renderShop={({ shopSlug }) => (
        <main
          style={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            margin: 0,
            overflow: "hidden",
          }}
        >
          <ShopLegacyFrame shop={shopSlug} />
        </main>
      )}
    />
  );
}
