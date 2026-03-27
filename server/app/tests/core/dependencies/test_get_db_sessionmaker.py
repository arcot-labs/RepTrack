from app.core.dependencies import get_db_sessionmaker


def test_get_db_sessionmaker_cached():
    db_url = "postgresql+asyncpg://user:pw@localhost:5432/db"

    db_sessionmaker_a = get_db_sessionmaker(db_url, False)
    db_sessionmaker_b = get_db_sessionmaker(db_url, False)

    assert db_sessionmaker_a is db_sessionmaker_b


def test_get_db_sessionmaker_cache_key():
    db_url = "postgresql+asyncpg://user:pw@localhost:5432/db"

    non_prod_db_sessionmaker = get_db_sessionmaker(db_url, is_prod=False)
    prod_db_sessionmaker = get_db_sessionmaker(db_url, is_prod=True)

    assert non_prod_db_sessionmaker is not prod_db_sessionmaker
