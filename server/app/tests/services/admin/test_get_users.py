from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.models.schemas.user import UserPublic
from app.services.admin import get_users


async def test_get_users(session: AsyncSession):
    user = User(
        email="shape-user@example.com",
        username="shape_user",
        first_name="Shape",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    await session.commit()

    result = await get_users(session)
    item = next(entry for entry in result if entry.id == user.id)

    assert isinstance(item, UserPublic)
    assert item.username == "shape_user"
    assert item.email == "shape-user@example.com"
    assert item.first_name == "Shape"
    assert item.last_name == "User"
    assert isinstance(item.is_admin, bool)
