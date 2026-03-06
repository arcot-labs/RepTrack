from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.user import get_user_by_identifier


async def test_get_user_by_identifier_with_email(
    session: AsyncSession,
):
    collision_identifier = "collision@example.com"
    username_match = User(
        email="username-match@example.com",
        username=collision_identifier,
        first_name="Username",
        last_name="Match",
        password_hash="hash",
    )
    email_match = User(
        email=collision_identifier,
        username="email_match",
        first_name="Email",
        last_name="Match",
        password_hash="hash",
    )
    session.add_all([username_match, email_match])
    await session.commit()

    result = await get_user_by_identifier(collision_identifier, session)

    assert result is not None
    assert result.id == email_match.id


async def test_get_user_by_identifier_with_email_fallback(
    session: AsyncSession,
):
    identifier = "fallback@example.com"
    username_match = User(
        email="different@example.com",
        username=identifier,
        first_name="Username",
        last_name="Fallback",
        password_hash="hash",
    )
    session.add(username_match)
    await session.commit()

    result = await get_user_by_identifier(identifier, session)

    assert result is not None
    assert result.id == username_match.id


async def test_get_user_by_identifier_with_email_not_found(
    session: AsyncSession,
):
    result = await get_user_by_identifier("not_found@example.com", session)

    assert result is None


async def test_get_user_by_identifier_with_username(
    session: AsyncSession,
):
    collision_identifier = "collision_value"
    username_match = User(
        email="username-match@example.com",
        username=collision_identifier,
        first_name="Username",
        last_name="Match",
        password_hash="hash",
    )
    email_match = User(
        email=collision_identifier,
        username="email_match",
        first_name="Email",
        last_name="Match",
        password_hash="hash",
    )
    session.add_all([username_match, email_match])
    await session.commit()

    result = await get_user_by_identifier(collision_identifier, session)

    assert result is not None
    assert result.id == username_match.id


async def test_get_user_by_identifier_with_username_not_found(
    session: AsyncSession,
):
    collision_identifier = "collision_value"
    email_match = User(
        email=collision_identifier,
        username="email_match",
        first_name="Email",
        last_name="Match",
        password_hash="hash",
    )
    session.add(email_match)
    await session.commit()

    result = await get_user_by_identifier(collision_identifier, session)

    assert result is None
