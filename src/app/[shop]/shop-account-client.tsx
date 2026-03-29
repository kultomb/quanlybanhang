"use client";

import AccountPage from "@/components/AccountPage";
import RequireAuth from "@/components/RequireAuth";

export default function ShopAccountClient({ pathShopFromUrl }: { pathShopFromUrl: string }) {
  return (
    <RequireAuth
      pathShopFromUrl={pathShopFromUrl}
      renderShop={({ shopSlug }) => <AccountPage shop={shopSlug} />}
    />
  );
}
