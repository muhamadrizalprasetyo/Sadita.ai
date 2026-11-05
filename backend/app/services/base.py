"""
SADITA — Generic Base Service (OOP Clean Architecture)
Provides standardized business logic layer orchestrating repositories.
"""
from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository

RepoType = TypeVar("RepoType", bound=BaseRepository)


class BaseService(Generic[RepoType]):
    """
    Kelas dasar service layer yang mengelola transaksi bisnis dan otorisasi.
    """

    def __init__(self, repository: RepoType):
        self._repo = repository

    @property
    def repository(self) -> RepoType:
        return self._repo

    def get_or_404(
        self,
        db: Session,
        entity_id: Any,
        entity_name: str = "Entitas",
    ) -> Any:
        """Ambil entitas berdasarkan ID atau lempar HTTP 404 jika tidak ditemukan."""
        entity = self._repo.get_by_id(db, entity_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{entity_name} dengan ID '{entity_id}' tidak ditemukan",
            )
        return entity

