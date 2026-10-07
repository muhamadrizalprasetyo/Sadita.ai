"""
SADITA — Sadita Device Model
Merepresentasikan perangkat ESP32-S3 yang terpasang di ruang kuliah.
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.academic import ClassRoom
    from app.models.attendance import AttendanceEvent


class DeviceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"           # Online & operational
    INACTIVE = "INACTIVE"       # Sengaja dinonaktifkan
    MAINTENANCE = "MAINTENANCE" # Sedang dalam perbaikan
    OFFLINE = "OFFLINE"         # Tidak merespons heartbeat


class SaditaDevice(Base):
    """
    Perangkat fisik ESP32-S3 SADITA.
    Setiap device terpasang di ruang kelas tertentu dan terdaftar dengan device_id unik.
    Device_id ini digunakan sebagai identitas dalam topik MQTT.
    Contoh device_id: "SADITA-ESP32-LAB-IOT-01"
    """
    __tablename__ = "sadita_devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    # Nama tampilan perangkat, misal: "ESP32 Lab IoT R301"
    nama: Mapped[str] = mapped_column(String(200), nullable=False)
    # Room tempat perangkat terpasang
    room_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("class_rooms.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[DeviceStatus] = mapped_column(
        Enum(DeviceStatus, name="device_status_enum", create_constraint=True),
        default=DeviceStatus.ACTIVE,
        nullable=False,
    )
    firmware_version: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    mac_address: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Waktu heartbeat terakhir diterima dari device
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Catatan fisik / lokasi pemasangan
    keterangan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    registered_at: Mapped[datetime] = mapped_column(
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
    room: Mapped[Optional["ClassRoom"]] = relationship("ClassRoom", back_populates="devices")
    attendance_events: Mapped[List["AttendanceEvent"]] = relationship(
        "AttendanceEvent",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<SaditaDevice id={self.id} device_id='{self.device_id}' status={self.status}>"
