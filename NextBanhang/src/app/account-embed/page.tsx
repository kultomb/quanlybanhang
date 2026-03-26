import AccountPage from "@/components/AccountPage";
import RequireAuth from "@/components/RequireAuth";

export const dynamic = "force-dynamic";

type AccountEmbedPageProps = {
  searchParams: Promise<{ shop?: string }>;
};

export default async function AccountEmbedPage({ searchParams }: AccountEmbedPageProps) {
  const params = await searchParams;
  const shop = (params.shop || "").trim();
  return (
    <RequireAuth>
      <AccountPage shop={shop || undefined} />
    </RequireAuth>
  );
}
