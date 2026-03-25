from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import PASSWORD_HASH, create_password_reset_token
from app.models.database.user import User
from app.services.token import get_tokens_by_prefix

# tests use PasswordResetToken
# RegistrationToken behavior is identical


async def _create_user(db_session: AsyncSession, suffix: str) -> User:
    user = User(
        email=f"get-token-{suffix}@example.com",
        username=f"get_token_{suffix}",
        first_name="Token",
        last_name="Tester",
        password_hash=PASSWORD_HASH.hash("password"),
    )
    db_session.add(user)
    await db_session.flush()
    return user


async def test_get_tokens_by_prefix_password_reset(db_session: AsyncSession):
    user = await _create_user(db_session, "basic")
    _, token = create_password_reset_token(user.id)
    db_session.add(token)
    await db_session.commit()

    tokens = await get_tokens_by_prefix(
        type(token),
        load_option=type(token).user,
        prefix=token.token_prefix,
        db=db_session,
    )

    assert len(tokens) == 1
    assert tokens[0].id == token.id
    assert tokens[0].user_id == user.id
    assert tokens[0].user.id == user.id


async def test_get_tokens_by_prefix_password_reset_condition(db_session: AsyncSession):
    target_user = await _create_user(db_session, "target")
    other_user = await _create_user(db_session, "other")

    _, active_token = create_password_reset_token(target_user.id)
    _, used_token = create_password_reset_token(target_user.id)
    _, expired_token = create_password_reset_token(target_user.id)
    _, other_prefix_token = create_password_reset_token(other_user.id)

    prefix = "prefix1"
    active_token.token_prefix = prefix
    used_token.token_prefix = prefix
    expired_token.token_prefix = prefix

    now = datetime.now(UTC)
    used_token.used_at = now
    expired_token.expires_at = now - timedelta(minutes=1)
    other_prefix_token.token_prefix = "prefix2"

    db_session.add_all([active_token, used_token, expired_token, other_prefix_token])
    await db_session.commit()

    tokens = await get_tokens_by_prefix(
        type(active_token),
        load_option=type(active_token).user,
        prefix=prefix,
        db=db_session,
    )

    assert [token.id for token in tokens] == [active_token.id]


async def test_get_tokens_by_prefix_password_reset_ordering(db_session: AsyncSession):
    user = await _create_user(db_session, "ordering")
    _, older_token = create_password_reset_token(user.id)
    _, newer_token = create_password_reset_token(user.id)

    prefix = "prefix"
    older_token.token_prefix = prefix
    newer_token.token_prefix = prefix

    now = datetime.now(UTC)
    older_token.created_at = now - timedelta(minutes=5)
    newer_token.created_at = now

    db_session.add_all([older_token, newer_token])
    await db_session.commit()

    tokens = await get_tokens_by_prefix(
        type(older_token),
        load_option=type(older_token).user,
        prefix=prefix,
        db=db_session,
    )

    assert [token.id for token in tokens] == [newer_token.id, older_token.id]
