from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.queries.user import select_admin_users


async def test_select_admin_users(db_session: AsyncSession):
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
    db_session.add_all([admin_user, regular_user])
    await db_session.commit()

    result = await select_admin_users(db_session)

    usernames = [user.username for user in result]
    assert "svc_admin" in usernames
    assert "svc_regular" not in usernames
