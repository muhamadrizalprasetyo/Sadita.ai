# Sistem Desain Responsif & Spesifikasi Dukungan Apple iPhone SADITA.ai

Dokumen ini merupakan panduan teknis implementasi tata letak responsif universal (*Universal Responsive Layout*) dan optimasi mendalam untuk seluruh ekosistem perangkat seluler, dengan fokus khusus pada **dukungan penuh 100% untuk seluruh varian Apple iPhone** (iPhone SE, iPhone 11/12/13/14/15/16 series, Pro, dan Pro Max).

---

## 1. Sistem Breakpoint Global

SADITA.ai menggunakan 6 tingkatan breakpoint berbasis CSS media queries yang teruji secara komprehensif di berbagai resolusi layar:

| Breakpoint | Rentang Resolusi | Target Perangkat Utama | Karakteristik Tata Letak |
|---|---|---|---|
| `xs` | `< 480px` | iPhone SE, layar ponsel mini (320px - 479px) | Tata letak kolom tunggal (1-col), navigasi bawah (bottom-nav), kartu rapat |
| `sm` | `480px - 767px` | iPhone 13/14/15/16 standar, Pro, Plus, Max | Kolom tunggal adaptif, touch-target optimal, header sticky dengan safe-area |
| `md` | `768px - 1023px` | iPad Portrait, tablet Android umum | 2-kolom grid, sidebar dapat diciutkan (*collapsible icon-only*) |
| `lg` | `1024px - 1279px`| iPad Pro Landscape, Laptop ringkas | Sidebar tetap terbuka (240px), tabel data lengkap, multi-card grid (3-col) |
| `xl` | `1280px - 1535px`| Layar Desktop Standar Enterprise (1080p) | Sidebar penuh (260px), layout dashboard 4-kolom KPI, split-pane view |
| `2xl`| `>= 1536px` | Monitor Resolusi Tinggi (2K, 4K, UltraWide)| Kontainer konten dibatasi (`max-width: 1600px; margin: auto`) |

> **Standar Implementasi: Wajib Mengutamakan Utilitas Tailwind CSS**
> Seluruh tata letak responsif, grid adaptif, dan penyesuaian breakpoint wajib diutamakan menggunakan kelas utilitas bawaan Tailwind CSS (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`). Hindari menulis media queries CSS murni secara terpisah jika dapat ditangani langsung dengan utilitas responsif Tailwind.

---

## 2. Aturan Wajib Optimalisasi Apple iPhone & iOS

Pengguna iPhone memiliki perilaku dan batasan tampilan khusus pada WebKit/Safari yang wajib diakomodasi tanpa kompromi:

### 2.1 Notch, Dynamic Island, dan Home Indicator Safe Areas
Perangkat iPhone memiliki lekukan kamera (Notch pada iPhone 11-14) atau Dynamic Island (iPhone 14 Pro, iPhone 15/16 series) serta garis Home Indicator di bagian bawah layar.

**Aturan Wajib:**
1. File `app/layout.tsx` wajib menyertakan tag viewport dengan atribut `viewport-fit=cover`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" />
   ```
2. Seluruh container tata letak wajib menggunakan fungsi CSS `env(safe-area-inset-*)`:
   ```css
   /* Header / Top Navigation */
   .topbar {
     padding-top: max(12px, env(safe-area-inset-top));
     padding-left: max(16px, env(safe-area-inset-left));
     padding-right: max(16px, env(safe-area-inset-right));
   }

   /* Bottom Navigation Bar di iPhone */
   .mobile-bottom-nav {
     padding-bottom: max(12px, env(safe-area-inset-bottom));
     height: calc(60px + env(safe-area-inset-bottom));
   }

   /* Container Konten Utama */
   .main-content {
     padding-left: max(16px, env(safe-area-inset-left));
     padding-right: max(16px, env(safe-area-inset-right));
     padding-bottom: calc(80px + env(safe-area-inset-bottom)); /* Ruang untuk bottom bar */
   }
   ```

### 2.2 Pencegahan Auto-Zoom Mengganggu di iOS Safari (16px Input Rule)
Pada iOS Safari, jika sebuah elemen input teks memiliki ukuran font kurang dari 16px (`1rem`), browser akan secara otomatis memperbesar tampilan layar (*auto-zoom in*) saat pengguna memfokuskan kursor. Hal ini merusak tata letak antarmuka aplikasi.

**Aturan Wajib:**
Semua elemen input, select, dan textarea pada layar mobile **wajib** memiliki `font-size: 16px` (atau `1rem`):
```css
input, select, textarea {
  font-size: 16px !important; /* Mencegah auto-zoom liar pada iOS Safari */
  border-radius: 8px;
  -webkit-appearance: none;   /* Menghilangkan styling default iOS yang kuno */
}
```

### 2.3 Ukuran Target Sentuh Minimum 44x44px (Apple HIG Standards)
Sesuai panduan *Apple Human Interface Guidelines*, setiap tombol atau elemen yang dapat ditekan harus memiliki area sentuh minimal **44px × 44px** untuk mencegah salah tekan jari:

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### 2.4 Momentum Scrolling & Penghapusan Highlight Abu-abu iOS
```css
/* Aktifkan smooth momentum scrolling pada elemen overflow */
.scrollable-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Hapus kotak abu-abu default saat elemen disentuh di iOS */
* {
  -webkit-tap-highlight-color: transparent;
}
```

---

## 3. Ergonomi "Thumb Zone" untuk Mobile

Sebagian besar mahasiswa dan dosen mengoperasikan ponsel cerdas dengan satu tangan (ibu jari). Fitur kritis diletakkan dalam zona jangkauan alami ibu jari (*Natural Thumb Zone*):

```
+-----------------------------------+
| [Kamera / Dynamic Island]         |
| [Header / Filter Ringkas]         | <- Sulit dijangkau (Hard to reach)
|                                   |
| [Konten Kartu / Histori Presensi] | <- Zona Peregangan (Stretch Zone)
|                                   |
| [Tabel / Detail Jadwal Kuliah]    | <- Zona Alami Ibu Jari
|                                   |    (Natural Thumb Zone)
| [Tap Mandiri / Scan Kartu] (CTA)  |
+-----------------------------------+
| [Home] [Jadwal] [Presensi] [Akun] | <- Bar Navigasi Bawah (Ergonomis)
+-----------------------------------+
```

### 3.1 Komponen Navigasi Bawah Khusus Ponsel
Pada layar `< 768px`, sidebar kiri desktop disembunyikan dan digantikan oleh bilah navigasi bawah (*Bottom Navigation Bar*) yang ramping, elegan, dan dilengkapi ikon SVG presisi.

```tsx
// File: frontend/components/layout/mobile-nav.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, QrCode, BookOpen, User } from 'lucide-react';
import styles from './mobile-nav.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const MAHASISWA_NAV: NavItem[] = [
  { label: 'Beranda', href: '/mahasiswa', icon: LayoutDashboard },
  { label: 'Jadwal', href: '/mahasiswa/jadwal', icon: Calendar },
  { label: 'Presensi', href: '/mahasiswa/presensi', icon: QrCode },
  { label: 'LMS', href: '/mahasiswa/kelas', icon: BookOpen },
  { label: 'Profil', href: '/mahasiswa/profil', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav} aria-label="Navigasi Bawah Seluler">
      {MAHASISWA_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon className={styles.icon} size={22} strokeWidth={isActive ? 2.2 : 1.7} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## 4. Konfigurasi iOS Progressive Web App (PWA)

SADITA.ai mendukung mode instalasi layar utama (*Add to Home Screen*) di iOS layaknya aplikasi native tanpa frame browser:

```typescript
// File: frontend/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SADITA.ai — Sistem Akademik & Presensi',
    short_name: 'SADITA',
    description: 'Sistem Absensi Digital Terintegrasi Akademik & LMS UNIPI',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#059669',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

Meta tag di `frontend/app/layout.tsx`:
```tsx
export const metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SADITA.ai',
  },
};
```

---

## 5. Ringkasan Kepatuhan Perangkat

Setiap PR (*Pull Request*) atau perubahan UI wajib lolos checklist pengujian responsif berikut:
- [x] Lolos uji tampilan iPhone SE (resolusi 375 × 667) tanpa scroll horizontal liar.
- [x] Lolos uji iPhone 15/16 Pro Max dengan Dynamic Island aktif tanpa elemen yang tertutup.
- [x] Area klik semua tombol dan link minimal 44 × 44 pixel.
- [x] Formulir input tidak memicu zoom layar otomatis di iOS Safari.
- [x] Tabel data memiliki pembungkus scroll horizontal halus (`overflow-x: auto`) saat dibuka di layar ponsel sempit.

---

## 6. Hirarki Tombol Melayang (Floating Controls) & Standar Backdrop Modal

### 6.1 Koordinasi Tombol Melayang (SI KOBAR FAB & Back to Top)
Untuk mencegah tombol melayang saling menumpuk (*overlapping/clipping*):
1. **SI KOBAR Assistant FAB**: Diletakkan pada sudut kanan bawah (`bottom: 2rem`, `right: 2rem`, ukuran `56px × 56px`, `z-index: 999`).
2. **Back to Top Button**: Diletakkan tepat di atas SI KOBAR dengan jarak pemisah vertikal bersih 14px (`bottom: calc(2rem + 70px)`), sejajar horizontal pada sumbu tengah FAB (`right: calc(2rem + 6px)`, ukuran `44px × 44px` sesuai Apple HIG, `z-index: 998`).
3. **Responsif Mobile & Safe Area**: Pada layar ponsel (`<= 640px`), kedua tombol otomatis menyesuaikan jarak terhadap `env(safe-area-inset-bottom)` agar tidak bertabrakan dengan bilah navigasi bawah iOS/Android.

### 6.2 Standar Overlay Modal & Dialog
1. **Bebas Blur Berlebihan (No Backdrop Blur)**: Hindari `backdrop-filter: blur(...)` pada overlay modal agar konten di balik dialog tetap tajam dan terbaca secara kontekstual.
2. **Transparansi Hitam Lembut (Soft Black Tint)**: Menggunakan `background: rgba(0, 0, 0, 0.4)` (atau maksimal `0.45`) sehingga latar belakang teredup secara elegan tanpa terasa terlalu tebal atau pekat.
3. **Scroll Lock Terisolasi**: Saat modal terbuka, scrolling halaman luar dinonaktifkan (`overflow: hidden` pada `html` & `body`, `touch-action: none` pada overlay) dengan momentum touch scroll tetap aktif pada kontainer isi modal (`modal-box`).

### 6.3 Standar Halaman Login Enterprise Modern (Split-Screen Institutional Portal)
1. **Tata Letak Dua Panel (*Split-Screen Layout*)**:
   - **Panel Kiri (Otoritas Institusi & Nilai Sistem)**: Latar belakang Navy dalam (`#0b1528` - `#112240`) dengan aksen mikro-grid, lencana resmi UNIPI, ringkasan 3 pilar fitur (Presensi IoT, LMS & Kurikulum, Keamanan Zero-Trust), dan indikator status operasional MQTT broker & TLS 1.3 secara *real-time*.
   - **Panel Kanan (Formulir Autentikasi Modern)**: Kanvas putih berdensitas fokus tinggi, pemilih role simulasi (*segmented account switcher*), input NIM/Email dengan ikon terpadu, toggle *show/hide password*, detektor *Caps Lock*, dan footer bantuan resmi BAAK.
2. **Kepatuhan Responsif Apple iPhone**:
   - Pada layar `< 1024px`, tata letak bertransisi mulus menjadi satu kolom vertikal yang ergonomis.
   - Ukuran font input wajib `16px` (`1rem`) pada perangkat mobile untuk mencegah auto-zoom liar di iOS Safari.
   - Tombol aksi utama memiliki tinggi 48px, melebihi batas minimum Apple HIG 44px untuk kenyamanan sentuhan satu tangan (*Thumb Zone*).


