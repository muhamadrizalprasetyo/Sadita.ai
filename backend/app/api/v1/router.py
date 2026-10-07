"""
SADITA — API v1 Router Aggregator
"""
from fastapi import APIRouter

from app.api.v1.endpoints import academic, attendance, audit, auth, devices, health, lecturers, lms, students, users, workflow

router = APIRouter(prefix="/api/v1")

# Health
router.include_router(health.router)

# Authentication & Users
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(students.router)
router.include_router(lecturers.router)

# Academic
router.include_router(academic.router)

# Attendance & IoT
router.include_router(attendance.router)
router.include_router(devices.router)
router.include_router(workflow.router)
router.include_router(audit.router)

# LMS (Learning Management System)
router.include_router(lms.router)
