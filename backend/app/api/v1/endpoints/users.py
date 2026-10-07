"""
SADITA — User Management Endpoints
/api/v1/users
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import DBSession, RequireAdmin
from app.models.user import UserRole
from app.schemas.user import UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=List[UserResponse],
    summary="Daftar pengguna (Admin only)",
)
def list_users(
    _: RequireAdmin,
    db: DBSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    role: Optional[UserRole] = None,
) -> List[UserResponse]:
    users = UserService.list_users(db, skip=skip, limit=limit, role=role)
    return [UserResponse.model_validate(u) for u in users]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Detail pengguna (Admin only)",
)
def get_user_by_id(
    user_id: int,
    _: RequireAdmin,
    db: DBSession,
) -> UserResponse:
    user = UserService.get_current_user(db, user_id)
    return UserResponse.model_validate(user)
