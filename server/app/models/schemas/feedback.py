from typing import Annotated, Self

from fastapi import File, UploadFile
from pydantic import BaseModel, Field, model_validator

from app.models.enums import FeedbackType


class CreateFeedbackRequest(BaseModel):
    type: FeedbackType
    url: str = Field(min_length=1, max_length=1000)
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=10000)
    files: list[Annotated[UploadFile, File()]] = Field(default_factory=list[UploadFile])

    @model_validator(mode="after")
    def check_files(self) -> Self:
        for file in self.files:
            if (file.size or 0) > 5 * 1024 * 1024:  # 5 MiB
                raise ValueError(f"File too large: {file.filename}")
        return self
