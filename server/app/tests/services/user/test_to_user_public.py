from datetime import UTC, datetime

from app.models.database.user import User
from app.models.schemas.user import UserPublic
from app.services.user import to_user_public


def test_to_user_public() -> None:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    updated_at = datetime(2026, 1, 2, tzinfo=UTC)
    user = User(
        id=1,
        username="testuser",
        email="testuser@example.com",
        first_name="Test",
        last_name="User",
        password_hash="hashedpassword",
        is_admin=False,
        created_at=created_at,
        updated_at=updated_at,
    )

    result = to_user_public(user)

    assert isinstance(result, UserPublic)
    assert result.id == 1
    assert result.username == "testuser"
    assert result.email == "testuser@example.com"
    assert result.first_name == "Test"
    assert result.last_name == "User"
    assert result.is_admin is False
    assert result.created_at == created_at
    assert result.updated_at == updated_at
