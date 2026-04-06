from typing import Annotated, Self

from fastapi import File, UploadFile
from pydantic import BaseModel, Field, model_validator

from app.models.enums import FeedbackType
from app.models.schemas.types import (
    FeedbackBuild,
    FeedbackDescription,
    FeedbackTitle,
    FeedbackUrl,
)


class CreateFeedbackRequest(BaseModel):
    type: FeedbackType
    url: FeedbackUrl
    build: FeedbackBuild
    title: FeedbackTitle
    description: FeedbackDescription
    files: list[Annotated[UploadFile, File()]] = Field(default_factory=list[UploadFile])

    @model_validator(mode="after")
    def check_files(self) -> Self:
        for file in self.files:
            if (file.size or 0) > 5 * 1024 * 1024:  # 5 MiB
                raise ValueError(f"File too large: {file.filename}")
        return self
