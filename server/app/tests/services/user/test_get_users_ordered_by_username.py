from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.user import get_users_ordered_by_username


async def test_get_users_ordered_by_username(db_session: AsyncSession):
    user = User(
        email="shape-user@example.com",
        username="shape_user",
        first_name="Shape",
        last_name="User",
        password_hash="hash",
    )
    db_session.add(user)
    await db_session.commit()

    result = await get_users_ordered_by_username(db_session)
    item = next(entry for entry in result if entry.id == user.id)

    assert isinstance(item, User)
    assert item.username == "shape_user"
    assert item.email == "shape-user@example.com"
    assert item.first_name == "Shape"
    assert item.last_name == "User"
    assert isinstance(item.is_admin, bool)


async def test_get_users_ordered_by_username_ordering(db_session: AsyncSession):
    db_session.add_all(
        [
            User(
                email="zeta@example.com",
                username="zeta",
                first_name="Zeta",
                last_name="User",
                password_hash="hash",
            ),
            User(
                email="alpha@example.com",
                username="alpha",
                first_name="Alpha",
                last_name="User",
                password_hash="hash",
            ),
        ]
    )
    await db_session.commit()

    result = await get_users_ordered_by_username(db_session)

    usernames = [user.username for user in result]
    assert usernames == sorted(usernames)
    alpha_index = usernames.index("alpha")
    zeta_index = usernames.index("zeta")
    assert alpha_index < zeta_index


async def test_get_users_ordered_by_username_read_only(db_session: AsyncSession):
    before_count = await db_session.scalar(select(func.count()).select_from(User))

    _ = await get_users_ordered_by_username(db_session)

    after_count = await db_session.scalar(select(func.count()).select_from(User))
    assert before_count == after_count
