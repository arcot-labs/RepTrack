from app.core.dependencies import get_sessionmaker


def test_get_sessionmaker_is_cached():
    db_url = "postgresql+asyncpg://user:pw@localhost:5432/db"

    sessionmaker_a = get_sessionmaker(db_url, False)
    sessionmaker_b = get_sessionmaker(db_url, False)

    assert sessionmaker_a is sessionmaker_b


def test_get_sessionmaker_cache_key_includes_arguments():
    db_url = "postgresql+asyncpg://user:pw@localhost:5432/db"

    non_prod_sessionmaker = get_sessionmaker(db_url, is_prod=False)
    prod_sessionmaker = get_sessionmaker(db_url, is_prod=True)

    assert non_prod_sessionmaker is not prod_sessionmaker
