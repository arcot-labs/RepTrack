import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas.user import UserPublic
from app.services.queries.user import select_users
from app.services.utilities.serializers import to_user_public

logger = logging.getLogger(__name__)


async def get_users(db_session: AsyncSession) -> list[UserPublic]:
    logger.info("Getting users")

    users = await select_users(db_session)
    return [to_user_public(user) for user in users]
