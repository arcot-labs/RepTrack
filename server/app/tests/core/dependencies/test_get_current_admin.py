import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.dependencies import get_current_admin
from app.models.database.user import User
from app.models.errors import InsufficientPermissions
from app.models.schemas.user import UserPublic
from app.services.utilities.serializers import to_user_public


async def _get_admin(db_session: AsyncSession, settings: Settings) -> UserPublic:
    result = await db_session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    admin = result.scalar_one()
    adminPublic = to_user_public(admin)
    return adminPublic


async def test_get_current_admin(db_session: AsyncSession, settings: Settings):
    admin = await _get_admin(db_session, settings)
    admin = await get_current_admin(user=admin)

    assert admin.username == settings.admin.username
    assert admin.is_admin is True


async def test_get_current_admin_insufficient_permissions(
    db_session: AsyncSession, settings: Settings
):
    admin = await _get_admin(db_session, settings)
    admin.is_admin = False

    with pytest.raises(InsufficientPermissions):
        await get_current_admin(user=admin)
