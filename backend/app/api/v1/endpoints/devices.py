from typing import List

from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import select

from app.core.deps import DBSession, RequireAdmin
from app.models.academic import ClassRoom
from app.models.device import SaditaDevice
from app.schemas.device import DeviceEventResponse, DeviceResponse, DeviceUpdateRequest
from app.services.authorization_service import audit
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


@router.put("/{device_id}", response_model=DeviceResponse, summary="Perbarui perangkat SADITA / penempatan ruangan")
def update_device(
    device_id: str,
    payload: DeviceUpdateRequest,
    admin: RequireAdmin,
    db: DBSession,
    request: Request,
) -> DeviceResponse:
    device = db.scalar(select(SaditaDevice).where(SaditaDevice.device_id == device_id))
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perangkat tidak ditemukan")

    if payload.room_id is not None:
        room = db.get(ClassRoom, payload.room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ruangan tidak ditemukan")

    before = {
        "nama": device.nama,
        "room_id": device.room_id,
        "keterangan": device.keterangan,
    }

    if payload.nama is not None:
        device.nama = payload.nama
    if payload.room_id is not None:
        device.room_id = payload.room_id
    if payload.keterangan is not None:
        device.keterangan = payload.keterangan

    after = {
        "nama": device.nama,
        "room_id": device.room_id,
        "keterangan": device.keterangan,
    }

    audit(
        db,
        actor_id=admin.id,
        action="UPDATE_DEVICE",
        entity="device",
        entity_id=device.id,
        before=before,
        after=after,
        request=request,
    )
    db.commit()
    db.refresh(device)
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
