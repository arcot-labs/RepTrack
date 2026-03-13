import pytest

from app.models.errors import HTTPError


def test_http_error():
    class TeapotError(HTTPError):
        status_code = 418
        code = "teapot"
        detail = "some detail"

    exc = TeapotError()

    assert exc.status_code == 418
    assert exc.detail == {
        "code": "teapot",
        "detail": "some detail",
    }


def test_http_error_missing_status_code():
    class MissingStatusCodeError(HTTPError):
        code = "missing_status_code"
        detail = "missing status code"

    with pytest.raises(
        RuntimeError, match="MissingStatusCodeError must define status_code"
    ):
        MissingStatusCodeError()


def test_http_error_missing_code():
    class MissingCodeError(HTTPError):
        status_code = 400
        detail = "missing code"

    with pytest.raises(RuntimeError, match="MissingCodeError must define code"):
        MissingCodeError()


def test_http_error_missing_detail():
    class MissingDetailError(HTTPError):
        status_code = 400
        code = "missing_detail"

    with pytest.raises(RuntimeError, match="MissingDetailError must define detail"):
        MissingDetailError()
