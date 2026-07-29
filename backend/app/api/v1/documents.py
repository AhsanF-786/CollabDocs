from fastapi import APIRouter, HTTPException, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.document import (
    DocumentCreate,
    DocumentListResponse,
    DocumentResponse,
    DocumentUpdate,
)
from app.services.content import sanitize_editor_html
from app.services.documents import (
    DocumentNotFoundError,
    OwnerRequiredError,
    create_document,
    get_accessible_document,
    list_documents,
    require_owner,
    serialize_document,
)

router = APIRouter(prefix="/documents", tags=["documents"])


def not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")


@router.get("", response_model=DocumentListResponse)
def get_documents(db: DbSession, current_user: CurrentUser) -> DocumentListResponse:
    documents = list_documents(db, current_user.id)
    return DocumentListResponse(
        items=[serialize_document(document, current_user.id) for document in documents]
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def post_document(
    payload: DocumentCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> DocumentResponse:
    document = create_document(db, owner=current_user, title=payload.title)
    return serialize_document(document, current_user.id)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> DocumentResponse:
    try:
        document = get_accessible_document(db, document_id, current_user.id)
    except DocumentNotFoundError as error:
        raise not_found() from error
    return serialize_document(document, current_user.id)


@router.patch("/{document_id}", response_model=DocumentResponse)
def patch_document(
    document_id: str,
    payload: DocumentUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> DocumentResponse:
    try:
        document = get_accessible_document(db, document_id, current_user.id)
    except DocumentNotFoundError as error:
        raise not_found() from error

    changes = payload.model_dump(exclude_unset=True)
    if "title" in changes:
        document.title = changes["title"]
    if "content_html" in changes:
        document.content_html = sanitize_editor_html(changes["content_html"])
    db.commit()
    db.refresh(document)
    return serialize_document(document, current_user.id)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> Response:
    try:
        document = get_accessible_document(db, document_id, current_user.id)
        require_owner(document, current_user.id)
    except DocumentNotFoundError as error:
        raise not_found() from error
    except OwnerRequiredError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can delete this document.",
        ) from error

    db.delete(document)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
