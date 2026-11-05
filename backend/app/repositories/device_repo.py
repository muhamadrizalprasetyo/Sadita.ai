"""
SADITA — Device Repository (OOP Clean Architecture)
Data access layer for ESP32-S3 devices and hardware events.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceEvent
from app.models.device import DeviceStatus, SaditaDevice
from app.repositories.base import BaseRepository


class DeviceRepository(BaseRepository[SaditaDevice, Any, Any]):
    def __init__(self):
        super().__init__(SaditaDevice)

    def get_by_device_id(self, db: Session, device_id: str) -> Optional[SaditaDevice]:
        """Ambil data perangkat berdasarkan device_id (misal: SADITA-ESP32-LAB-IOT-01)."""
        stmt = select(SaditaDevice).where(SaditaDevice.device_id == device_id)
        return db.execute(stmt).scalars().first()

    def list_all_ordered(self, db: Session) -> List[SaditaDevice]:
        """Ambil seluruh perangkat berurutan berdasarkan nama."""
        stmt = select(SaditaDevice).order_by(SaditaDevice.nama)
        return list(db.execute(stmt).scalars().all())

    def list_device_events(
        self,
        db: Session,
        device_id: str,
        limit: int = 100,
    ) -> List[AttendanceEvent]:
        """Ambil riwayat log event MQTT perangkat."""
        stmt = (
            select(AttendanceEvent)
            .where(AttendanceEvent.device_id == device_id)
            .order_by(AttendanceEvent.received_at.desc())
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())

    def update_liveness(self, db: Session, cutoff_minutes: int = 5) -> int:
        """
        Optimasi batch SQL: Memperbarui perangkat yang heartbeat-nya kedaluwarsa
        menjadi OFFLINE secara langsung tanpa memuat semua objek ke memori.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=cutoff_minutes)
        stmt = (
            update(SaditaDevice)
            .where(
                SaditaDevice.status == DeviceStatus.ACTIVE,
                or_(
                    SaditaDevice.last_seen_at.is_(None),
                    SaditaDevice.last_seen_at < cutoff,
                ),
            )
            .values(status=DeviceStatus.OFFLINE)
        )
        result = db.execute(stmt)
        db.commit()
        return result.rowcount

    def count_offline(self, db: Session) -> int:
        """Hitung jumlah perangkat offline atau nonaktif."""
        stmt = (
            select(func.count(SaditaDevice.id))
            .where(SaditaDevice.status != DeviceStatus.ACTIVE)
        )
        return db.execute(stmt).scalar_one() or 0

