from app.models.schemas.config import DatabaseSettings


def test_database_settings_url_is_computed_from_fields():
    settings = DatabaseSettings(
        host="db",
        port=5432,
        name="reptrack",
        user="app_user",
        password="secret",
    )

    assert settings.url == "postgresql+asyncpg://app_user:secret@db:5432/reptrack"
