"""Admin read API for registered SADITA devices and MQTT event audit logs."""
from typing import List

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.deps import DBSession, RequireAdmin
from app.models.attendance import AttendanceEvent
from app.models.device import SaditaDevice
from app.schemas.device import DeviceEventResponse, DeviceResponse

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceResponse], summary="Daftar perangkat SADITA")
def list_devices(_: RequireAdmin, db: DBSession) -> List[DeviceResponse]:
    devices = db.scalars(select(SaditaDevice).order_by(SaditaDevice.nama)).all()
    return [DeviceResponse.model_validate(device) for device in devices]


@router.get("/{device_id}", response_model=DeviceResponse, summary="Detail perangkat SADITA")
def get_device(device_id: str, _: RequireAdmin, db: DBSession) -> DeviceResponse:
    device = db.scalar(select(SaditaDevice).where(SaditaDevice.device_id == device_id))
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perangkat tidak ditemukan")
    return DeviceResponse.model_validate(device)


@router.get("/{device_id}/events", response_model=List[DeviceEventResponse], summary="Log MQTT perangkat")
def list_device_events(
    device_id: str,
    _: RequireAdmin,
    db: DBSession,
    limit: int = Query(100, ge=1, le=500),
) -> List[DeviceEventResponse]:
    events = db.scalars(
        select(AttendanceEvent)
        .where(AttendanceEvent.device_id == device_id)
        .order_by(AttendanceEvent.received_at.desc())
        .limit(limit)
    ).all()
    return [DeviceEventResponse.model_validate(event) for event in events]
