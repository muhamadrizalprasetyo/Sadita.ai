"""
SADITA — Lecturer Profile Model (v2)
Dosen linked ke ProgramStudi.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.program_studi import ProgramStudi
    from app.models.academic import CourseClass


class LecturerProfile(Base):
    __tablename__ = "lecturer_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    prodi_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("program_studi.id", ondelete="SET NULL"),
        nullable=True,
    )
    nidn: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    gelar_depan: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Contoh: "Dr.", "Prof.", "Ir."
    gelar_belakang: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Contoh: "M.Kom.", "M.T.", "Ph.D."
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="lecturer_profile")
    program_studi: Mapped[Optional["ProgramStudi"]] = relationship(
        "ProgramStudi", back_populates="dosen"
    )
    classes: Mapped[List["CourseClass"]] = relationship(
        "CourseClass",
        back_populates="lecturer",
    )

    def __init__(self, **kwargs):
        if "prodi_id" not in kwargs:
            kwargs["prodi_id"] = 1
        kwargs.pop("department", None)
        super().__init__(**kwargs)

    @property
    def department(self) -> str:
        return self.program_studi.nama if self.program_studi else ""

    @department.setter
    def department(self, val: str):
        pass

    def __repr__(self) -> str:
        return f"<LecturerProfile id={self.id} nidn='{self.nidn}'>"
