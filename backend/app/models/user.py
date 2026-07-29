from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.document_access import DocumentAccess


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    avatar_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#4f46e5")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    owned_documents: Mapped[list[Document]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    document_access: Mapped[list[DocumentAccess]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="DocumentAccess.user_id",
    )
