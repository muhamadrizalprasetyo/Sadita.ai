from typing import List
from fastapi import APIRouter, Query

from app.core.deps import DBSession, RequireAdmin
from app.schemas.device import DeviceEventResponse, DeviceResponse
from app.services.device_service import DeviceService

router = APIRouter(prefix="/devices", tags=["Devices"])
device_service = DeviceService()


@router.get("", response_model=List[DeviceResponse], summary="Daftar perangkat SADITA")
def list_devices(_: RequireAdmin, db: DBSession) -> List[DeviceResponse]:
    devices = device_service.list_devices(db)
    return [DeviceResponse.model_validate(device) for device in devices]


@router.get("/{device_id}", response_model=DeviceResponse, summary="Detail perangkat SADITA")
def get_device(device_id: str, _: RequireAdmin, db: DBSession) -> DeviceResponse:
    device = device_service.get_device(db, device_id)
    return DeviceResponse.model_validate(device)


@router.get("/{device_id}/events", response_model=List[DeviceEventResponse], summary="Log MQTT perangkat")
def list_device_events(
    device_id: str,
    _: RequireAdmin,
    db: DBSession,
    limit: int = Query(100, ge=1, le=500),
) -> List[DeviceEventResponse]:
    events = device_service.list_device_events(db, device_id=device_id, limit=limit)
    return [DeviceEventResponse.model_validate(event) for event in events]
