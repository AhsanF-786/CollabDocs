from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.config import get_settings
from app.schemas.document import DocumentResponse
from app.services.content import FileImportError, import_text_file
from app.services.documents import create_document, serialize_document

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


@router.post("/import", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def import_document(
    db: DbSession,
    current_user: CurrentUser,
    file: Annotated[UploadFile, File()],
) -> DocumentResponse:
    content = await file.read(settings.max_upload_bytes + 1)
    await file.close()
    try:
        title, content_html = import_text_file(
            file.filename,
            content,
            settings.max_upload_bytes,
        )
    except FileImportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error

    document = create_document(
        db,
        owner=current_user,
        title=title,
        content_html=content_html,
    )
    return serialize_document(document, current_user.id)
