from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User

MAYA_ID = "11111111-1111-1111-1111-111111111111"
ALEX_ID = "22222222-2222-2222-2222-222222222222"
JORDAN_ID = "33333333-3333-3333-3333-333333333333"


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with TestingSession() as session:
        session.add_all(
            [
                User(
                    id=MAYA_ID,
                    name="Maya Chen",
                    email="maya@ajaia.demo",
                    avatar_color="#6d5dfc",
                ),
                User(
                    id=ALEX_ID,
                    name="Alex Morgan",
                    email="alex@ajaia.demo",
                    avatar_color="#0f9f82",
                ),
                User(
                    id=JORDAN_ID,
                    name="Jordan Lee",
                    email="jordan@ajaia.demo",
                    avatar_color="#e07a3f",
                ),
            ]
        )
        session.commit()
        yield session


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def as_user():
    def headers(user_id: str) -> dict[str, str]:
        return {"X-User-Id": user_id}

    return headers

