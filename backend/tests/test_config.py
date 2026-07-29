from app.core.config import Settings


def test_render_postgres_url_uses_psycopg_driver() -> None:
    settings = Settings(
        database_url="postgresql://collabdocs:secret@database.internal:5432/collabdocs"
    )

    assert settings.database_url == (
        "postgresql+psycopg://collabdocs:secret@database.internal:5432/collabdocs"
    )


def test_frontend_origins_parse_from_render_environment(monkeypatch) -> None:
    monkeypatch.setenv(
        "FRONTEND_ORIGINS",
        "https://collabdocs-ahsanf-786.vercel.app,https://preview.example.com",
    )

    settings = Settings(_env_file=None)

    assert settings.frontend_origins == [
        "https://collabdocs-ahsanf-786.vercel.app",
        "https://preview.example.com",
    ]
