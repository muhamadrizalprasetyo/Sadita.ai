from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DBSession
from app.core.security import hash_password, verify_password
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest, TokenResponse
from app.schemas.user import ChangePasswordRequest, UserResponse
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


@router.post(
    "/change-password",
    summary="Ubah kata sandi akun",
    description="Mengubah kata sandi pengguna yang sedang login dengan memverifikasi kata sandi saat ini.",
)
def change_password(
    req: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Konfirmasi kata sandi tidak cocok dengan kata sandi baru",
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kata sandi baru minimal 6 karakter",
        )
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kata sandi saat ini salah",
        )
    if verify_password(req.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kata sandi baru tidak boleh sama dengan kata sandi lama",
        )

    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Kata sandi berhasil diperbarui"}

