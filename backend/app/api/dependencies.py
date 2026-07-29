from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    x_user_id: Annotated[str | None, Header()] = None,
) -> User:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Select a demo user before accessing documents.",
        )

    user = db.get(User, x_user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The selected demo user does not exist.",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

