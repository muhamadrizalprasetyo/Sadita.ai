"""
SADITA — Generic Base Repository (OOP Clean Architecture)
Provides standardized CRUD data access layer for SQLAlchemy 2.0 models.
"""
from __future__ import annotations

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.db.session import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Kelas dasar berorientasi objek untuk seluruh operasi CRUD database.
    Menerapkan enkapsulasi penuh terhadap query SQLAlchemy.
    """

    def __init__(self, model: Type[ModelType]):
        self._model = model

    @property
    def model(self) -> Type[ModelType]:
        return self._model

    def get_by_id(self, db: Session, id: Any) -> Optional[ModelType]:
        """Ambil entitas tunggal berdasarkan primary key."""
        stmt = select(self._model).where(self._model.id == id)
        return db.execute(stmt).scalars().first()

    def list(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[ModelType]:
        """Ambil daftar entitas dengan filter opsional dan paginasi."""
        stmt = select(self._model)
        if filters:
            for field, value in filters.items():
                if hasattr(self._model, field) and value is not None:
                    stmt = stmt.where(getattr(self._model, field) == value)
        stmt = stmt.offset(skip).limit(limit)
        return list(db.execute(stmt).scalars().all())

    def count(self, db: Session, *, filters: Optional[Dict[str, Any]] = None) -> int:
        """Hitung jumlah total entitas sesuai filter."""
        stmt = select(func.count()).select_from(self._model)
        if filters:
            for field, value in filters.items():
                if hasattr(self._model, field) and value is not None:
                    stmt = stmt.where(getattr(self._model, field) == value)
        return db.execute(stmt).scalar_one() or 0

    def create(self, db: Session, *, obj_in: Union[CreateSchemaType, Dict[str, Any]]) -> ModelType:
        """Simpan entitas baru ke database."""
        if isinstance(obj_in, dict):
            create_data = obj_in
        else:
            create_data = obj_in.model_dump(exclude_unset=True)
        db_obj = self._model(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
    ) -> ModelType:
        """Perbarui entitas yang sudah ada."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: Any) -> Optional[ModelType]:
        """Hapus entitas berdasarkan primary key."""
        obj = self.get_by_id(db, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

