import pytest

from app.core.security import PASSWORD_HASH, hash_secret, verify_secret


def test_verify_secret():
    secret = "correct-secret"
    secret_hash = hash_secret(secret)

    assert verify_secret(secret, secret_hash) is True
    assert verify_secret("wrong-secret", secret_hash) is False


def test_verify_secret_failure_invalid_hash():
    assert verify_secret("any-secret", "not-a-valid-hash") is False


def test_verify_secret_failure_exception_path(monkeypatch: pytest.MonkeyPatch):
    def raise_verify_error(_secret: str, _secret_hash: str):
        raise RuntimeError("forced verify failure")

    monkeypatch.setattr(PASSWORD_HASH, "verify", raise_verify_error)

    assert verify_secret("any-secret", "any-hash") is False
