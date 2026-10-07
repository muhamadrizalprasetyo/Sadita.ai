"""Read schemas for physical SADITA devices and their MQTT audit events."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.attendance import AttendanceEventType
from app.models.device import DeviceStatus


class DeviceResponse(BaseModel):
    id: int
    device_id: str
    nama: str
    room_id: Optional[int]
    status: DeviceStatus
    firmware_version: Optional[str]
    ip_address: Optional[str]
    last_seen_at: Optional[datetime]
    keterangan: Optional[str]
    registered_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeviceEventResponse(BaseModel):
    id: int
    device_id: str
    session_id: Optional[int]
    student_id: Optional[int]
    event_type: AttendanceEventType
    rfid_uid: Optional[str]
    fingerprint_slot: Optional[int]
    fingerprint_confidence: Optional[float]
    berhasil: bool
    pesan: Optional[str]
    device_timestamp: Optional[datetime]
    received_at: datetime

    model_config = ConfigDict(from_attributes=True)
