from app.models.schemas.types import is_email_identifier


def test_is_email_identifier_true():
    assert is_email_identifier("user@example.com") is True


def test_is_email_identifier_false():
    assert is_email_identifier("some_username") is False
