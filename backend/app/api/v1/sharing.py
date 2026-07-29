from fastapi import APIRouter, HTTPException, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.document import ShareCreate, ShareResponse
from app.services.documents import (
    DocumentNotFoundError,
    OwnerRequiredError,
    get_accessible_document,
)
from app.services.sharing import ShareError, grant_access, list_shares, revoke_access

router = APIRouter(prefix="/documents/{document_id}/shares", tags=["sharing"])


def get_document_or_404(db: DbSession, document_id: str, user_id: str):
    try:
        return get_accessible_document(db, document_id, user_id)
    except DocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        ) from error


def owner_error(error: OwnerRequiredError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the document owner can manage sharing.",
    )


@router.get("", response_model=list[ShareResponse])
def get_document_shares(
    document_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> list[ShareResponse]:
    document = get_document_or_404(db, document_id, current_user.id)
    try:
        entries = list_shares(db, document, current_user.id)
    except OwnerRequiredError as error:
        raise owner_error(error) from error
    return [
        ShareResponse(user=entry.user, role="editor", created_at=entry.created_at)
        for entry in entries
    ]


@router.post("", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
def post_document_share(
    document_id: str,
    payload: ShareCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> ShareResponse:
    document = get_document_or_404(db, document_id, current_user.id)
    try:
        entry = grant_access(
            db,
            document=document,
            current_user_id=current_user.id,
            email=payload.email,
        )
    except OwnerRequiredError as error:
        raise owner_error(error) from error
    except ShareError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
    return ShareResponse(user=entry.user, role="editor", created_at=entry.created_at)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_share(
    document_id: str,
    user_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> Response:
    document = get_document_or_404(db, document_id, current_user.id)
    try:
        revoke_access(
            db,
            document=document,
            current_user_id=current_user.id,
            user_id=user_id,
        )
    except OwnerRequiredError as error:
        raise owner_error(error) from error
    except ShareError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)

