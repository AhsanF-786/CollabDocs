from __future__ import annotations

from sqlalchemy import exists, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Document, DocumentAccess, User
from app.schemas.document import DocumentResponse


class DocumentNotFoundError(Exception):
    """Raised when a document does not exist or is not visible to the current user."""


class OwnerRequiredError(Exception):
    """Raised when an operation is restricted to the document owner."""


def accessible_document_predicate(user_id: str):
    shared = exists().where(
        DocumentAccess.document_id == Document.id,
        DocumentAccess.user_id == user_id,
    )
    return or_(Document.owner_id == user_id, shared)


def list_documents(db: Session, user_id: str) -> list[Document]:
    statement = (
        select(Document)
        .where(accessible_document_predicate(user_id))
        .options(selectinload(Document.owner))
        .order_by(Document.updated_at.desc())
    )
    return list(db.scalars(statement).all())


def get_accessible_document(db: Session, document_id: str, user_id: str) -> Document:
    statement = (
        select(Document)
        .where(Document.id == document_id, accessible_document_predicate(user_id))
        .options(selectinload(Document.owner), selectinload(Document.access_entries))
    )
    document = db.scalar(statement)
    if document is None:
        raise DocumentNotFoundError
    return document


def require_owner(document: Document, user_id: str) -> None:
    if document.owner_id != user_id:
        raise OwnerRequiredError


def create_document(
    db: Session,
    *,
    owner: User,
    title: str,
    content_html: str = "<p></p>",
) -> Document:
    document = Document(
        title=title,
        content_html=content_html,
        owner_id=owner.id,
        owner=owner,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def serialize_document(document: Document, user_id: str) -> DocumentResponse:
    return DocumentResponse(
        id=document.id,
        title=document.title,
        content_html=document.content_html,
        owner=document.owner,
        current_user_access="owner" if document.owner_id == user_id else "editor",
        created_at=document.created_at,
        updated_at=document.updated_at,
    )

