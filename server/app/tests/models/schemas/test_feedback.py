from io import BytesIO

import pytest
from fastapi import UploadFile
from pydantic import ValidationError

from app.models.enums import FeedbackType
from app.models.schemas.feedback import CreateFeedbackRequest


def test_create_feedback_request():
    small_file = UploadFile(
        filename="small.txt",
        file=BytesIO(b"small"),
        size=1024,
    )

    request = CreateFeedbackRequest(
        type=FeedbackType.feedback,
        url="https://example.com/page",
        build="v1",
        title="UI feedback",
        description="Looks great overall",
        files=[small_file],
    )

    assert len(request.files) == 1
    assert request.files[0].filename == "small.txt"


def test_create_feedback_request_large_file():
    large_file = UploadFile(
        filename="large.bin",
        file=BytesIO(b"x"),
        size=(5 * 1024 * 1024) + 1,
    )

    with pytest.raises(ValidationError, match="File too large: large.bin"):
        CreateFeedbackRequest(
            type=FeedbackType.feature,
            url="https://example.com/feature",
            build="v1",
            title="Feature request",
            description="Please add this feature",
            files=[large_file],
        )
