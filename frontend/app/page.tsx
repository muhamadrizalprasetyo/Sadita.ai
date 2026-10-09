"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi, getStoredToken } from "@/lib/api";
import { homeFor, Role } from "@/components/role-shell";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    void authApi.getMe().then((r) => {
      if (r.data) {
        router.replace(homeFor(r.data.role as Role));
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border-subtle)", borderTopColor: "var(--primary-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--text-secondary)" }}>Memuat SADITA.ai…</p>
      </div>
    </main>
  );
}
