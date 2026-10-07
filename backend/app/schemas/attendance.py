"""
SADITA — Attendance Schemas
Request/Response schemas for sessions and records.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.attendance import AttendanceMethod, AttendanceStatus, SessionStatus
from app.schemas.user import StudentProfileResponse


# ---------------------------------------------------------------------------
# Attendance Session
# ---------------------------------------------------------------------------
class SessionCreateRequest(BaseModel):
    class_id: int
    session_number: int = Field(..., ge=1, le=16, description="Pertemuan ke-N (1 s.d. 16)")
    date: date
    topic: Optional[str] = Field(None, max_length=255, description="Topik / materi pertemuan")


class SessionOpenRequest(BaseModel):
    """Body untuk membuka sesi — opsional, dapat dipakai untuk menetapkan topik."""
    topic: Optional[str] = Field(None, max_length=255)


class SessionResponse(BaseModel):
    id: int
    class_id: int
    session_number: int
    date: date
    topic: Optional[str]
    status: SessionStatus
    opened_at: Optional[datetime]
    closed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Attendance Record
# ---------------------------------------------------------------------------
class AttendanceRecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    status: AttendanceStatus
    method: Optional[AttendanceMethod]
    check_in_time: Optional[datetime]
    notes: Optional[str]
    student: Optional[StudentProfileResponse]

    model_config = ConfigDict(from_attributes=True)


class ManualUpdateRequest(BaseModel):
    """Dosen memperbarui status kehadiran mahasiswa secara manual."""
    student_id: int
    status: AttendanceStatus
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# IoT Device → Backend MQTT Payload Schemas
# ---------------------------------------------------------------------------
class RfidScanPayload(BaseModel):
    """Payload dari perangkat SADITA saat kartu RFID ditap."""
    uid: str = Field(..., description="Hex string dari RFID UID, misal: A1B2C3D4")
    device_id: str = ""
    timestamp: Optional[str] = None


class FingerprintPayload(BaseModel):
    """Payload dari sensor sidik jari setelah verifikasi lokal di device."""
    result: str = Field(..., description="'match' jika cocok, 'no_match' jika gagal")
    template_id: Optional[int] = Field(None, description="Slot index yang dikenali, atau null")
    confidence: Optional[int] = Field(None, ge=0, le=100)
    rfid_uid: Optional[str] = Field(None, description="UID KTM yang discan sebelumnya di sesi ini")
    device_id: str = ""
    timestamp: Optional[str] = None


class AttendanceEventPayload(BaseModel):
    """
    Payload final dari perangkat SADITA setelah KTM + sidik jari berhasil.
    Dikirim ke topik: sadita/device/{device_id}/attendance
    """
    event_id: str = Field(..., description="UUID unik dari perangkat untuk idempotency")
    rfid_uid: str = Field(..., description="KTM RFID UID")
    fingerprint_template_id: int = Field(..., description="Slot sidik jari yang terdeteksi")
    confidence: int = Field(..., ge=0, le=100)
    timestamp: str = Field(..., description="ISO-8601 UTC timestamp dari device")
    session_id: Optional[int] = Field(
        None, description="ID sesi absensi yang sedang OPEN; null = device tidak tahu, backend lookup"
    )
    device_id: str = ""


class DeviceStatusPayload(BaseModel):
    """Heartbeat / status dari perangkat SADITA."""
    uptime_seconds: Optional[int] = None
    firmware_version: Optional[str] = None
    wifi_rssi: Optional[int] = None
    free_heap: Optional[int] = None
    session_open: Optional[bool] = Field(
        None, description="True jika device mengetahui ada sesi yang sedang berjalan"
    )
    timestamp: Optional[str] = None


# ---------------------------------------------------------------------------
# Backend → Device Command Schemas
# ---------------------------------------------------------------------------
class SessionOpenCommand(BaseModel):
    """Perintah backend ke device untuk membuka sesi absensi."""
    action: str = "session_open"
    session_id: int
    class_name: str
    late_threshold_minutes: int = 15  # Menit toleransi — terlambat setelah ini


class SessionCloseCommand(BaseModel):
    """Perintah backend ke device untuk menutup sesi absensi."""
    action: str = "session_close"
    session_id: int


class DeviceAckPayload(BaseModel):
    """Konfirmasi device atas perintah backend."""
    action: str
    session_id: Optional[int] = None
    status: str  # 'ok' | 'error'
    message: Optional[str] = None
