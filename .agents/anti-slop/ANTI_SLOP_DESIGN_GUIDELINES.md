# Panduan Desain Anti-AI Slop & Standar UI/UX Enterprise SADITA.ai

Dokumen ini adalah manifesto desain antarmuka (*User Interface*) dan pengalaman pengguna (*User Experience*) untuk platform SADITA.ai. Tujuannya adalah memastikan sistem memiliki kualitas visual dan ergonomi setara produk perangkat lunak enterprise global (seperti Linear, Stripe, GitHub Enterprise, dan Datadog), serta **menolak secara mutlak segala bentuk estetika klise "AI Slop"**.

---

## 1. Definisi & Larangan Keras "AI Slop"

"AI Slop" adalah istilah untuk pola desain seragam, generik, dan tidak fungsional yang kerap dihasilkan oleh template AI otomatis atau generator CSS murahan. Desain seperti ini memberi kesan palsu, kekanak-kanakan, tidak profesional, dan menyulitkan pengguna di lingkungan operasional institusi pendidikan tinggi.

### 1.1 Daftar Terlarang (Blacklist) Estetika AI Slop
1. ❌ **Neon Glow & Purple/Cyan Blob Gradien**: Dilarang menggunakan efek latar belakang gelembung gradien ungu-biru neon (*glow effect*) yang melayang tanpa fungsi struktural.
2. ❌ **Glassmorphism Berlebihan**: Dilarang menggunakan `backdrop-filter: blur(20px)` dengan teks putih tipis pada latar belakang dinamis yang merusak kontras baca (*unreadable contrast*).
3. ❌ **Kartu Metrik Palsu Tanpa Konteks**: Dilarang meletakkan kartu statistik dengan angka persentase fiktif (misal: "AI Productivity 99.4%") yang tidak dapat di-klik dan tidak memiliki relasi dengan database PostgreSQL.
4. ❌ **Ilustrasi Robot/Maskot 3D Plastik**: Dilarang menggunakan gambar robot kartun 3D generik yang melayang di sudut layar. SI KOBAR harus tampil sebagai utilitas cerdas yang bersih dan bersahaja, bukan maskot mainan.
5. ❌ **Animasi Lambat dan Melayang-layang**: Dilarang menggunakan animasi CSS berdurasi lebih dari 300ms yang memantul-mantul (*bouncy spring*) untuk tombol atau modal operasional sehari-hari.
6. ❌ **Padding Raksasa dengan Kepadatan Data Nol**: Dilarang membuat halaman yang hanya memuat 3 baris data dalam satu layar monitor 24 inci akibat jarak spasi berlebihan.

---

## 2. Karakteristik Estetika Human-Crafted Enterprise

SADITA.ai didesain untuk dosen yang harus menginput nilai dalam waktu cepat, mahasiswa yang perlu mengecek presensi di ponsel saat berdesakan, dan admin akademik yang mengelola ribuan data mahasiswa. Desain harus memancarkan kredibilitas, kecepatan, ketenangan, dan presisi tinggi.

```
+---------------------------------------------------------------------------------------+
|  SADITA.ai | TI UNIPI        [Tahun Akademik: 2026/2027 Ganjil]        (User: Dosen)   |
+---------------------------------------------------------------------------------------+
| [Menu Dosen]  | Kelas: TI-2024-P1 / Algoritma Pemrograman / Sesi 04 (Live)            |
| - Dashboard   +-----------------------------------------------------------------------+
| - Kelas Saya  | Status: TERBUKA | Waktu: 08:00 - 10:30 | Ruang: Lab Komputer 03       |
| - Presensi    | Hadir: 38/42  | Terlambat: 2  | Sakit: 1  | Alpha: 1                   |
| - Materi      +-----------------------------------------------------------------------+
| - Tugas       | [NIM]        [Nama Mahasiswa]      [Status]      [Waktu Tap]  [Aksi]  |
| - Nilai       | 202401001    Ahmad Fauzi           HADIR         07:54:12     [Edit]  |
|               | 202401002    Budi Santoso          TERLAMBAT     08:16:03     [Edit]  |
+---------------+-----------------------------------------------------------------------+
```

### 2.1 Palet Warna Institusional UNIPI yang Dikurasi

Warna dipilih berdasarkan fungsi psikologis dan keterbacaan kontras tinggi (memenuhi standar aksesibilitas WCAG AAA):

| Peran Warna | Nama Token | Nilai Hex | Penggunaan Fungsional |
|---|---|---|---|
| **Latar Primer** | `--color-surface-bg` | `#f8fafc` | Latar belakang kanvas aplikasi (Slate 50) |
| **Permukaan Kartu** | `--color-surface-card` | `#ffffff` | Panel data, tabel, form, modal |
| **Garis Struktur** | `--color-border-subtle` | `#e2e8f0` | Pembatas tabel, garis pemisah komponen (Slate 200) |
| **Teks Utama** | `--color-text-primary` | `#0f172a` | Judul, data numerik, teks tabel utama (Slate 900) |
| **Teks Sekunder** | `--color-text-secondary`| `#475569` | Label form, deskripsi ringkas (Slate 600) |
| **Teks Muted** | `--color-text-muted` | `#64748b` | Timestamp, metadata tambahan (Slate 500) |
| **Aksen Akademik UNIPI** | `--color-brand-emerald` | `#059669` | Tombol utama, indikator aktif, status HADIR |
| **Aksen Sekunder** | `--color-brand-sapphire`| `#1d4ed8` | Link navigasi, filter terpilih, status TERVERIFIKASI |
| **Status Warning** | `--color-status-warning` | `#d97706` | Status TERLAMBAT, status PENDING APPROVAL |
| **Status Danger** | `--color-status-danger` | `#dc2626` | Status ALPHA, status DITOLAK, error sistem |

### 2.2 Hirarki Tipografi Berbasis Skala Proporsional

Menggunakan font modern berstandar enterprise seperti **Inter**, **Plus Jakarta Sans**, atau **Geist Sans**. Skala ukuran teks mengikuti pola tegas:

```css
/* Typography Scale Tokens */
--text-xs:   0.75rem;   /* 12px - Label badge, footnote, timestamp */
--text-sm:   0.875rem;  /* 14px - Teks tabel standar, isi form, button label */
--text-base: 1.0rem;    /* 16px - Teks paragraf, input form utama (cegah zoom iOS) */
--text-lg:   1.125rem;  /* 18px - Subheading kartu, judul modal */
--text-xl:   1.25rem;   /* 20px - Header panel, ringkasan metrik */
--text-2xl:  1.5rem;    /* 24px - Judul halaman modul */
--text-3xl:  1.875rem;  /* 30px - Angka KPI utama */

/* Line Heights */
--leading-tight: 1.25;
--leading-snug:  1.375;
--leading-normal:1.5;
```

### 2.3 Standar Kartu Autentikasi Institusional (Zero-AI-Slop Login)

Halaman masuk (*login*) adalah pintu gerbang institusional bagi ribuan sivitas akademika, bukan landing page marketing produk B2C.
1. **Pola Kartu Terpusat (*Centered Institutional Card*)**: Menolak tata letak split-screen gelap dengan banner promosi AI, gelembung gradien neon, dan kartu marketing palsu. Gunakan kartu terpusat (`max-w-[420px]`) di atas latar belakang Slate 50 netral dengan garis aksen navy UNIPI `#1B2D4F` di bagian atas viewport.
2. **Ergonomi Input & Ikon**: Seluruh kolom input wajib memiliki gutter teks yang presisi (`padding: 0 38px`) sehingga ikon `Mail` atau `Lock` di sisi kiri tidak menabrak karakter teks atau password bullets. Ukuran font wajib $\ge 16$px pada viewport seluler untuk mencegah *auto-zoom* iOS Safari.
3. **Penyederhanaan Selektor Uji Coba**: Quick switcher akun simulasi (Admin, Kaprodi, Dosen, Ketua Kelas, Mahasiswa) dirancang kompak dalam baris grid berprofil rendah dengan badge aktif, tidak mendominasi atau mengacaukan hierarki form login.

### 2.4 Standar Mutlak Styling: Wajib Menggunakan 100% Tailwind CSS Saja (Zero Raw CSS Mandate)

Setiap pengembang maupun agen AI **WAJIB HANYA MENGGUNAKAN TAILWIND CSS** dalam seluruh pembuatan antarmuka, tata letak, komponen, dialog modal, dan perbaikan tampilan di SADITA.ai:
1. **Wajib Utilitas Bawaan Tailwind CSS (Utility-First in TSX)**:
   - Seluruh penyusunan layout (`flex`, `grid`, `col-span-*`), jarak spasial (`p-*`, `m-*`, `gap-*`), warna (`bg-*`, `text-*`, `border-*`), tipografi, radius (`rounded-lg`, `rounded-md`), dan bayangan wajib langsung menggunakan kelas utilitas bawaan Tailwind CSS pada elemen JSX/TSX.
2. **Larangan Mutlak CSS Murni (*Strict Ban on Pure/Vanilla CSS*)**:
   - Dilarang keras menulis kode CSS murni (*raw/vanilla CSS*) dengan properti manual (seperti `position: fixed; inset: 0; background-color: rgba(...) !important;`) di dalam `frontend/app/globals.css`.
   - Dilarang membuat file `.css` baru terpisah atau modul CSS terpisah (`.module.css`). Seluruh komponen dialog, alert, konfirmasi, dan modal wajib menggunakan kelas utilitas Tailwind langsung pada komponen TSX.
3. **Penyederhanaan `globals.css` Terpusat pada `@theme` Tailwind v4**:
   - Berkas `frontend/app/globals.css` hanya digunakan untuk inisialisasi Tailwind (`@import "tailwindcss";`), konfigurasi token institusional pada blok `@theme`, dan reset `@layer base`. Tidak boleh ada selektor komponen murni dengan aturan CSS vanilla manual.
4. **Offline-First & Kemandirian Dependensi**:
   - Menggunakan engine `@tailwindcss/postcss` v4 yang bekerja mandiri secara offline bersama paket lokal `@fontsource/poppins`, tanpa bergantung pada CDN eksternal.

---

## 3. Ergonomi Data Density & Pola Tabel Enterprise

Di SADITA.ai, data adalah raja. Dosen dan admin harus dapat memindai 50 baris data tanpa kelelahan mata (*visual fatigue*).

### 3.1 Aturan Penataan Tabel
1. **Tinggi Baris yang Konsisten**: Baris tabel operasional memiliki tinggi 44px - 48px. Cukup rapat untuk memuat banyak data, namun tetap nyaman diklik pada perangkat layar sentuh.
2. **Alignment Kolom yang Logis**:
   - Kolom teks (Nama, Prodi, Mata Kuliah) rata kiri (*left-aligned*).
   - Kolom kode/angka (NIM, Jam, Persentase, Nilai) menggunakan font monospace (`font-family: monospace`) dan rata tengah atau rata kanan.
   - Kolom aksi diletakkan paling kanan.
3. **Badge Status yang Jelas**:
   - Status bukan sekadar teks biasa, melainkan badge berbingkai halus dengan latar belakang semi-transparan:
     - `HADIR`: Latar `#ecfdf5`, Border `#a7f3d0`, Teks `#047857`
     - `TERLAMBAT`: Latar `#fffbeb`, Border `#fde68a`, Teks `#b45309`
     - `IZIN`: Latar `#eff6ff`, Border `#bfdbfe`, Teks `#1d4ed8`
     - `SAKIT`: Latar `#f5f3ff`, Border `#ddd6fe`, Teks `#6d28d9`
     - `ALPHA`: Latar `#fef2f2`, Border `#fecaca`, Teks `#b91c1c`

---

## 4. Mikro-Interaksi yang Responsif & Berkelas

Antarmuka modern terasa hidup bukan karena efek 3D berlebihan, melainkan karena reaksi instan terhadap input pengguna:

1. **Feedback Hover yang Halus**:
   - Transisi warna tombol: `transition: background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms`.
   - Elevasi bayangan halus: `box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`.
2. **Focus Ring yang Aksesibel**:
   - Seluruh elemen interaktif wajib memiliki `:focus-visible` dengan outline 2px dan offset 2px (`outline: 2px solid var(--color-brand-emerald); outline-offset: 2px`).
3. **Indikator Loading Skeleton**:
   - Gunakan skeleton loader berbentuk balok abu-abu dengan kilau animasi lembut (`linear-gradient`) untuk menggantikan spinner berputar yang membosankan saat data di-fetch.
4. **State Kosong (Empty States) yang Membimbing**:
   - Jika suatu tabel kosong (misal: belum ada materi di sesi 01), tampilkan ilustrasi ikon minimalis bergaris tipis, penjelasan singkat 1 kalimat, dan tombol aksi langsung ("Unggah Materi Pertama").

---

## 5. Ringkasan Prinsip Anti-Slop SADITA.ai

> **"Kecantikan enterprise sejati lahir dari kejelasan struktur, kesederhanaan navigasi, kecepatan respons, dan penghormatan terhadap waktu pengguna—bukan dari ornamen visual buatan AI yang tidak bermakna."**
