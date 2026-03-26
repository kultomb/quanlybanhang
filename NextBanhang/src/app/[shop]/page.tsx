import RequireAuth from "@/components/RequireAuth";

export const dynamic = "force-dynamic";

type ShopPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { shop } = await params;

  return (
    <RequireAuth>
      <main style={{ width: "100vw", height: "100vh", margin: 0 }}>
        <iframe
          src="/legacy/index.html"
          title={`Legacy Sales App - ${shop}`}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </main>
    </RequireAuth>
  );
}
