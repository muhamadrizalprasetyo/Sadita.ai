"""
SADITA — Authentication Endpoints
/api/v1/auth
"""
from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DBSession
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login pengguna",
    description="Autentikasi dengan email dan password, menghasilkan access token (JWT) dan refresh token.",
)
def login(req: LoginRequest, db: DBSession) -> TokenResponse:
    user = AuthService.authenticate(db, req.email, req.password)
    return AuthService.create_token_response(user)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Pendaftaran pengguna baru",
    description="Mendaftarkan pengguna baru dengan profil mahasiswa atau dosen.",
)
def register(req: RegisterRequest, db: DBSession) -> UserResponse:
    user = AuthService.register(db, req)
    return UserResponse.model_validate(user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Perbarui access token",
    description="Menghasilkan access token baru menggunakan refresh token yang valid.",
)
def refresh(req: RefreshTokenRequest, db: DBSession) -> TokenResponse:
    return AuthService.refresh(db, req.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Profil pengguna yang sedang login",
    description="Mengembalikan data akun, peran (role), dan profil akademik (mahasiswa/dosen).",
)
def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)
