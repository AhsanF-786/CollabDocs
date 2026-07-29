from app.core.config import Settings


def test_render_postgres_url_uses_psycopg_driver() -> None:
    settings = Settings(
        database_url="postgresql://collabdocs:secret@database.internal:5432/collabdocs"
    )

    assert settings.database_url == (
        "postgresql+psycopg://collabdocs:secret@database.internal:5432/collabdocs"
    )
