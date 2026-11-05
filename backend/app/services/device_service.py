"""
SADITA — Device Service (OOP Clean Architecture)
Business logic and device orchestration layer.
"""
from __future__ import annotations

from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceEvent
from app.models.device import SaditaDevice
from app.repositories.device_repo import DeviceRepository
from app.services.base import BaseService


class DeviceService(BaseService[DeviceRepository]):
    def __init__(self, repository: DeviceRepository | None = None):
        super().__init__(repository or DeviceRepository())

    def list_devices(self, db: Session) -> List[SaditaDevice]:
        """Perbarui status heartbeat offline secara massal lalu kembalikan daftar perangkat."""
        self._repo.update_liveness(db)
        return self._repo.list_all_ordered(db)

    def get_device(self, db: Session, device_id: str) -> SaditaDevice:
        """Ambil detail perangkat berdasarkan ID unik atau lempar HTTP 404."""
        self._repo.update_liveness(db)
        device = self._repo.get_by_device_id(db, device_id)
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Perangkat dengan ID '{device_id}' tidak ditemukan",
            )
        return device

    def list_device_events(
        self,
        db: Session,
        device_id: str,
        limit: int = 100,
    ) -> List[AttendanceEvent]:
        """Ambil riwayat event log MQTT untuk perangkat."""
        return self._repo.list_device_events(db, device_id=device_id, limit=limit)

