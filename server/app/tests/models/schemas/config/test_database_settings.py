from app.models.schemas.config import DatabaseSettings


def test_database_settings():
    settings = DatabaseSettings(
        host="db",
        port=5432,
        name="reptrack",
        user="app_user",
        password="secret",
    )

    assert settings.url == "postgresql+asyncpg://app_user:secret@db:5432/reptrack"
