import RequireAuth from "@/components/RequireAuth";
import ShopLegacyFrame from "@/components/ShopLegacyFrame";
import { redirectIfShopUrlMismatch } from "@/lib/backend/redirect-if-shop-url-mismatch";

type ShopPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { shop } = await params;
  await redirectIfShopUrlMismatch(shop);

  return (
    <RequireAuth pathShopFromUrl={shop}>
      <main
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          margin: 0,
          overflow: "hidden",
        }}
      >
        {/* Tài khoản portal vào #next-account-slot trong iframe — cùng DOM/cuộn với .top-utility-bar */}
        <ShopLegacyFrame shop={shop} />
      </main>
    </RequireAuth>
  );
}
