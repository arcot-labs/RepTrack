from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.user import get_admin_users


async def test_get_admin_users(session: AsyncSession):
    admin_user = User(
        email="svc-admin@example.com",
        username="svc_admin",
        first_name="Service",
        last_name="Admin",
        password_hash="hash",
        is_admin=True,
    )
    regular_user = User(
        email="svc-regular@example.com",
        username="svc_regular",
        first_name="Service",
        last_name="Regular",
        password_hash="hash",
        is_admin=False,
    )
    session.add_all([admin_user, regular_user])
    await session.commit()

    result = await get_admin_users(session)

    usernames = [user.username for user in result]
    assert "svc_admin" in usernames
    assert "svc_regular" not in usernames
