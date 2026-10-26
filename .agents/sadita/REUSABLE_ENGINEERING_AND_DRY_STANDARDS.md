# Standar Rekayasa Kode Reusable & Prinsip DRY (Don't Repeat Yourself) SADITA.ai

Dokumen ini mendefinisikan standar eliminasi duplikasi kode (*Don't Repeat Yourself*) dan implementasi komponen modular yang dapat digunakan kembali (*reusable*) secara maksimal pada backend (FastAPI) dan frontend (Next.js).

---

## 1. Filosofi Reusable Engineering

1. **Aturan Tiga Kali (Rule of Three)**: Jika logika atau pola UI yang sama ditulis dua kali, evaluasi. Jika ditulis tiga kali, **wajib** diekstraksi menjadi komponen atau helper bersama.
2. **Komposisi daripada Pewarisan Ekstrem**: Utamakan *composition over inheritance* untuk fleksibilitas komponen frontend, dan manfaatkan generic typing di backend untuk efisiensi CRUD.
3. **Penyatuan Kontrak Respon (Single Source of Truth)**: Format data input dan output antara server dan client harus seragam di seluruh modul sistem.

---

## 2. Pola Reusability Backend (FastAPI + Pydantic v2)

### 2.1 Standardized API Response Envelope
Seluruh endpoint di SADITA.ai wajib mengembalikan payload JSON terstandar dengan envelope `ApiResponse[T]`:

```python
# File: backend/app/schemas/common.py
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")

class PaginationMeta(BaseModel):
    page: int = Field(..., example=1)
    limit: int = Field(..., example=20)
    total_records: int = Field(..., example=150)
    total_pages: int = Field(..., example=8)
    has_next: bool = Field(..., example=True)
    has_prev: bool = Field(..., example=False)

class ApiResponse(BaseModel, Generic[DataT]):
    success: bool = True
    status_code: int = 200
    message: str = "Operasi berhasil"
    data: Optional[DataT] = None
    meta: Optional[PaginationMeta] = None

class ApiErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    code: Optional[str] = None

class ApiErrorResponse(BaseModel):
    success: bool = False
    status_code: int
    message: str
    errors: Optional[List[ApiErrorDetail]] = None
```

### 2.2 Reusable Pagination & Query Helper
Untuk mencegah penulisan query limit/offset berulang kali:

```python
# File: backend/app/repositories/pagination.py
from typing import TypeVar, List, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.schemas.common import PaginationMeta

T = TypeVar("T")

def paginate_query(
    db: Session,
    stmt,
    page: int = 1,
    limit: int = 20
) -> Tuple[List[Any], PaginationMeta]:
    """
    Eksekusi query dengan paginasi terpusat dan perhitungan metadata otomatis.
    """
    page = max(1, page)
    limit = max(1, min(100, limit))  # Batasi limit maksimal 100 untuk performa
    skip = (page - 1) * limit

    # Hitung total records menggunakan subquery count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_records = db.execute(count_stmt).scalar_one()

    # Eksekusi paginated data
    paginated_stmt = stmt.offset(skip).limit(limit)
    items = list(db.execute(paginated_stmt).scalars().all())

    total_pages = (total_records + limit - 1) // limit if total_records > 0 else 1

    meta = PaginationMeta(
        page=page,
        limit=limit,
        total_records=total_records,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )
    return items, meta
```

### 2.3 Global Exception Handling & Translation
Exception ditangani secara terpusat di `main.py` agar router tetap ramping:

```python
# File: backend/app/core/middleware.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.schemas.common import ApiErrorResponse, ApiErrorDetail
from app.core.exceptions import BusinessRuleException, NotFoundException, UnauthorizedException

async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, NotFoundException):
        status_code = status.HTTP_404_NOT_FOUND
        message = str(exc)
    elif isinstance(exc, BusinessRuleException):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        message = str(exc)
    elif isinstance(exc, UnauthorizedException):
        status_code = status.HTTP_403_FORBIDDEN
        message = str(exc)
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        message = "Terjadi kesalahan internal pada server."

    payload = ApiErrorResponse(
        success=False,
        status_code=status_code,
        message=message
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())
```

---

## 3. Pola Reusability Frontend (Next.js + React 19)

### 3.1 Universal Data Table (`DataTable<T>`)
Komponen tabel serbaguna untuk seluruh modul (Mahasiswa, Dosen, Kelas, Presensi, Nilai, Audit Log):

```tsx
// File: frontend/components/ui/data-table.tsx
'use client';

import React from 'react';
import styles from './data-table.module.css';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Tidak ada data ditemukan.',
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={styles.skeletonContainer}>
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || 'left' }}
                className={styles.th}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={item.id || idx}
              onClick={() => onRowClick && onRowClick(item)}
              className={onRowClick ? styles.clickableRow : styles.row}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align || 'left' }}
                  className={styles.td}
                >
                  {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={pagination.currentPage <= 1}
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            className={styles.pageBtn}
          >
            Sebelumnya
          </button>
          <span className={styles.pageInfo}>
            Halaman {pagination.currentPage} dari {pagination.totalPages}
          </span>
          <button
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            className={styles.pageBtn}
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
```

#### Modul Admin yang Mengadopsi Universal `DataTable<T>` 100%:
Seluruh tabel operasional di Admin Dashboard telah distandarisasi menggunakan `DataTable<T>` (`frontend/components/ui/data-table.tsx`):
1. **Tahun Akademik & Semester** (`/admin/akademik/tahun-akademik`): `DataTable<AcademicTerm>` (pencarian nama, filter status semester aktif/selesai, sorting kalender, paginasi).
2. **Katalog Mata Kuliah** (`/admin/akademik/mata-kuliah`): `DataTable<Course>` (pencarian kode/nama, filter bobot SKS & semester rekomendasi, sorting, paginasi).
3. **Kelas & Enrollment KRS** (`/admin/akademik/kelas`): `DataTable<CourseClass>` (pencarian rombel/dosen/ruangan, filter cohort TEKFO 1–8, hari, jenis kelas, sorting jadwal, dan sub-modal `DataTable<ClassEnrollment>`).
4. **Direktori Dosen Pengajar** (`/admin/akademik/dosen`): `DataTable<LecturerProfile>` (pencarian NIDN/nama, sorting, penugasan kelas badge).
5. **Direktori Mahasiswa** (`/admin/akademik/mahasiswa`): `DataTable<StudentProfile>` (pencarian NPM/nama, filter cohort TEKFO, jenis kelas pagi/malam/shift, status KTM/RFID).
6. **Perangkat Presensi IoT** (`/admin/perangkat`): `DataTable<SaditaDevice>` (tampilan switchable tabel & kartu, status online/offline, IP, firmware, broker MQTT).
7. **Monitoring Sesi Presensi** (`/admin/presensi`): `DataTable<AttendanceSession>` (pencarian topik/tanggal, filter status sesi terbuka/selesai/terjadwal).
8. **LMS Materi & Tugas** (`/admin/lms`, `/admin/lms/materi`, `/admin/lms/tugas`): `DataTable<CourseMaterial | Assignment>` (pencarian judul, deadline, pengumpulan berkas PDF).
9. **Workspace Presensi Terpadu** (`/admin/presensi/sesi`): `DataTable<AttendanceSession>` & `DataTable<AttendanceRequest>` (kontrol buka/tutup sesi, verifikasi kehadiran sesi pengganti).
10. **Manajemen Pengguna & Hak Akses** (`/admin/users`): `DataTable<UserItem>` (filter multi-role, visibilitas status aktif, seleksi baris, aksi massal).
11. **Admin Main Dashboard** (`/admin/dashboard`): `DataTable<CourseClass>` (monitoring kelas harian terintegrasi).

### 3.2 Universal Modal & Dialog Primitives
Untuk form tambah data, edit data, dan konfirmasi tindakan penting tanpa menulis boilerplate HTML dialog berulang kali:

```tsx
// File: frontend/components/ui/modal.tsx
'use client';

import React, { useEffect } from 'react';
import styles from './modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${styles[maxWidth]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup Modal">
            &times;
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
```

### 3.3 Reusable Custom Hooks (State & Data Fetching)

```typescript
// File: frontend/lib/hooks/use-table-data.ts
import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '@/lib/services/base-api.service';

interface UseTableDataOptions<T> {
  fetcher: (params: { page: number; limit: number; search?: string }) => Promise<ApiResponse<T[]>>;
  initialLimit?: number;
}

export function useTableData<T>({ fetcher, initialLimit = 15 }: UseTableDataOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher({ page, limit: initialLimit, search });
      setData(response.data || []);
      if (response.meta) {
        setTotalPages(response.meta.totalPages);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data.');
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, initialLimit, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    setPage,
    search,
    setSearch,
    refetch: loadData,
  };
}
```

---

## 4. Keuntungan Penerapan DRY di SADITA.ai

1. **Pengurangan Baris Kode**: Menurunkan volume boilerplate hingga 60% pada penulisan endpoint CRUD dan halaman dashboard.
2. **Kesesuaian Standar**: Mengubah aturan paginasi, format tanggal, atau enkapsulasi error di satu tempat (`common.py` atau `data-table.tsx`) otomatis memperbarui seluruh modul.
3. **Peningkatan Kualitas Pengujian**: Komponen inti yang sering dipakai ulang memiliki cakupan pengujian unit yang kuat dan teruji di lingkungan produksi.
