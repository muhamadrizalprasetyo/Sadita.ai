# AGENTS.md

Repo komponen UI publik dari tech.mudahdeal.com.

## Konteks proyek

- `elements/` berisi komponen UI terkecil.
- `sections/` berisi blok halaman siap pakai.
- `pages/` berisi halaman lengkap.
- Setiap komponen memakai React TSX, CSS mandiri, dan `preview.tsx`.
- `landing-dealtech-ui/` adalah aplikasi Vite untuk landing production dan playground.

## Peta komponen

Perbarui peta ini setiap kali komponen ditambah, dipindah, atau dihapus.

### Elements

- `Button/`: `ButtonV1`.
- `Card/`: `PriceCardV1`.
- `Footer/`: `SimpleFooterV1`, `SimpleFooterV2`.
- `Header/`: `SimpleHeaderV1`, `SimpleHeaderV2`.
- `Search/`: `SearchV1`, `SearchV2`.
- `TabButtons/`: `StyleV1`.
- `text/`: `HeadingStrokeV1`, `ParagrafV1`.

### Sections

- `About/`: `AboutV1` sampai `AboutV6`.
- `Chekout/`: `ChekoutV1`.
- `Compare/`: `SectionCompareV1` sampai `SectionCompareV3`.
- `Contact/`: `ContactV1` sampai `ContactV5`.
- `CTA/`: `CTAV1` sampai `CTAV6`.
- `FAQ/`: `FAQV1` sampai `FAQV5`.
- `Features/`: `CardListV1` sampai `CardListV4`.
- `Hero/`: `SectionV1` sampai `SectionV13`.
- `PriceList/`: `PricelistV1` sampai `PricelistV5`.
- `Service/`: `ServiceV1` sampai `ServiceV3`.
- `Testimonial/`: `ReviewV1` sampai `ReviewV7`.

## Aturan kode

- Satu komponen berada dalam satu folder.
- Komponen harus mandiri dan responsif.
- Section tidak boleh mengimpor element.
- Terapkan pola serupa secara mandiri.
- Gunakan ikon `lucide-react` bila diperlukan.
- Gunakan font `Inter` dan aksen biru.
- Background utama setiap section harus putih.
- Opasitas `box-shadow` dan `drop-shadow` pada elemen section maksimal 10% (`0.1`).
- Selaraskan `README.md` dan `README.en.md`.
- Komentar hanya bila perlu.
- Komentar maksimal lima kata.
- Jangan menumpuk komentar.

## Badge section

- Setiap section wajib memiliki badge nama dengan format `KATEGORI/NAMA_FOLDER`.
- Tampilkan teks badge dengan huruf kapital di playground.
- Badge wajib tanpa border dan memakai ikon informasi yang seragam.
- Badge wajib berupa tautan langsung ke folder section di repository.
- Gunakan URL lengkap `https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/KATEGORI/NAMA_FOLDER`.
- Buka tautan pada tab baru dengan `target="_blank"` dan `rel="noreferrer"`.

## Spacing section

- Jangan gunakan `min-height` pada root, shell, atau inner utama section.
- Atur tinggi section melalui konten dan padding vertikal.
- Ukuran judul utama Hero: `clamp(1.5rem, 3.1vw, 2.25rem)` dengan maksimum desktop `36px`.
- Ukuran judul utama section non-Hero: `clamp(1.5rem, 3.1vw, 2rem)` dengan maksimum desktop `32px`.
- Ikuti spacing Hero untuk seluruh section.
- Padding section desktop dan tablet di atas 640px: `45px 0`.
- Padding section mobile maksimal 640px: `36px 0 32px`.
- Pada mobile maksimal 640px, beri `padding-inline: 2px` jika masih `0`.
- Jangan tambah padding mobile jika padding horizontal sudah ada.
- Jangan gunakan `clamp` untuk padding vertikal section atau ukuran selain dua standar di atas.
- Container desktop: `min(1160px, calc(100% - 44px))`.
- Container mobile: `min(1160px, calc(100% - 36px))`.
- Gap dua kolom utama: `clamp(36px, 5vw, 72px)`.
- Gap ikon dan teks kecil: `7px`.
- Jarak eyebrow ke judul: `12px`.
- Jarak judul ke deskripsi: `9px`, mengikuti Hero.
- Jarak deskripsi ke tombol: `26px`.
- Jarak header ke konten utama: `clamp(34px, 5vw, 50px)`; mobile `32px`.
- Gap antarkartu: `10px`; mobile `8px`.
- Padding kartu standar: `22px 20px 18px`; mobile `19px 16px`.
- Ubah ukuran hanya jika struktur referensi memang membutuhkan.

## Commit

- Auto commit setelah perubahan selesai.
- Pesan commit singkat, jelas, dan terarah.
- Awali pesan dengan `add`, `improve`, atau `fix`.
- Jangan pakai nama Claude dalam pesan commit.

## Laporan

- Setelah selesai, cukup sampaikan `selesai`.
- Jangan jabarkan detail kecuali diminta.
