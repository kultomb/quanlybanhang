import AccountPage from "@/components/AccountPage";
import RequireAuth from "@/components/RequireAuth";
import { redirectIfShopUrlMismatch } from "@/lib/backend/redirect-if-shop-url-mismatch";

type ShopAccountPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopAccountPage({ params }: ShopAccountPageProps) {
  const { shop } = await params;
  await redirectIfShopUrlMismatch(shop);

  return (
    <RequireAuth pathShopFromUrl={shop}>
      <AccountPage shop={shop} />
    </RequireAuth>
  );
}
