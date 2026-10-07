"""
SADITA — Attendance Models (v2)
AttendanceSession, AttendanceRecord, AttendanceEvent (raw IoT event log).

AttendanceEvent = raw event yang masuk dari device via MQTT (audit trail).
AttendanceRecord = status kehadiran final mahasiswa untuk satu sesi.

Flow:
  ESP32 → MQTT → Backend menerima RFID/fingerprint event
  → Backend simpan sebagai AttendanceEvent (audit trail)
  → Backend proses, update AttendanceRecord (status final)
  → MQTT → ESP32 kirim respons (OK/REJECT)
"""
from __future__ import annotations

import enum
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.academic import CourseClass
    from app.models.student import StudentProfile
    from app.models.device import SaditaDevice
    from app.models.lms import CourseLesson


class SessionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"   # Terjadwal, belum dibuka
    OPEN = "OPEN"             # Sesi aktif, presensi dibuka
    CLOSED = "CLOSED"         # Sesi selesai, presensi ditutup


class AttendanceStatus(str, enum.Enum):
    HADIR = "HADIR"
    TERLAMBAT = "TERLAMBAT"
    IZIN = "IZIN"
    SAKIT = "SAKIT"
    ALFA = "ALFA"


class AttendanceMethod(str, enum.Enum):
    """Metode verifikasi kehadiran."""
    RFID_FINGERPRINT = "RFID_FINGERPRINT"   # 2FA: RFID + Fingerprint (normal)
    FINGERPRINT_ONLY = "FINGERPRINT_ONLY"   # Untuk mahasiswa BELUM_MEMILIKI_KTM
    MANUAL_DOSEN = "MANUAL_DOSEN"           # Input manual oleh dosen
    MANUAL_ADMIN = "MANUAL_ADMIN"           # Override oleh admin


class AttendanceEventType(str, enum.Enum):
    """Jenis event raw dari device (untuk audit log)."""
    RFID_SCAN = "RFID_SCAN"                 # Tap RFID
    FINGERPRINT_MATCH = "FINGERPRINT_MATCH" # Fingerprint berhasil cocok
    FINGERPRINT_FAIL = "FINGERPRINT_FAIL"   # Fingerprint gagal
    RFID_UNKNOWN = "RFID_UNKNOWN"           # RFID tidak terdaftar
    ATTENDANCE_RECORDED = "ATTENDANCE_RECORDED"  # Presensi berhasil disimpan
    DEVICE_HEARTBEAT = "DEVICE_HEARTBEAT"   # Heartbeat / status device


class AttendanceSession(Base):
    """
    Satu sesi pertemuan kuliah.
    Status: SCHEDULED → OPEN → CLOSED
    Dosen membuka sesi (OPEN) secara manual atau otomatis terjadwal.
    """
    __tablename__ = "attendance_sessions"
    __table_args__ = (
        UniqueConstraint("class_id", "pertemuan_ke", name="uq_class_session_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("course_classes.id", ondelete="CASCADE"), nullable=False
    )
    pertemuan_ke: Mapped[int] = mapped_column(Integer, nullable=False)
    # Pertemuan ke-1 sampai ke-16
    tanggal: Mapped[date] = mapped_column(Date, nullable=False)
    topik: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status_enum", create_constraint=True),
        default=SessionStatus.SCHEDULED,
        nullable=False,
    )
    dibuka_pada: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ditutup_pada: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Catatan dosen untuk sesi ini
    catatan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    course_class: Mapped["CourseClass"] = relationship(
        "CourseClass", back_populates="attendance_sessions"
    )
    records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    events: Mapped[List["AttendanceEvent"]] = relationship(
        "AttendanceEvent",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    lessons: Mapped[List["CourseLesson"]] = relationship(
        "CourseLesson",
        back_populates="session",
        cascade="all, delete-orphan",
    )

    def __init__(self, **kwargs):
        if "session_number" in kwargs and "pertemuan_ke" not in kwargs:
            kwargs["pertemuan_ke"] = kwargs.pop("session_number")
        if "date" in kwargs and "tanggal" not in kwargs:
            kwargs["tanggal"] = kwargs.pop("date")
        if "topic" in kwargs and "topik" not in kwargs:
            kwargs["topik"] = kwargs.pop("topic")
        if "opened_at" in kwargs and "dibuka_pada" not in kwargs:
            kwargs["dibuka_pada"] = kwargs.pop("opened_at")
        if "closed_at" in kwargs and "ditutup_pada" not in kwargs:
            kwargs["ditutup_pada"] = kwargs.pop("closed_at")
        super().__init__(**kwargs)

    @property
    def session_number(self) -> int:
        return self.pertemuan_ke

    @session_number.setter
    def session_number(self, val: int):
        self.pertemuan_ke = val

    @property
    def date(self) -> date:
        return self.tanggal

    @date.setter
    def date(self, val: date):
        self.tanggal = val

    @property
    def topic(self) -> Optional[str]:
        return self.topik

    @topic.setter
    def topic(self, val: Optional[str]):
        self.topik = val

    @property
    def opened_at(self) -> Optional[datetime]:
        return self.dibuka_pada

    @opened_at.setter
    def opened_at(self, val: Optional[datetime]):
        self.dibuka_pada = val

    @property
    def closed_at(self) -> Optional[datetime]:
        return self.ditutup_pada

    @closed_at.setter
    def closed_at(self, val: Optional[datetime]):
        self.ditutup_pada = val

    def __repr__(self) -> str:
        return f"<AttendanceSession id={self.id} class_id={self.class_id} pertemuan={self.pertemuan_ke} status={self.status}>"


class AttendanceRecord(Base):
    """
    Status kehadiran FINAL mahasiswa untuk satu sesi pertemuan.
    Satu record per mahasiswa per sesi — ini yang digunakan untuk rekap dan laporan.
    """
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_session_student_attendance"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus, name="attendance_status_enum", create_constraint=True),
        default=AttendanceStatus.ALFA,
        nullable=False,
    )
    method: Mapped[Optional[AttendanceMethod]] = mapped_column(
        Enum(AttendanceMethod, name="attendance_method_enum", create_constraint=True),
        nullable=True,
    )
    check_in_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Catatan manual oleh dosen/admin
    catatan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # ID user yang melakukan override manual (dosen/admin)
    dioverride_oleh: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    dioverride_pada: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    session: Mapped["AttendanceSession"] = relationship(
        "AttendanceSession", back_populates="records"
    )
    student: Mapped["StudentProfile"] = relationship(
        "StudentProfile", back_populates="attendance_records"
    )

    def __init__(self, **kwargs):
        if "notes" in kwargs and "catatan" not in kwargs:
            kwargs["catatan"] = kwargs.pop("notes")
        super().__init__(**kwargs)

    @property
    def notes(self) -> Optional[str]:
        return self.catatan

    @notes.setter
    def notes(self, val: Optional[str]):
        self.catatan = val

    def __repr__(self) -> str:
        return f"<AttendanceRecord id={self.id} session_id={self.session_id} student_id={self.student_id} status={self.status}>"


class AttendanceEvent(Base):
    """
    Raw event log dari perangkat SADITA via MQTT.
    Setiap event yang masuk dari ESP32 disimpan di sini sebagai audit trail.
    Ini BUKAN status akhir — status akhir ada di AttendanceRecord.
    """
    __tablename__ = "attendance_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # ID perangkat yang mengirim event
    device_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    device_db_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("sadita_devices.id", ondelete="SET NULL"), nullable=True
    )
    # Sesi yang terkait (bisa null jika event masuk saat tidak ada sesi aktif)
    session_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("attendance_sessions.id", ondelete="SET NULL"), nullable=True
    )
    # Mahasiswa yang terkait (null jika RFID/FP tidak dikenal)
    student_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="SET NULL"), nullable=True
    )

    event_type: Mapped[AttendanceEventType] = mapped_column(
        Enum(AttendanceEventType, name="attendance_event_type_enum", create_constraint=True),
        nullable=False,
    )

    # Raw data dari event
    rfid_uid: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    fingerprint_slot: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fingerprint_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # UUID event dari device (idempotency key)
    event_uuid: Mapped[Optional[str]] = mapped_column(
        String(64), unique=True, nullable=True, index=True
    )

    # Hasil dari backend
    berhasil: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pesan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Waktu event terjadi di device (dari RTC)
    device_timestamp: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Waktu event diterima backend
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    device: Mapped[Optional["SaditaDevice"]] = relationship(
        "SaditaDevice", back_populates="attendance_events"
    )
    session: Mapped[Optional["AttendanceSession"]] = relationship(
        "AttendanceSession", back_populates="events"
    )
    student: Mapped[Optional["StudentProfile"]] = relationship("StudentProfile")

    def __repr__(self) -> str:
        return f"<AttendanceEvent id={self.id} type={self.event_type} device='{self.device_id}' uid='{self.rfid_uid}'>"
