import AccountPage from "@/components/AccountPage";
import RequireAuth from "@/components/RequireAuth";

type ShopAccountPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopAccountPage({ params }: ShopAccountPageProps) {
  const { shop } = await params;
  return (
    <RequireAuth pathShopFromUrl={shop}>
      <AccountPage shop={shop} />
    </RequireAuth>
  );
}
