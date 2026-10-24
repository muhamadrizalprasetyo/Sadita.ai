# Spesifikasi Komponen Reusable, Performa Enterprise & SEO 100% SADITA.ai

Dokumen ini mendefinisikan arsitektur komponen publik yang dapat digunakan kembali (*Reusable Public Components*), optimasi performa berkecepatan tinggi setara platform enterprise (*Core Web Vitals*), serta panduan penerapan **SEO 100% dan kesiapan Google Search Console 100%**.

---

## 1. Arsitektur Komponen UI Berjenjang (Atomic Enterprise UI)

Komponen UI frontend dikelompokkan ke dalam hirarki yang bersih dan terisolasi:

```
frontend/components/
├── ui/                        # [Atoms] Primitif UI murni tanpa dependensi bisnis
│   ├── button.tsx             # Varian: primary, secondary, outline, danger, ghost
│   ├── badge.tsx              # Varian: success, warning, danger, neutral, sapphire
│   ├── input.tsx              # Input field dengan label & error message terpadu
│   ├── select.tsx             # Dropdown native dengan styling enterprise
│   ├── stat-card.tsx          # Kartu KPI metrik dengan tren dan ikon
│   ├── data-table.tsx         # Tabel universal dengan paginasi dan sorting
│   └── toast.tsx              # Notifikasi sistem real-time
├── layout/                    # [Molecules & Organisms] Kerangka layout halaman
│   ├── role-shell.tsx         # Wrapper otorisasi rute dan shell dinamis per role
│   ├── sidebar.tsx            # Navigasi desktop dengan state aktif
│   ├── topbar.tsx             # Header dengan breadcrumb, user profile, dan status IoT
│   └── mobile-nav.tsx         # Bilah navigasi bawah untuk perangkat iPhone/ponsel
└── domain/                    # [Organisms] Komponen kompleks terikat domain sistem
    ├── attendance/            # Monitoring presensi live, kalender presensi
    └── lms/                   # Pratinjau materi, submission viewer, grading rubric
```

### 1.1 Contoh Komponen Reusable: `StatCard`
```tsx
// File: frontend/components/ui/stat-card.tsx
import React from 'react';
import styles from './stat-card.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'emerald' | 'sapphire' | 'amber' | 'neutral';
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'neutral',
}: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.iconWrapper}>{icon}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
        {(description || trend) && (
          <div className={styles.footer}>
            {trend && (
              <span className={trend.isPositive ? styles.trendUp : styles.trendDown}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {description && <span className={styles.desc}>{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 2. Optimasi Performa Enterprise & Core Web Vitals

SADITA.ai dirancang untuk memuat secepat kilat (*sub-second load*) dengan metrik Core Web Vitals hijau (skor 95-100 di Lighthouse):

### 2.1 Target Metrik Kunci
- **TTFB (Time to First Byte)**: `< 100ms` (dioptimasi via FastAPI async connection pool dan streaming SSR).
- **LCP (Largest Contentful Paint)**: `< 1.2 detik` (dioptimasi via Next.js Server Components dan font pre-loading).
- **FID / INP (Interaction to Next Paint)**: `< 50ms` (meminimalkan JavaScript bundle pada browser).
- **CLS (Cumulative Layout Shift)**: `< 0.05` (seluruh gambar dan tabel memiliki dimensi eksplisit atau skeleton placeholder).

### 2.2 Strategi Pengurangan Ukuran Bundle
1. Gunakan **Server Components** secara default di Next.js 16 (`app/`). Jangan menambahkan `'use client'` jika komponen hanya merender HTML/CSS dan tidak memiliki event listener `onClick`/`useState`.
2. Gunakan dynamic import (`next/dynamic`) untuk komponen modal atau library grafik yang berat agar tidak membebani initial page load.

---

## 3. Spesifikasi SEO 100% & Google Search Console Compliance

Meskipun SADITA.ai memiliki portal tertutup (membutuhkan login), halaman publik (Landing/Portal Pengenalan, Katalog Kurikulum Publik, Halaman Login, Dokumentasi Panduan Mahasiswa, Informasi Program Studi) **wajib terindeks sempurna di Google Search Console dengan skor 100% SEO**.

### 3.1 Struktur HTML5 Semantik
- Setiap halaman hanya boleh memiliki **satu tag `<h1>`** utama yang jelas dan deskriptif.
- Gunakan tag semantik HTML5 yang tepat:
  - `<header>` untuk banner dan navigasi atas.
  - `<nav>` untuk daftar menu navigasi.
  - `<main>` untuk pembungkus konten inti (membantu screen reader dan crawler).
  - `<article>` untuk sesi perkuliahan atau pengumuman akademik.
  - `<aside>` untuk ringkasan jadwal sampingan atau SI KOBAR helper.
  - `<footer>` untuk hak cipta dan metadata institusi.

### 3.2 Dynamic Metadata & Open Graph di Next.js
Konfigurasi metadata terpusat di `frontend/app/layout.tsx`:

```typescript
// File: frontend/app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sadita.unipi.ac.id'),
  title: {
    default: 'SADITA.ai — Sistem Absensi Digital Terintegrasi Akademik UNIPI',
    template: '%s | SADITA.ai UNIPI',
  },
  description:
    'Sistem Absensi Digital Terintegrasi Akademik & LMS Universitas Insan Pembangunan Indonesia (UNIPI). Pengelolaan perkuliahan, presensi IoT RFID ESP32-S3, materi, dan nilai secara real-time.',
  keywords: [
    'SADITA',
    'SADITA.ai',
    'Absensi Digital UNIPI',
    'LMS UNIPI',
    'Sistem Akademik UNIPI',
    'Presensi RFID ESP32',
    'Universitas Insan Pembangunan Indonesia',
    'Teknologi Informasi UNIPI',
  ],
  authors: [{ name: 'Tim Pengembang SADITA.ai', url: 'https://unipi.ac.id' }],
  creator: 'Universitas Insan Pembangunan Indonesia',
  publisher: 'UNIPI Press',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://sadita.unipi.ac.id',
    siteName: 'SADITA.ai',
    title: 'SADITA.ai — Sistem Absensi Digital Terintegrasi Akademik UNIPI',
    description:
      'Platform resmi absensi digital IoT dan LMS terintegrasi untuk civitas akademika Universitas Insan Pembangunan Indonesia.',
    images: [
      {
        url: '/images/og-sadita-enterprise.png',
        width: 1200,
        height: 630,
        alt: 'SADITA.ai Dashboard Preview UNIPI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SADITA.ai — Sistem Akademik & Presensi UNIPI',
    description: 'Sistem Absensi Digital Terintegrasi Akademik & LMS Kampus UNIPI.',
    images: ['/images/og-sadita-enterprise.png'],
  },
  alternates: {
    canonical: 'https://sadita.unipi.ac.id',
  },
  verification: {
    google: 'google-site-verification-token-unipi-sadita',
  },
};
```

### 3.3 Generator `sitemap.xml` Otomatis
```typescript
// File: frontend/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sadita.unipi.ac.id';
  const currentDate = new Date();

  return [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/panduan`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
```

### 3.4 Generator `robots.txt` Terarah
```typescript
// File: frontend/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sadita.unipi.ac.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/panduan', '/images/'],
        disallow: ['/admin/', '/dosen/', '/mahasiswa/', '/kaprodi/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### 3.5 Schema.org JSON-LD Structured Data
Untuk memastikan Google Search Console mengenali entitas institusi dan kurikulum secara kaya (*Rich Results*), suntikkan tag JSON-LD pada layout publik:

```tsx
// File: frontend/components/seo/academic-structured-data.tsx
import React from 'react';

export function AcademicStructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Universitas Insan Pembangunan Indonesia (UNIPI)',
    alternateName: 'SADITA.ai Academic Portal',
    url: 'https://sadita.unipi.ac.id',
    logo: 'https://sadita.unipi.ac.id/images/logo-unipi.png',
    sameAs: [
      'https://unipi.ac.id',
      'https://facebook.com/unipi.official',
      'https://instagram.com/unipi_official',
    ],
    department: {
      '@type': 'EducationalOrganization',
      name: 'Program Studi Teknologi Informasi',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

---

## 4. Checklist Kesiapan Google Search Console (100% Pass)

- [x] **Tag Verifikasi Kepemilikan**: Meta tag Google Search Console terpasang di `<head>`.
- [x] **Keterindeksan Sitemap**: `sitemap.xml` valid, dapat diakses publik, dan merujuk URL kanonikal resmi.
- [x] **Robots.txt Valid**: Menghindari indeksasi data privat mahasiswa sambil mengizinkan halaman publik.
- [x] **Structured Data Valid**: Bebas error dan peringatan pada Google Rich Results Test.
- [x] **Mobile Usability**: Lulus pengujian ramah seluler Google (Viewport adaptif, tidak ada elemen terlalu rapat, teks terbaca tanpa zoom).
