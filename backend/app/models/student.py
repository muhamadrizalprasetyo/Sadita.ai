"""
SADITA — Student Profile Model (v2)
Mahasiswa dengan status KTM yang proper, linked ke ProgramStudi.

Status KTM:
  BELUM_MEMILIKI_KTM  — Mahasiswa baru belum dapat KTM dari kampus
  KTM_TERDAFTAR       — KTM sudah terdaftar di sistem (punya RFID UID)
  KTM_HILANG          — KTM pernah terdaftar tapi dilaporkan hilang
  KTM_TIDAK_DIBAWA    — KTM ada tapi tidak dibawa hari ini (diset oleh operator/dosen saat kuliah)
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.program_studi import ProgramStudi
    from app.models.academic import ClassEnrollment
    from app.models.attendance import AttendanceRecord
    from app.models.credential import RfidCredential, FingerprintCredential


class KtmStatus(str, enum.Enum):
    """
    Status kepemilikan dan ketersediaan KTM mahasiswa.
    PENTING:
      - BELUM_MEMILIKI_KTM ≠ KTM_TIDAK_DIBAWA
      - Mahasiswa yang BELUM_MEMILIKI_KTM bisa mendaftar fingerprint terlebih dahulu
        dan absen via fingerprint saja hingga KTM diterbitkan dan didaftarkan.
      - Mahasiswa yang KTM_TIDAK_DIBAWA diasumsikan memiliki KTM terdaftar tapi
        lupa/sengaja tidak membawanya hari ini.
    """
    BELUM_MEMILIKI_KTM = "BELUM_MEMILIKI_KTM"
    KTM_TERDAFTAR = "KTM_TERDAFTAR"
    KTM_HILANG = "KTM_HILANG"
    KTM_TIDAK_DIBAWA = "KTM_TIDAK_DIBAWA"


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    prodi_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("program_studi.id", ondelete="RESTRICT"),
        nullable=False,
    )
    nim: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    angkatan: Mapped[int] = mapped_column(Integer, nullable=False)
    # Tahun masuk, bukan tahun lahir. Contoh: 2024

    # Status KTM (bukan RFID UID langsung — itu di RfidCredential)
    ktm_status: Mapped[KtmStatus] = mapped_column(
        Enum(KtmStatus, name="ktm_status_enum", create_constraint=True),
        default=KtmStatus.BELUM_MEMILIKI_KTM,
        nullable=False,
    )

    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="student_profile")
    program_studi: Mapped["ProgramStudi"] = relationship(
        "ProgramStudi", back_populates="mahasiswa"
    )
    enrollments: Mapped[List["ClassEnrollment"]] = relationship(
        "ClassEnrollment",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    attendance_records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    rfid_credentials: Mapped[List["RfidCredential"]] = relationship(
        "RfidCredential",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    fingerprint_credentials: Mapped[List["FingerprintCredential"]] = relationship(
        "FingerprintCredential",
        back_populates="student",
        cascade="all, delete-orphan",
    )

    @property
    def active_rfid(self) -> Optional["RfidCredential"]:
        """Kembalikan RFID credential aktif (tidak hilang/dinonaktifkan)."""
        for cred in self.rfid_credentials:
            if cred.is_active:
                return cred
        return None

    @property
    def active_fingerprint(self) -> Optional["FingerprintCredential"]:
        """Kembalikan fingerprint credential aktif."""
        for cred in self.fingerprint_credentials:
            if cred.is_active:
                return cred
        return None

    def __init__(self, **kwargs):
        from app.models.credential import RfidCredential, FingerprintCredential

        if "prodi_id" not in kwargs:
            kwargs["prodi_id"] = 1
        if "batch_year" in kwargs and "angkatan" not in kwargs:
            kwargs["angkatan"] = kwargs.pop("batch_year")
        elif "angkatan" not in kwargs:
            kwargs["angkatan"] = 2024
        if "department" in kwargs:
            kwargs.pop("department", None)
        rfid = kwargs.pop("rfid_uid", None)
        fp_id = kwargs.pop("fingerprint_template_id", None)
        super().__init__(**kwargs)
        if rfid:
            self.rfid_credentials.append(RfidCredential(uid=rfid.upper(), is_active=True))
            self.ktm_status = KtmStatus.KTM_TERDAFTAR
        if fp_id is not None:
            self.fingerprint_credentials.append(
                FingerprintCredential(
                    device_id="SADITA-ESP32-LAB-01",
                    template_slot=fp_id,
                    finger_label="Telunjuk Kanan",
                    is_active=True,
                )
            )

    @property
    def rfid_uid(self) -> Optional[str]:
        rfid = self.active_rfid
        return rfid.uid if rfid else None

    @property
    def fingerprint_template_id(self) -> Optional[int]:
        fp = self.active_fingerprint
        return fp.template_slot if fp else None

    @property
    def department(self) -> str:
        return self.program_studi.nama if self.program_studi else ""

    @property
    def batch_year(self) -> int:
        return self.angkatan

    def __repr__(self) -> str:
        return f"<StudentProfile id={self.id} nim='{self.nim}' ktm={self.ktm_status}>"
