import AccountPage from "@/components/AccountPage";

type ShopAccountPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopAccountPage({ params }: ShopAccountPageProps) {
  const { shop } = await params;
  return <AccountPage shop={shop} />;
}
