import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

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
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <body className={poppins.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
