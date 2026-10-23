"""
SADITA — Hardware Credential Models (v2)
Memisahkan RFID dan Fingerprint menjadi tabel terpisah dengan history/audit trail.

Desain:
  - Satu mahasiswa dapat memiliki banyak RFID (tapi hanya satu yang aktif)
  - Satu mahasiswa dapat memiliki banyak fingerprint slot (multi-finger)
  - Credential dipisah dari StudentProfile agar mendukung:
    * KTM ganti/hilang tanpa mengubah profil
    * Multi-finger enrollment
    * Audit trail aktivasi/deaktivasi
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.student import StudentProfile


class RfidCredential(Base):
    """
    Credential RFID (KTM) mahasiswa.
    Satu mahasiswa bisa punya banyak entri (riwayat KTM lama, KTM baru)
    tapi hanya satu yang is_active=True.
    """
    __tablename__ = "rfid_credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    # UID hex dari chip MIFARE/RC522, uppercase, tanpa spasi
    # Contoh: "A1B2C3D4" atau "A1B2C3D4E5F6" (4/7 byte UID)
    uid: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Catatan deaktivasi, misal: "KTM hilang dilaporkan 2026-10-01"
    keterangan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship
    student: Mapped["StudentProfile"] = relationship(
        "StudentProfile", back_populates="rfid_credentials"
    )

    def __repr__(self) -> str:
        return f"<RfidCredential id={self.id} uid='{self.uid}' student_id={self.student_id} active={self.is_active}>"


class FingerprintCredential(Base):
    """
    Credential Fingerprint mahasiswa.
    Template fingerprint disimpan di memori flash AS608/R307 pada perangkat ESP32.
    Tabel ini mencatat slot mana (0-127 pada AS608) yang digunakan oleh mahasiswa mana,
    dan di perangkat mana template tersimpan.

    Multi-finger didukung: mahasiswa dapat mendaftarkan lebih dari satu jari
    (misal: telunjuk kiri dan kanan), masing-masing satu entri.
    """
    __tablename__ = "fingerprint_credentials"
    __table_args__ = (
        UniqueConstraint("device_id", "template_slot", name="uq_device_template_slot"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    # ID perangkat tempat template disimpan
    device_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # Slot nomor di sensor fingerprint (0-127 untuk AS608)
    template_slot: Mapped[int] = mapped_column(Integer, nullable=False)

    # Keterangan jari: "Telunjuk Kanan", "Telunjuk Kiri", dsb.
    finger_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    keterangan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship
    student: Mapped["StudentProfile"] = relationship(
        "StudentProfile", back_populates="fingerprint_credentials"
    )

    def __repr__(self) -> str:
        return (
            f"<FingerprintCredential id={self.id} student_id={self.student_id} "
            f"device='{self.device_id}' slot={self.template_slot} active={self.is_active}>"
        )
