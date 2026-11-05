"""SADITA — Repositories Package (OOP Clean Architecture)."""
from app.repositories.base import BaseRepository
from app.repositories.academic_repo import AcademicRepository
from app.repositories.attendance_repo import AttendanceRepository
from app.repositories.audit_repo import AuditRepository
from app.repositories.device_repo import DeviceRepository
from app.repositories.lms_repo import LMSRepository, LmsRepository
from app.repositories.user_repo import LecturerRepository, StudentRepository, UserRepository
from app.repositories.workflow_repo import WorkflowRepository

__all__ = [
    "BaseRepository",
    "AcademicRepository",
    "AttendanceRepository",
    "AuditRepository",
    "DeviceRepository",
    "LMSRepository",
    "LmsRepository",
    "LecturerRepository",
    "StudentRepository",
    "UserRepository",
    "WorkflowRepository",
]
