from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models import Document, DocumentAccess, User
from app.services.documents import OwnerRequiredError, require_owner


class ShareError(ValueError):
    """Raised when a sharing request is invalid."""


def list_shares(db: Session, document: Document, current_user_id: str) -> list[DocumentAccess]:
    require_owner(document, current_user_id)
    statement = (
        select(DocumentAccess)
        .where(DocumentAccess.document_id == document.id)
        .options(selectinload(DocumentAccess.user))
        .order_by(DocumentAccess.created_at)
    )
    return list(db.scalars(statement).all())


def grant_access(
    db: Session,
    *,
    document: Document,
    current_user_id: str,
    email: str,
) -> DocumentAccess:
    require_owner(document, current_user_id)
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise ShareError("No demo user exists with that email address.")
    if user.id == document.owner_id:
        raise ShareError("The owner already has access to this document.")
    if db.get(DocumentAccess, (document.id, user.id)) is not None:
        raise ShareError("This document is already shared with that user.")

    access = DocumentAccess(
        document_id=document.id,
        user_id=user.id,
        role="editor",
        granted_by=current_user_id,
        user=user,
    )
    db.add(access)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ShareError("This document is already shared with that user.") from error
    db.refresh(access)
    return access


def revoke_access(
    db: Session,
    *,
    document: Document,
    current_user_id: str,
    user_id: str,
) -> None:
    require_owner(document, current_user_id)
    access = db.get(DocumentAccess, (document.id, user_id))
    if access is None:
        raise ShareError("That user does not have access to this document.")
    db.delete(access)
    db.commit()


__all__ = [
    "OwnerRequiredError",
    "ShareError",
    "grant_access",
    "list_shares",
    "revoke_access",
]
