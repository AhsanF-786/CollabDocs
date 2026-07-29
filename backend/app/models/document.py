from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.document_access import DocumentAccess
    from app.models.user import User


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (Index("ix_documents_owner_updated", "owner_id", "updated_at"),)

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False, default="Untitled document")
    content_html: Mapped[str] = mapped_column(Text, nullable=False, default="<p></p>")
    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    owner: Mapped[User] = relationship(back_populates="owned_documents")
    access_entries: Mapped[list[DocumentAccess]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )

