import RequireAuth from "@/components/RequireAuth";

export default function AppPage() {
  return (
    <RequireAuth>
      <main style={{ width: "100vw", height: "100vh", margin: 0 }}>
        <iframe
          src="/legacy/index.html"
          title="Legacy Sales App"
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </main>
    </RequireAuth>
  );
}
