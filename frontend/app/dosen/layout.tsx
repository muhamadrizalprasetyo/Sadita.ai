import { Suspense, type ReactNode } from "react";
import { RoleShell } from "@/components/role-shell";

function DosenFallback() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#e9ebef" }}>
      <p style={{ color: "#8a909c", fontSize: "13px" }}>Memuat workspace dosen…</p>
    </main>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RoleShell role="DOSEN">
      <Suspense fallback={<DosenFallback />}>{children}</Suspense>
    </RoleShell>
  );
}
