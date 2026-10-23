# Eduka Dashboard: Design Spec

Dokumentasi desain untuk `eduka-dashboard.html`. Semua nilai di bawah diambil langsung dari CSS/JS yang dipakai, jadi bisa dipakai sebagai acuan kalau mau porting ke React, Vue, atau Blade (Laravel).

---

## 1. Gambaran Umum

- **Produk:** dashboard admin untuk platform pembelajaran online.
- **Kesan visual:** bersih, ramai warna di bagian atas (kartu statistik), tenang di bagian bawah (card putih).
- **Prinsip:**
  1. Angka penting (statistik) harus jadi titik fokus pertama, makanya pakai kartu gradient.
  2. Konten detail (tabel, chart) ditaruh di card putih biar mata nggak capek.
  3. Satu warna utama (hijau) untuk semua state aktif dan aksi.

---

## 2. Design Tokens

### 2.1 Warna: Dasar

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--green` | `#12b76a` | Teks/tab aktif, status "Completed", scrollbar |
| `--green-dark` | `#0a9a58` | Cadangan (hover/pressed), belum dipakai di versi ini |
| `--bg` | `#f4f5f7` | Latar area konten |
| `--card` | `#ffffff` | Sidebar dan card |
| `--text` | `#1f2430` | Teks utama |
| `--muted` | `#8a909c` | Teks sekunder, label kecil |
| `--line` | `#eceef2` | Garis pemisah |
| (body) | `#e9ebef` | Latar luar di sekitar app |
| (aksen nav) | `#1ed38a` | Indikator menu aktif, badge Inbox |
| (link/filter) | `#29a8e8` | Dropdown "Show: ..." |

### 2.2 Warna: Gradient Kartu Statistik

Semua arah `135deg`.

| Kartu | Dari | Ke |
|---|---|---|
| Green (Students) | `#0aa85a` | `#29c973` |
| Blue (Teachers) | `#0a7fd8` | `#35a4f2` |
| Purple (Events) | `#7a3cf0` | `#b57cff` |
| Orange (Plan) | `#f0460a` | `#ff7a2f` |

### 2.3 Warna: Chart

**Donut "Total Improvement"**

| Kategori | Hex | Persen |
|---|---|---|
| Typography | `#ff7a45` | 35% |
| Color | `#2ed8a3` | 5% |
| UI Course | `#2d9cf0` | 10% |
| UX Course | `#a66cff` | 20% |
| Development | `#6dd5fa` | 30% |

**Line chart:** garis `#1ed38a` (2.2px), area di bawahnya gradient vertikal hijau (opacity 0.28 ke 0.02), gridline putus-putus `#c9ced8`, label sumbu `#6b7080`.

### 2.4 Tipografi

- **Font:** Poppins (Google Fonts), fallback `system-ui, -apple-system, 'Segoe UI', sans-serif`.
- **Weight yang dipakai:** 400, 500, 600, 700.

| Peran | Ukuran | Weight |
|---|---|---|
| Logo | 28px | 700 (huruf `-1px`, "ka" berwarna hijau) |
| Angka statistik | 28px | 700 |
| Judul card besar ("Courses") | 19px | 600 |
| Sapaan header | 17px | 600 |
| Menu sidebar | 14.5px | 500 (aktif: 600) |
| Judul card kecil | 14px | 600 |
| Label tab / baris siswa | 12–13px | 500 |
| Label kartu statistik | 12.5px | 400 |
| Isi tabel course | 11.5–12px | 400–600 |
| Keterangan kecil (author, legend) | 9.5–11px | 400–500 |

### 2.5 Radius

| Elemen | Radius |
|---|---|
| Container app | 28px |
| Card dan kartu statistik | 20px |
| Search bar, tombol ikon | 12px |
| Item menu sidebar | 10px |
| Thumbnail course | 8px |
| Tooltip chart | 12px |
| Avatar | 50% |

### 2.6 Shadow

- **Card:** `0 6px 24px rgba(20, 30, 60, .06)`
- **Container app:** `0 20px 60px rgba(20, 30, 60, .12)`
- **Kartu statistik saat hover:** `0 14px 28px rgba(0, 0, 0, .15)`

### 2.7 Spacing

Tidak pakai skala baku, tapi pola yang konsisten:

- Gap antar kartu statistik dan antar card: **20px**
- Padding card: **20px 22px**
- Padding area konten: **24px 28px 32px**
- Padding sidebar: **28px** (kanan 0 supaya indikator aktif bisa nempel ke tepi)
- Jarak antar item menu: **6px**

---

## 3. Layout

```
┌───────────┬──────────────────────────────────────────┐
│           │  Topbar: sapaan · search · notif · avatar │
│  Sidebar  ├──────────────────────────────────────────┤
│  240px    │  [Stat] [Stat] [Stat] [Stat]   (4 kolom)  │
│           ├────────────────────┬─────────────────────┤
│           │  Courses           │  Students           │
│           │  (1.25fr)          │  Participation (1fr)│
│           ├────────────────────┼─────────────────────┤
│           │  Recent Students   │  Total Improvement  │
└───────────┴────────────────────┴─────────────────────┘
```

- Grid utama: `240px 1fr`.
- Max width container: **1400px**, di-center.
- Baris kartu statistik: `repeat(4, 1fr)`.
- Baris card di bawahnya: `1.25fr 1fr`.

---

## 4. Komponen

### 4.1 Sidebar
- Logo di atas, menu vertikal, **Support** dan **Logout** menempel di bawah.
- **State aktif:** teks hijau, bold, plus bar vertikal 5px (`#1ed38a`) di tepi kiri dengan sudut kanan membulat.
- **Hover:** teks berubah hijau.
- **Badge Inbox:** lingkaran 20px, latar `#1ed38a`, teks putih 11px.
- Ikon: stroke 1.7px, ukuran 20px (kecuali Home yang solid saat aktif).

### 4.2 Topbar
- Sapaan berubah sesuai jam (Morning / Afternoon / Evening / Night) plus emoji tangan yang beranimasi melambai.
- Search bar lebar 300px, latar putih, border `--line`.
- Tombol notifikasi 38×38px dengan titik merah `#ff4d4f`.
- Avatar 38px.

### 4.3 Kartu Statistik
- Tinggi minimum 158px, padding `20px 18px 16px`.
- Struktur: label kecil, angka besar, ikon di pojok kanan atas (44px), lalu footer dengan garis tipis putih (opacity 45%).
- Angka melakukan **count-up** selama 900ms saat halaman dibuka.
- **Hover:** naik 4px plus shadow lebih dalam.
- Kartu Events punya 3 baris footer (Ongoing, Upcoming, Completed). Kartu Plan punya link "See Details".

### 4.4 Tabs (Courses)
- Empat tab: All, Ongoing, Upcoming, Completed.
- Tab aktif: teks hijau bold plus garis bawah 2px hijau.
- Klik tab memfilter daftar course tanpa reload.

### 4.5 Baris Course
- Grid 5 kolom: `1.6fr .6fr .8fr .7fr 24px` (info, durasi, jumlah siswa, status, menu).
- Thumbnail 36×36px (di sini pakai gradient sebagai pengganti gambar).
- Status: **Completed** hijau bold, **Ongoing** dan **Upcoming** abu-abu.
- Daftar bisa di-scroll (tinggi maks 190px) dengan scrollbar tipis 4px berwarna hijau.

### 4.6 Line Chart (Students Participation)
- SVG buatan sendiri, viewBox `440×230`, kurva dihaluskan pakai Catmull-Rom ke Bezier.
- Sumbu Y: 0 sampai 200, kelipatan 50.
- Hover: garis vertikal, titik bulat (putih, stroke hijau), tooltip abu-abu dengan nilai.
- Dropdown **Monthly / Weekly** mengganti dataset dan label sumbu X.
- Digambar ulang saat window di-resize supaya posisi tooltip tetap akurat.

### 4.7 Daftar Siswa Terbaru
- Grid 4 kolom: nama (dengan avatar inisial), SID, kode kelas, skor.
- Skor rata kanan.

### 4.8 Donut Chart (Total Improvement)
- SVG lingkaran dengan `stroke-dasharray`, diputar -90° supaya mulai dari jam 12.
- Ketebalan stroke 22, jeda antar segmen 1.2 unit.
- Hover segmen: stroke menebal jadi 28 dan muncul tooltip native (`<title>`).
- Legend di kanan: titik warna, nama kategori, persentase.

---

## 5. Interaksi dan Motion

| Elemen | Efek | Durasi |
|---|---|---|
| Kartu statistik hover | Naik 4px + shadow | 250ms |
| Angka statistik | Count-up easing cubic-out | 900ms |
| Emoji 👋 | Rotasi bolak-balik, berulang | 2.4s loop |
| Tooltip chart | Fade in/out | 150ms |
| Segmen donut hover | Stroke menebal | 200ms |
| Link menu | Perubahan warna | 200ms |

---

## 6. Responsif

| Breakpoint | Perubahan |
|---|---|
| ≤ 1100px | Kartu statistik jadi 2 kolom; dua baris card jadi 1 kolom |
| ≤ 760px | Sidebar jadi bar horizontal di atas (hanya menu aktif yang menampilkan teks); Support/Logout disembunyikan; kartu statistik 1 kolom; kolom durasi dan jumlah siswa di tabel course disembunyikan; kolom SID siswa disembunyikan; padding body jadi 0 dan radius container 0 |

---

## 7. Catatan Implementasi

- **Aset:** tidak ada gambar eksternal. Avatar pakai inisial berwarna, thumbnail course pakai gradient, ikon pakai SVG sprite inline.
- **Dependensi:** tidak ada library JS. Satu-satunya resource eksternal adalah font Poppins dari Google Fonts.
- **Data:** semua hardcoded di array JS (`courses`, `students`, `datasets`, `parts`). Untuk produksi, ganti dengan response API.
- **Perbaikan dari referensi:** judul chart di desain asli tertulis "Participaion" (typo), di sini sudah dibenerin jadi "Participation".

## 8. Yang Belum Ada (Backlog)

- Dark mode.
- Fokus keyboard yang terlihat jelas (focus ring) di menu dan tab.
- Atribut ARIA untuk tabs dan chart (saat ini chart cuma visual).
- Fungsi search sungguhan; input-nya baru tampilan.
- State loading dan empty state selain di daftar course.
- Token `--green-dark` belum dipakai di mana pun.
