# SADITA.ai — Checklist Implementasi Operasional

Status awal audit: **backend fondasi tersedia, frontend masih satu halaman monolitik**. Item hanya ditandai selesai bila memiliki endpoint nyata, otorisasi, UI yang memanggil API, dan pengujian yang relevan.

## 1. Fondasi dan keamanan

- [ ] Tambah role `KETUA_KELAS` dan penetapan ketua per kelas pada PostgreSQL.
- [ ] Pastikan login menerima identitas yang didukung backend (email; NIM/username bila ditambahkan), JWT, refresh, dan `/auth/me`.
- [ ] Terapkan RBAC dan pemeriksaan kepemilikan kelas pada seluruh endpoint akademik, presensi, dan LMS.
- [ ] Buat route frontend terproteksi dan redirect berdasarkan role; blokir akses URL lintas role.
- [ ] Ganti halaman frontend monolitik dengan route dan layout per role.

## 2. Admin — Akademik

- [ ] Program studi: model, migrasi, CRUD, nonaktifkan, detail, test, dan halaman.
- [ ] Tahun akademik: list/create tersedia; tambah detail, edit, aktif/nonaktif, test, dan halaman.
- [ ] Mata kuliah: list/create tersedia; tambah detail, edit, hapus/nonaktif, test, dan halaman.
- [ ] Dosen: list/detail tersedia; tambah create/edit, assignment kelas/mata kuliah, test, dan halaman.
- [ ] Mahasiswa: list/detail/hardware tersedia; tambah create/edit/status, test, dan halaman.
- [ ] Kelas: list/detail/create/enroll/list peserta tersedia; tambah edit, nonaktifkan, filter prodi, hapus enrollment, test, dan halaman.

## 3. Admin — Presensi, LMS, dan perangkat

- [ ] Dashboard: seluruh metrik dari PostgreSQL; tambah aktivitas sistem terbaru dan device online/offline nyata.
- [ ] Sesi presensi: create/list/detail/open/close tersedia; tambah pembatasan akses dan UI lengkap.
- [ ] Rekap/riwayat/approval: endpoint agregat, pengajuan koreksi dan approval (admin/dosen), test, dan halaman.
- [ ] Materi dan tugas: create/list/detail/delete tersedia; tambah update/publish/file upload dengan storage nyata, test, dan halaman.
- [ ] Submission/nilai: submit/list/grade tersedia; tambah edit submission sesuai aturan, komponen/nilai akhir, test, dan halaman.
- [ ] Perangkat: inventaris device, assignment lokasi/kelas, heartbeat/event/error log dari MQTT, status nyata, SSE/WebSocket, test, dan halaman.

## 4. Dosen

- [ ] Dashboard dosen berbasis kelas milik dosen dan data aktual.
- [ ] Kelas saya: list/detail peserta, jadwal, statistik kehadiran dengan otorisasi kepemilikan.
- [ ] Workflow presensi: buka/tutup sesi, command MQTT, log event live via SSE/WebSocket, rekap hadir/belum hadir/terlambat/gagal.
- [ ] Materi dan tugas: CRUD yang hanya dapat dilakukan dosen pemilik kelas; upload/publish bila backend tersedia.
- [ ] Submission dan nilai: daftar submission, nilai/feedback, komponen nilai dan rekap akhir.

## 5. Mahasiswa dan Ketua Kelas

- [ ] Dashboard mahasiswa: jadwal, kelas berikutnya, status/rasio presensi, tugas/deadline/materi aktual.
- [ ] Jadwal, mata kuliah, materi, tugas, nilai, dan riwayat presensi hanya untuk enrollment pengguna.
- [ ] Pengumpulan tugas nyata (file/content) dan edit selama kebijakan mengizinkan.
- [ ] Kehadiran online: request ke backend sebagai pengajuan/validasi, bukan perubahan status final mandiri.
- [ ] Ketua kelas: data kelas, mahasiswa belum hadir, draft koreksi/pengajuan; tanpa hak mengubah presensi final.

## 6. Kualitas dan verifikasi

- [ ] Tidak ada array/data bisnis hardcoded atau status perangkat palsu di frontend.
- [ ] Semua mutation menampilkan validasi, loading, respons error backend, sukses, dan refresh data.
- [ ] Tambahkan/ubah test backend untuk setiap endpoint baru.
- [ ] Jalankan `npm run build`, `npm run lint`, dan `pytest`; perbaiki semua kegagalan.
