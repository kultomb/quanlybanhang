import AccountPage from "@/components/AccountPage";
import RequireAuth from "@/components/RequireAuth";

type AccountRootPageProps = {
  searchParams: Promise<{ shop?: string }>;
};

export default async function AccountRootPage({ searchParams }: AccountRootPageProps) {
  const params = await searchParams;
  const shop = (params.shop || "").trim();
  return (
    <RequireAuth>
      <AccountPage shop={shop || undefined} />
    </RequireAuth>
  );
}
