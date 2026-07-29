from fastapi import APIRouter
from sqlalchemy import select

from app.api.dependencies import DbSession
from app.models import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_demo_users(db: DbSession) -> list[User]:
    return list(db.scalars(select(User).order_by(User.name)).all())

