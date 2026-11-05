import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1B2D4F",
};

export const metadata: Metadata = {
  title: "SADITA — Sistem Absensi Digital Terintegrasi Akademik",
  description:
    "Platform akademik terintegrasi untuk Universitas Insan Pembangunan Indonesia (UNIPI). Attendance, LMS, dan manajemen akademik berbasis IoT.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SADITA.ai",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
