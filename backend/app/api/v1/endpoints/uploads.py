"""
SADITA — Secure File Upload API Endpoint
/api/v1/uploads
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import CurrentUser

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls",
    ".zip", ".rar", ".txt", ".csv", ".png", ".jpg", ".jpeg"
}

MAX_FILE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


class UploadResponse(BaseModel):
    file_url: str
    original_filename: str
    file_size_bytes: int
    content_type: Optional[str] = None


@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload file untuk tugas atau materi LMS",
    description=f"Maksimal ukuran file {settings.MAX_UPLOAD_SIZE_MB}MB. Ekstensi diizinkan: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
)
async def upload_file(
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> UploadResponse:
    # 1. Validate extension
    orig_name = file.filename or "unknown"
    ext = Path(orig_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe file '{ext}' tidak diizinkan. Format yang didukung: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # 2. Read and validate file size
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file melebihi batas maksimum {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # 3. Ensure upload directory exists
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 4. Save with safe UUID filename to prevent path traversal & overwrite
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = upload_dir / safe_filename
    with open(dest_path, "wb") as f:
        f.write(contents)

    file_url = f"/api/v1/uploads/files/{safe_filename}"
    return UploadResponse(
        file_url=file_url,
        original_filename=orig_name,
        file_size_bytes=file_size,
        content_type=file.content_type,
    )


@router.get(
    "/files/{filename}",
    summary="Download atau pratinjau file terunggah",
)
def get_uploaded_file(filename: str):
    # Prevent directory traversal
    safe_name = os.path.basename(filename)
    upload_dir = Path(settings.UPLOAD_DIR).resolve()
    target_file = (upload_dir / safe_name).resolve()

    if not str(target_file).startswith(str(upload_dir)) or not target_file.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File tidak ditemukan")

    return FileResponse(path=str(target_file))
