<div align="center">

<img src="https://ik.imagekit.io/sja4kckbn/AsetDealTech/panel%20dealtechui.png" alt="DealTech UI" width="100%" />

# DealTech UI — Public Components

**Kumpulan komponen UI siap pakai: Elements, Sections, dan Pages.**

`#PakaiAiTapiBerasaBukanAi`

Dikembangkan oleh [tech.mudahdeal.com](https://tech.mudahdeal.com)

🇮🇩 **Bahasa Indonesia** · [🇬🇧 English](README.en.md)

</div>

---

## Tentang Repo Ini

Repo ini berisi komponen antarmuka (UI) yang kami pilih dan rapikan sendiri, supaya bisa dipakai siapa saja — entah sebagai **referensi** saat membangun sesuatu, atau **langsung disalin** ke dalam project kamu.

Tidak ada instalasi wajib, tidak ada dependency yang mengikat. Ambil yang kamu butuhkan, ubah sesuka hati.

Setiap section dikustomisasi satu per satu, bukan dibuat massal dari template generik. Layout, spacing, warna, dan responsivitasnya sudah dirapikan agar punya karakter sendiri sekaligus tetap konsisten dengan koleksi DealTech UI.

Untuk workflow berbasis AI, cukup berikan section yang dipilih sebagai acuan. AI dapat langsung fokus pada integrasi, konten, dan kebutuhan produk tanpa menghabiskan banyak token hanya untuk merancang UI dari nol.

### `#PakaiAiTapiBerasaBukanAi`

Website hasil AI sering ketahuan: tata letak seragam, gaya itu-itu saja, rasanya bukan buatan orang. Masalahnya bukan AI-nya, tapi AI tidak punya acuan.

Repo ini jadi acuan itu. Arahkan AI ke komponen di sini, dan hasilnya jadi lebih **mudah** — tidak perlu menjelaskan ulang dari nol — sekaligus lebih **konsisten**, karena semua bagian halaman berangkat dari kumpulan yang sama.

Pakai AI, tapi hasil akhirnya tidak berasa AI.

## Isi Repo

Isi repo dibagi jadi tiga folder di akar, supaya langsung ketemu:

| Folder | Isi | Contoh |
|---|---|---|
| [`elements/`](elements/) | Unit terkecil — satu tugas, satu tampilan. | Button, Badge, Input, Card, Avatar, Modal |
| [`sections/`](sections/) | Gabungan beberapa element menjadi satu bagian halaman. | Hero, Features, About, Pricing, Testimonial, FAQ |
| [`pages/`](pages/) | Halaman lengkap, hasil rangkaian beberapa komponen. | Landing page, Login, Dashboard, Pricing, 404 |

> Beberapa bagian yang digunakan di `sections/` mungkin tidak tersedia di `elements/`. Folder `elements/` hanya menyimpan elemen dasar, sedangkan setiap section menyertakan kebutuhannya sendiri agar dapat berdiri sendiri tanpa bergantung pada komponen di `elements/`.

## Struktur Folder

```
dealtech-ui-for-public-component/
├── elements/      # unit terkecil (button, input, card, ...)
├── sections/      # bagian halaman (hero, pricing, testimonial, ...)
├── pages/         # halaman utuh
└── landing-dealtech-ui/ # landing production dan playground
```

> Koleksi akan terus ditambahkan secara bertahap.

## Cara Pakai

1. Telusuri folder sesuai yang kamu cari — `elements`, `sections`, atau `pages`.
2. Buka folder komponennya, baca `README.md` di dalamnya (kalau ada) untuk catatan singkat.
3. Salin file ke project kamu.
4. Sesuaikan warna, teks, dan spacing dengan kebutuhan.

Tidak perlu fork, tidak perlu kredit, tidak perlu lapor.

## Konvensi Penamaan

Supaya konsisten dan gampang dicari:

- Nama folder komponen: `kebab-case` — contoh `pricing-table`, `hero-split`.
- Satu komponen = satu folder, berisi file komponen + preview-nya.
- Kalau ada beberapa varian, pakai sufiks jelas: `hero-split`, `hero-centered`, `hero-video`.

## Kontribusi

Punya komponen yang menurutmu layak dibagikan? Silakan buka Pull Request. Yang kami jaga cuma tiga hal:

- **Berdiri sendiri** — tidak bergantung pada kode internal project lain.
- **Rapi** — penamaan konsisten, tidak ada kode mati.
- **Responsif** — tampil wajar di layar kecil maupun besar.

## Disclaimer

> **Repo ini bebas digunakan tanpa perlu izin dari kami.**
>
> Boleh disalin, diubah, dipakai untuk keperluan pribadi maupun komersial, dengan atau tanpa mencantumkan sumber. Tidak perlu mengirim permintaan, tidak perlu menunggu persetujuan.
>
> Project ini murni dikembangkan atas dasar keinginan untuk menciptakan lingkungan yang mudah dan mendorong sosialisasi di dunia internet — supaya orang yang baru belajar punya titik awal, dan yang sudah terbiasa tidak perlu menulis ulang hal yang sama.
>
> Komponen disediakan **apa adanya (as is)**, tanpa jaminan dalam bentuk apa pun. Risiko penggunaan ada pada pemakai. Silakan uji sendiri sebelum dipakai di production.

## Lisensi

[MIT](LICENSE) — sebebas mungkin, sesuai semangat di atas.

---

<div align="center">

Dibuat dan dirawat oleh **[tech.mudahdeal.com](https://tech.mudahdeal.com)**

</div>
