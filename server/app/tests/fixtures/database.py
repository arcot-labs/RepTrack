from collections.abc import AsyncGenerator

import pytest
from alembic import context
from alembic.config import Config
from alembic.runtime.environment import EnvironmentContext
from alembic.script import ScriptDirectory
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    AsyncTransaction,
    async_sessionmaker,
    create_async_engine,
)
from testcontainers.postgres import (  # pyright: ignore[reportMissingTypeStubs]
    PostgresContainer,
)

from app.core.database import Base


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


def run_migrations(connection: Connection) -> None:
    config = Config("alembic.ini")
    # used by seed admin migration to prevent reading from .env
    config.attributes["is_testing"] = True
    script = ScriptDirectory.from_config(config)

    def upgrade(rev: str, _: EnvironmentContext):
        return script._upgrade_revs("head", rev)  # type: ignore

    with EnvironmentContext(
        config,
        script,
        fn=upgrade,
    ):
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


@pytest.fixture(scope="session")
async def db_engine(anyio_backend: str) -> AsyncGenerator[AsyncEngine]:
    _ = anyio_backend
    with PostgresContainer(image="postgres:18", driver="asyncpg") as postgres:
        url = postgres.get_connection_url()
        engine = create_async_engine(url, echo=False, pool_pre_ping=True)

        async with engine.begin() as conn:
            await conn.run_sync(run_migrations)

        yield engine
        await engine.dispose()


@pytest.fixture(scope="session")
async def db_connection(db_engine: AsyncEngine) -> AsyncGenerator[AsyncConnection]:
    async with db_engine.connect() as connection:
        yield connection


@pytest.fixture()
async def db_transaction(
    db_connection: AsyncConnection,
) -> AsyncGenerator[AsyncTransaction]:
    async with db_connection.begin() as transaction:
        try:
            yield transaction
        finally:
            if transaction.is_active:
                await transaction.rollback()


@pytest.fixture()
async def db_session_factory(
    db_connection: AsyncConnection,
    db_transaction: AsyncTransaction,
) -> AsyncGenerator[async_sessionmaker[AsyncSession]]:
    _ = db_transaction
    yield async_sessionmaker(
        bind=db_connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )


@pytest.fixture()
async def db_session(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession]:
    async with db_session_factory() as session:
        yield session
