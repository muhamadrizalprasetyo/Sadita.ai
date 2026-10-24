import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SADITA — Sistem Absensi Digital Terintegrasi Akademik",
  description:
    "Platform akademik terintegrasi untuk Universitas Insan Pembangunan Indonesia (UNIPI). Attendance, LMS, dan manajemen akademik berbasis IoT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
