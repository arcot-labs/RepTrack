from collections.abc import Sequence
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute, selectinload

from app.models.database.password_reset_token import PasswordResetToken
from app.models.database.registration_token import RegistrationToken


async def get_tokens_by_prefix[T: (RegistrationToken, PasswordResetToken)](
    model: type[T],
    load_option: InstrumentedAttribute[Any],
    prefix: str,
    db: AsyncSession,
) -> Sequence[T]:
    result = await db.execute(
        select(model)
        .options(selectinload(load_option))
        .where(model.token_prefix == prefix)
        .where(model.used_at.is_(None))
        .where(model.expires_at > func.now())
        .order_by(model.created_at.desc())
    )
    return result.scalars().all()


async def expire_tokens[T: (RegistrationToken, PasswordResetToken)](
    model: type[T],
    where_clause: list[Any],
    db: AsyncSession,
) -> None:
    await db.execute(
        update(model)
        .where(*where_clause, model.expires_at > func.now())
        .values(expires_at=func.now())
    )
