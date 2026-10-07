"""
SADITA — Program Studi (Prodi) Model
Mewakili program studi / jurusan di UNIPI.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.academic import Course, CourseClass
    from app.models.student import StudentProfile
    from app.models.lecturer import LecturerProfile


class ProgramStudi(Base):
    """
    Program Studi / Jurusan di UNIPI.
    Contoh: Teknik Informatika, Sistem Informasi, Manajemen Informatika
    """
    __tablename__ = "program_studi"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kode: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    # Contoh: "TI", "SI", "MI"
    nama: Mapped[str] = mapped_column(String(150), nullable=False)
    # Contoh: "Teknik Informatika"
    jenjang: Mapped[str] = mapped_column(String(10), default="S1", nullable=False)
    # S1, D3, D4, S2
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deskripsi: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    mahasiswa: Mapped[List["StudentProfile"]] = relationship(
        "StudentProfile",
        back_populates="program_studi",
    )
    dosen: Mapped[List["LecturerProfile"]] = relationship(
        "LecturerProfile",
        back_populates="program_studi",
    )
    mata_kuliah: Mapped[List["Course"]] = relationship(
        "Course",
        back_populates="program_studi",
    )

    def __repr__(self) -> str:
        return f"<ProgramStudi id={self.id} kode='{self.kode}' nama='{self.nama}'>"
