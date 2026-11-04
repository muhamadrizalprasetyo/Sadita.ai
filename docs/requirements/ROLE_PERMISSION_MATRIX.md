# SADITA.ai — Role Permission Matrix

**Versi:** 1.0  
**Tanggal:** 2026-10-30

---

## Legenda

| Simbol | Arti |
|---|---|
| ✅ | Diizinkan |
| ❌ | Ditolak |
| 🔒 | Diizinkan hanya pada scope sendiri (kelas/prodi/data sendiri) |
| 📋 | Diizinkan hanya dengan persetujuan/approval pihak berwenang |
| 👁️ | Hanya baca (read-only) |

---

## 1. Manajemen Akun dan Profil

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS* |
|---|---|---|---|---|---|
| Membuat akun pengguna | ✅ | ❌ | ❌ | ❌ | ❌ |
| Menonaktifkan akun | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mengubah role pengguna | ✅ | ❌ | ❌ | ❌ | ❌ |
| Melihat daftar semua pengguna | ✅ | 🔒 Prodi | ❌ | ❌ | ❌ |
| Melihat profil sendiri | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mengubah profil sendiri | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mengubah password sendiri | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reset password pengguna lain | ✅ | ❌ | ❌ | ❌ | ❌ |

*\*Ketua Kelas = Mahasiswa + assignment permission pada kelas tertentu*

---

## 2. Master Akademik

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| CRUD Program Studi | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD Tahun Akademik / Semester | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD Mata Kuliah (Course) | ✅ | 🔒 Prodi | ❌ | ❌ | ❌ |
| CRUD Kelas (CourseClass) | ✅ | 👁️ Prodi | ❌ | ❌ | ❌ |
| CRUD Ruangan (ClassRoom) | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD Jadwal kelas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Melihat jadwal kelas | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | 🔒 Kelas diikuti | 🔒 Kelas ditugaskan |

---

## 3. Enrollment dan KRS

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| Mendaftarkan mahasiswa ke kelas (enrollment) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Menghapus enrollment | ✅ (dengan audit) | ❌ | ❌ | ❌ | ❌ |
| Import KRS batch | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mengajukan KRS (tambah SKS / mengulang) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Memberi pertimbangan akademik KRS | ❌ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Approve/reject KRS (finalisasi) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Melihat daftar KRS | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | 🔒 KRS sendiri | 🔒 KRS sendiri |

---

## 4. Sesi Presensi

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| Membuat sesi presensi | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Membuka sesi (SCHEDULED → OPEN) | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Menutup sesi (OPEN → CLOSED) | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Melihat live attendance | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | ❌ | 🔒 Kelas ditugaskan |
| Melihat roster kelas | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | ❌ | 🔒 Kelas ditugaskan |
| Koreksi manual presensi (sesi aktif) | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Mengajukan koreksi presensi (setelah finalisasi) | ❌ | ❌ | 🔒 Kelas sendiri (ajukan) | ✅ (ajukan) | ✅ (ajukan) |
| Approve koreksi presensi final | ✅ | ❌ | ❌ | ❌ | ❌ |
| Melihat riwayat presensi sendiri | ❌ | ❌ | ❌ | 🔒 Data sendiri | 🔒 Data sendiri |
| Melihat rekap presensi kelas | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | ❌ | 🔒 Kelas ditugaskan |
| Finalisasi sesi (auto-ALFA) | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |

---

## 5. Materi dan LMS

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| Upload materi | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Publikasi materi | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Melihat materi | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | 🔒 Kelas diikuti (published) | 🔒 Kelas diikuti (published) |
| Download file materi | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | 🔒 Kelas diikuti | 🔒 Kelas diikuti |
| Membuat tugas | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Mengumpulkan tugas | ❌ | ❌ | ❌ | 🔒 Tugas kelas sendiri | 🔒 Tugas kelas sendiri |
| Menilai tugas | ❌ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Membuat kuis | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Mengerjakan kuis | ❌ | ❌ | ❌ | 🔒 Kuis kelas sendiri | 🔒 Kuis kelas sendiri |
| Melihat submission mahasiswa | ✅ | ❌ | 🔒 Kelas sendiri | 🔒 Submission sendiri | 🔒 Submission sendiri |

---

## 6. Penilaian

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| Input nilai komponen | ❌ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Mengubah bobot komponen | ✅ | ❌ | 🔒 Kelas sendiri (configurable) | ❌ | ❌ |
| Publikasi nilai ke mahasiswa | ❌ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Melihat nilai (published) | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | 🔒 Nilai sendiri | 🔒 Nilai sendiri |
| Melihat nilai (unpublished) | ✅ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Mengajukan koreksi nilai (post-publish) | ❌ | ❌ | 🔒 Kelas sendiri (ajukan) | ❌ | ❌ |
| Approve koreksi nilai | ✅ | ❌ | ❌ | ❌ | ❌ |
| Melihat KHS semester | ✅ | 🔒 Prodi | ❌ | 🔒 KHS sendiri | 🔒 KHS sendiri |

---

## 7. Perangkat IoT

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| Registrasi perangkat | ✅ | ❌ | ❌ | ❌ | ❌ |
| Nonaktifkan perangkat | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mengubah penempatan perangkat | ✅ (audit) | ❌ | ❌ | ❌ | ❌ |
| Melihat status perangkat | ✅ | ❌ | 🔒 Ruangan kelas sendiri | ❌ | ❌ |

---

## 8. Dashboard dan Laporan

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| Dashboard sistem (semua data) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dashboard prodi | ✅ | 🔒 Prodi | ❌ | ❌ | ❌ |
| Dashboard kelas dosen | ❌ | ❌ | 🔒 Kelas sendiri | ❌ | ❌ |
| Dashboard mahasiswa | ❌ | ❌ | ❌ | 🔒 Data sendiri | 🔒 Data sendiri |
| Monitoring presensi kelas (ketua kelas) | ❌ | ❌ | ❌ | ❌ | 🔒 Kelas ditugaskan |
| Ekspor laporan CSV/PDF | ✅ | 🔒 Prodi | 🔒 Kelas sendiri | ❌ | ❌ |

---

## 9. Audit Log

| Aksi | ADMIN | KAPRODI | DOSEN | MAHASISWA | KETUA KELAS |
|---|---|---|---|---|---|
| Melihat audit log (semua) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Melihat audit log (prodi) | ✅ | 🔒 Prodi | ❌ | ❌ | ❌ |
| Menghapus audit log | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 10. Ketua Kelas — Permission Tambahan

Ini adalah permission **scoped pada kelas tertentu** yang diberikan melalui `ClassLeaderAssignment`, bukan role terpisah.

| Aksi | Scope | Detail |
|---|---|---|
| Melihat roster kelas | Kelas yang ditugaskan | Daftar mahasiswa terdaftar |
| Monitoring status presensi | Kelas yang ditugaskan | Siapa sudah/belum hadir pada sesi aktif |
| Memverifikasi bukti permohonan | Kelas yang ditugaskan | Membantu memeriksa bukti (bukan memutuskan) |
| Mengajukan permohonan koreksi | Kelas yang ditugaskan | Bukan menyetujui; hanya mengajukan |

**Pembatasan:**
- Tidak boleh mengubah status presensi secara langsung
- Tidak boleh menyetujui permohonannya sendiri
- Assignment memiliki masa berlaku (`is_active`, `assigned_at`)
- Admin yang menetapkan/mengakhiri penugasan

---

*Matrix ini harus divalidasi terhadap implementasi backend. Setiap sel ❌ harus memiliki test yang membuktikan penolakan akses.*
