"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi, getStoredToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (!getStoredToken()) { router.replace("/login"); return; }
    void authApi.getMe().then((r) => router.replace(r.data?.role === "ADMIN" ? "/admin/dashboard" : r.data?.role === "DOSEN" ? "/dosen/dashboard" : "/mahasiswa/dashboard"));
  }, [router]);
  return <main className="screen-center">Memuat SADITA…</main>;
}
