from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.user import UserResponse


class DocumentCreate(BaseModel):
    title: str = Field(default="Untitled document", max_length=200)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return value.strip() or "Untitled document"


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    content_html: str | None = Field(default=None, max_length=2_000_000)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or "Untitled document"


class ShareCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class ShareResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserResponse
    role: Literal["editor"]
    created_at: datetime


class DocumentResponse(BaseModel):
    id: str
    title: str
    content_html: str
    owner: UserResponse
    current_user_access: Literal["owner", "editor"]
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]

