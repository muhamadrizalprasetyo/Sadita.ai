"""
SADITA — Academic Models (v2)
Semester, Mata Kuliah, Ruangan, Kelas, dan Enrollment.

Desain untuk UNIPI yang mendukung:
  - Reguler Pagi
  - Reguler Malam
  - SHIFT (sesi pagi/malam, dosen bisa berbeda)

ClassType dan SessionType untuk membedakan jenis kelas dan sesi.
"""
from __future__ import annotations

import enum
from datetime import date, datetime, time, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.program_studi import ProgramStudi
    from app.models.lecturer import LecturerProfile
    from app.models.student import StudentProfile
    from app.models.device import SaditaDevice
    from app.models.attendance import AttendanceSession


class ClassType(str, enum.Enum):
    """
    Tipe kelas/kelas perkuliahan di UNIPI.
    Penting: SHIFT dapat memiliki sesi pagi DAN malam dengan dosen yang berbeda.
    """
    REGULER_PAGI = "REGULER_PAGI"
    REGULER_MALAM = "REGULER_MALAM"
    SHIFT = "SHIFT"


class EnrollmentType(str, enum.Enum):
    REGULER = "REGULER"
    TAMBAH_SKS = "TAMBAH_SKS"
    MENGULANG = "MENGULANG"


class KrsRequestType(str, enum.Enum):
    TAMBAH_SKS = "TAMBAH_SKS"
    MENGULANG = "MENGULANG"


class KrsRequestStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class EnrollmentStatus(str, enum.Enum):
    AKTIF = "AKTIF"
    DROP = "DROP"           # Mahasiswa drop mata kuliah
    CUTI = "CUTI"           # Mahasiswa cuti semester berjalan
    LULUS = "LULUS"         # Sudah menyelesaikan mata kuliah


class AcademicTerm(Base):
    """Semester akademik. Contoh: Ganjil 2026/2027, Genap 2026/2027."""
    __tablename__ = "academic_terms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nama: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    # Contoh: "Ganjil 2026/2027"
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Hanya satu semester boleh aktif pada satu waktu
    tanggal_mulai: Mapped[date] = mapped_column(Date, nullable=False)
    tanggal_selesai: Mapped[date] = mapped_column(Date, nullable=False)

    classes: Mapped[List["CourseClass"]] = relationship(
        "CourseClass",
        back_populates="term",
        cascade="all, delete-orphan",
    )

    def __init__(self, **kwargs):
        if "name" in kwargs and "nama" not in kwargs:
            kwargs["nama"] = kwargs.pop("name")
        if "start_date" in kwargs and "tanggal_mulai" not in kwargs:
            kwargs["tanggal_mulai"] = kwargs.pop("start_date")
        if "end_date" in kwargs and "tanggal_selesai" not in kwargs:
            kwargs["tanggal_selesai"] = kwargs.pop("end_date")
        super().__init__(**kwargs)

    @property
    def name(self) -> str:
        return self.nama

    @name.setter
    def name(self, val: str):
        self.nama = val

    @property
    def start_date(self) -> date:
        return self.tanggal_mulai

    @start_date.setter
    def start_date(self, val: date):
        self.tanggal_mulai = val

    @property
    def end_date(self) -> date:
        return self.tanggal_selesai

    @end_date.setter
    def end_date(self, val: date):
        self.tanggal_selesai = val

    def __repr__(self) -> str:
        return f"<AcademicTerm id={self.id} nama='{self.nama}' active={self.is_active}>"


class Course(Base):
    """Mata Kuliah. Linked ke Program Studi."""
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prodi_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("program_studi.id", ondelete="RESTRICT"), nullable=False, default=1
    )
    kode: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    # Contoh: "IF201", "TI301"
    nama: Mapped[str] = mapped_column(String(200), nullable=False)
    sks: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    # Semester ke-berapa mata kuliah ini biasanya diambil
    semester_ke: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    deskripsi: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    program_studi: Mapped["ProgramStudi"] = relationship(
        "ProgramStudi", back_populates="mata_kuliah"
    )
    classes: Mapped[List["CourseClass"]] = relationship(
        "CourseClass",
        back_populates="course",
        cascade="all, delete-orphan",
    )

    def __init__(self, **kwargs):
        if "code" in kwargs and "kode" not in kwargs:
            kwargs["kode"] = kwargs.pop("code")
        if "name" in kwargs and "nama" not in kwargs:
            kwargs["nama"] = kwargs.pop("name")
        if "credits" in kwargs and "sks" not in kwargs:
            kwargs["sks"] = kwargs.pop("credits")
        if "description" in kwargs and "deskripsi" not in kwargs:
            kwargs["deskripsi"] = kwargs.pop("description")
        if "prodi_id" not in kwargs:
            kwargs["prodi_id"] = 1
        super().__init__(**kwargs)

    @property
    def code(self) -> str:
        return self.kode

    @code.setter
    def code(self, val: str):
        self.kode = val

    @property
    def credits(self) -> int:
        return self.sks

    @credits.setter
    def credits(self, val: int):
        self.sks = val

    @property
    def name(self) -> str:
        return self.nama

    @name.setter
    def name(self, val: str):
        self.nama = val

    def __repr__(self) -> str:
        return f"<Course id={self.id} kode='{self.kode}' nama='{self.nama}'>"


class ClassRoom(Base):
    """Ruang kuliah / lab. Perangkat SADITA terpasang di sini."""
    __tablename__ = "class_rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kode: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    # Contoh: "R301", "LAB-IOT-1"
    nama: Mapped[str] = mapped_column(String(150), nullable=False)
    kapasitas: Mapped[int] = mapped_column(Integer, default=40, nullable=False)
    gedung: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    lantai: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    classes: Mapped[List["CourseClass"]] = relationship(
        "CourseClass", back_populates="room"
    )
    devices: Mapped[List["SaditaDevice"]] = relationship(
        "SaditaDevice", back_populates="room"
    )

    def __init__(self, **kwargs):
        if "name" in kwargs and "nama" not in kwargs:
            kwargs["nama"] = kwargs.pop("name")
        if "capacity" in kwargs and "kapasitas" not in kwargs:
            kwargs["kapasitas"] = kwargs.pop("capacity")
        if "kode" not in kwargs:
            nama_val = kwargs.get("nama", "ROOM")
            kwargs["kode"] = str(nama_val)[:10].replace(" ", "-").upper()
        super().__init__(**kwargs)

    @property
    def capacity(self) -> int:
        return self.kapasitas

    @capacity.setter
    def capacity(self, val: int):
        self.kapasitas = val

    @property
    def name(self) -> str:
        return self.nama

    @name.setter
    def name(self, val: str):
        self.nama = val

    @property
    def code(self) -> str:
        return self.kode

    @code.setter
    def code(self, val: str):
        self.kode = val

    @property
    def building(self) -> Optional[str]:
        return self.gedung

    @building.setter
    def building(self, val: Optional[str]):
        self.gedung = val

    @property
    def floor(self) -> Optional[int]:
        return self.lantai

    @floor.setter
    def floor(self, val: Optional[int]):
        self.lantai = val

    def __repr__(self) -> str:
        return f"<ClassRoom id={self.id} kode='{self.kode}' nama='{self.nama}'>"


class CourseClass(Base):
    """
    Kelas kuliah satu semester.
    Satu mata kuliah bisa punya banyak kelas (Pagi-A, Pagi-B, Malam, Shift-Pagi, Shift-Malam).
    SHIFT: dua kelas berbeda yang memiliki jadwal berbeda dan dosen yang bisa berbeda.
    """
    __tablename__ = "course_classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False
    )
    term_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("academic_terms.id", ondelete="RESTRICT"), nullable=False
    )
    lecturer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lecturer_profiles.id", ondelete="RESTRICT"), nullable=False
    )
    room_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("class_rooms.id", ondelete="SET NULL"), nullable=True
    )

    # Identitas kelas
    kode_kelas: Mapped[str] = mapped_column(String(50), nullable=False)
    # Contoh: "TI-2024-IF201-PAGI-A", "TI-2024-IF201-MALAM", "TI-2024-IF201-SHIFT-PAGI"
    class_type: Mapped[ClassType] = mapped_column(
        Enum(ClassType, name="class_type_enum", create_constraint=True),
        default=ClassType.REGULER_PAGI,
        nullable=False,
    )

    # Jadwal
    hari: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    # 1=Senin, 2=Selasa, ..., 7=Minggu
    jam_mulai: Mapped[time] = mapped_column(Time, nullable=False, default=time(8, 0))
    jam_selesai: Mapped[time] = mapped_column(Time, nullable=False, default=time(10, 30))
    # Batas keterlambatan dalam menit
    batas_terlambat_menit: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    # Total pertemuan semester ini
    total_pertemuan: Mapped[int] = mapped_column(Integer, default=16, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="classes")
    term: Mapped["AcademicTerm"] = relationship("AcademicTerm", back_populates="classes")
    lecturer: Mapped["LecturerProfile"] = relationship(
        "LecturerProfile", back_populates="classes"
    )
    room: Mapped[Optional["ClassRoom"]] = relationship("ClassRoom", back_populates="classes")
    enrollments: Mapped[List["ClassEnrollment"]] = relationship(
        "ClassEnrollment",
        back_populates="course_class",
        cascade="all, delete-orphan",
    )
    attendance_sessions: Mapped[List["AttendanceSession"]] = relationship(
        "AttendanceSession",
        back_populates="course_class",
        cascade="all, delete-orphan",
    )

    def __init__(self, **kwargs):
        if "name" in kwargs and "kode_kelas" not in kwargs:
            kwargs["kode_kelas"] = kwargs.pop("name")
        if "day_of_week" in kwargs and "hari" not in kwargs:
            kwargs["hari"] = kwargs.pop("day_of_week")
        if "start_time" in kwargs and "jam_mulai" not in kwargs:
            kwargs["jam_mulai"] = kwargs.pop("start_time")
        if "end_time" in kwargs and "jam_selesai" not in kwargs:
            kwargs["jam_selesai"] = kwargs.pop("end_time")
        super().__init__(**kwargs)

    @staticmethod
    def _normalize_display_name(value: str) -> str:
        if not value:
            return value
        normalized = value.strip()
        for raw, replacement in (
            ("PAGI", "Pagi"),
            ("MALAM", "Malam"),
            ("SHIFT", "Shift"),
            ("SENIN", "Senin"),
            ("SELASA", "Selasa"),
            ("RABU", "Rabu"),
            ("KAMIS", "Kamis"),
            ("JUMAT", "Jumat"),
            ("SABTU", "Sabtu"),
            ("MINGGU", "Minggu"),
        ):
            normalized = normalized.replace(raw, replacement)
        return normalized

    @property
    def name(self) -> str:
        return self._normalize_display_name(self.kode_kelas)

    @name.setter
    def name(self, val: str):
        self.kode_kelas = val.strip() if val else val

    @property
    def day_of_week(self) -> int:
        return self.hari

    @day_of_week.setter
    def day_of_week(self, val: int):
        self.hari = val

    @property
    def start_time(self) -> time:
        return self.jam_mulai

    @start_time.setter
    def start_time(self, val: time):
        self.jam_mulai = val

    @property
    def end_time(self) -> time:
        return self.jam_selesai

    @end_time.setter
    def end_time(self, val: time):
        self.jam_selesai = val

    def __repr__(self) -> str:
        return f"<CourseClass id={self.id} kode='{self.kode_kelas}' type={self.class_type}>"


class ClassEnrollment(Base):
    """KRS mahasiswa — mahasiswa mendaftar ke kelas tertentu."""
    __tablename__ = "class_enrollments"
    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_class_student_enrollment"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("course_classes.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, name="enrollment_status_enum", create_constraint=True),
        default=EnrollmentStatus.AKTIF,
        nullable=False,
    )
    enrollment_type: Mapped[EnrollmentType] = mapped_column(
        Enum(EnrollmentType, name="enrollment_type_enum", create_constraint=False),
        default=EnrollmentType.REGULER,
        nullable=False,
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    course_class: Mapped["CourseClass"] = relationship(
        "CourseClass", back_populates="enrollments"
    )
    student: Mapped["StudentProfile"] = relationship(
        "StudentProfile", back_populates="enrollments"
    )

    def __init__(self, **kwargs):
        status_val = kwargs.get("status")
        if isinstance(status_val, str) and status_val.upper() in ("ACTIVE", "AKTIF"):
            kwargs["status"] = EnrollmentStatus.AKTIF
        super().__init__(**kwargs)

    def __repr__(self) -> str:
        return f"<ClassEnrollment id={self.id} class_id={self.class_id} student_id={self.student_id} status={self.status} type={self.enrollment_type}>"


class KrsRequest(Base):
    """
    Permohonan Tambah SKS / Mengulang Mata Kuliah oleh Mahasiswa.
    Memerlukan persetujuan Dosen Pengampu kelas terkait.
    """
    __tablename__ = "krs_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("course_classes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    request_type: Mapped[KrsRequestType] = mapped_column(
        Enum(KrsRequestType, name="krs_request_type_enum", create_constraint=False),
        nullable=False,
    )
    status: Mapped[KrsRequestStatus] = mapped_column(
        Enum(KrsRequestStatus, name="krs_request_status_enum", create_constraint=False),
        default=KrsRequestStatus.PENDING_APPROVAL,
        nullable=False,
        index=True,
    )
    alasan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    enrollment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("class_enrollments.id", ondelete="SET NULL"), nullable=True
    )

    student: Mapped["StudentProfile"] = relationship("StudentProfile")
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    enrollment: Mapped[Optional["ClassEnrollment"]] = relationship("ClassEnrollment")

    def __repr__(self) -> str:
        return f"<KrsRequest id={self.id} student={self.student_id} class={self.class_id} type={self.request_type} status={self.status}>"
