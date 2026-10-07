"""
SADITA — Lecturer Management Endpoints
/api/v1/lecturers
"""
from typing import List
from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, DBSession
from app.repositories.user_repo import LecturerRepository
from app.schemas.user import LecturerProfileResponse

router = APIRouter(prefix="/lecturers", tags=["Lecturers"])


@router.get(
    "",
    response_model=List[LecturerProfileResponse],
    summary="Daftar profil dosen",
)
def list_lecturers(
    _: CurrentUser,
    db: DBSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
) -> List[LecturerProfileResponse]:
    lecturers = LecturerRepository.list(db, skip=skip, limit=limit)
    return [LecturerProfileResponse.model_validate(l) for l in lecturers]


@router.get(
    "/{lecturer_id}",
    response_model=LecturerProfileResponse,
    summary="Detail dosen",
)
def get_lecturer_by_id(
    lecturer_id: int,
    _: CurrentUser,
    db: DBSession,
) -> LecturerProfileResponse:
    lecturer = LecturerRepository.get_by_id(db, lecturer_id)
    if not lecturer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dosen dengan ID {lecturer_id} tidak ditemukan",
        )
    return LecturerProfileResponse.model_validate(lecturer)
