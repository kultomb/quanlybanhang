import AccountPage from "@/components/AccountPage";

export const dynamic = "force-dynamic";

type ShopAccountPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopAccountPage({ params }: ShopAccountPageProps) {
  const { shop } = await params;
  return <AccountPage shop={shop} />;
}
