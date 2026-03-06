from app.core.security import hash_secret


def test_hash_secret():
    secret = "my-super-secret"

    secret_hash = hash_secret(secret)

    assert isinstance(secret_hash, str)
    assert secret_hash != secret
    assert len(secret_hash) > 0
