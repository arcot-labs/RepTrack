from sqlalchemy.exc import IntegrityError

from app.core.database import UNIQUE_VIOLATION_CODE, is_unique_violation


class _DummyOrig:
    def __init__(self, sqlstate: str, msg: str):
        self.sqlstate = sqlstate
        self.msg = msg

    def __str__(self):
        return self.msg


def _make_error(sqlstate: str, msg: str):
    orig = _DummyOrig(sqlstate, msg)
    return IntegrityError(
        statement=None,
        params=None,
        orig=orig,  # pyright: ignore[reportArgumentType]
    )


def test_is_unique_violation():
    err = _make_error(
        UNIQUE_VIOLATION_CODE,
        "duplicate key value violates unique constraint 'uq_test' foo",
    )
    assert is_unique_violation(err, "uq_test") is True


def test_is_unique_violation_wrong_code():
    err = _make_error(
        "99999", "duplicate key value violates unique constraint 'uq_test' foo"
    )
    assert is_unique_violation(err, "uq_test") is False


def test_is_unique_violation_wrong_message():
    err = _make_error(UNIQUE_VIOLATION_CODE, "some other error")
    assert is_unique_violation(err, "uq_test") is False
