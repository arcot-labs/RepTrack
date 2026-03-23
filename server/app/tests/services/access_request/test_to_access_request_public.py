from datetime import UTC, datetime

from app.models.database.access_request import AccessRequest
from app.models.enums import AccessRequestStatus
from app.models.schemas.access_request import AccessRequestPublic
from app.services.access_request import to_access_request_public


def test_to_access_request_public() -> None:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    updated_at = datetime(2026, 1, 2, tzinfo=UTC)
    access_req = AccessRequest(
        id=1,
        email="user@example.com",
        first_name="John",
        last_name="Doe",
        status=AccessRequestStatus.PENDING,
        created_at=created_at,
        updated_at=updated_at,
    )

    result = to_access_request_public(access_req)

    assert isinstance(result, AccessRequestPublic)
    assert result.id == 1
    assert result.email == "user@example.com"
    assert result.first_name == "John"
    assert result.last_name == "Doe"
    assert result.status == AccessRequestStatus.PENDING
    assert result.reviewed_at is None
    assert result.reviewer is None
    assert result.created_at == created_at
    assert result.updated_at == updated_at
